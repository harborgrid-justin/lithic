# Enterprise Deployment, Security & Governance

What it takes to run Claude in a HIPAA-regulated EHR. This is the compliance and
operations companion to the prompting/architecture docs. Grounded in the
[Anthropic Trust Center](https://trust.anthropic.com),
[API & data retention](https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention),
and [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview).

> **Compliance posture is a legal/security decision, not just a code decision.** Confirm
> the current terms with Anthropic and your privacy/security officers before any PHI
> reaches a model. The pointers below are the engineering implications, not legal advice.

## 1. HIPAA, BAA, and PHI

- **Sign a BAA.** Claude is HIPAA-eligible for covered workloads *under a Business
  Associate Agreement* with Anthropic (or via your cloud provider — Bedrock/Vertex —
  under their BAA). PHI must not flow to the model until the BAA is in place. Verify
  current eligibility at the [Trust Center](https://trust.anthropic.com).
- **Zero Data Retention (ZDR).** Qualifying organizations can run with ZDR so inference
  inputs/outputs aren't retained. Prompt caching **is** ZDR-eligible; the **Batch API is
  not** — do not batch PHI under a ZDR requirement. See
  [API & data retention](https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention).
- **The BAA covers the inference call — not your logs, caches, or telemetry.** Those are
  your responsibility. This is why PHI redaction (below) is enforced before anything is
  logged.

## 2. PHI handling in this codebase

`llm-service.ts` already centralizes the controls. Keep them on and don't bypass them.

- **Redaction before logging.** `PHIRedactor` strips names, dates, MRNs, SSNs, phone,
  email, and addresses from anything written to the audit log. The model still receives
  the real text (it must, to be useful) — but logs/metrics never do.
  - Treat the regex redactor as **defense-in-depth, not a guarantee.** Free-text PHI is
    adversarial; pair it with the BAA, ZDR, and access controls. Tune patterns to the
    data you actually see and review periodically.
- **Minimize at the source.** Send the model the minimum necessary PHI (the relevant
  note section, not the whole chart). This is both a Privacy Rule principle and a token
  saving — see [`token-optimization.md`](./token-optimization.md).
- **No PHI in cache keys.** The response-cache key is a hash of the request; ensure keys
  and any persisted cache layer are treated as PHI if the request contained it.

## 3. Configuration & secrets

Drive everything from environment / `AIServiceConfig` — no hard-coded models or keys.
The AI block now lives in [`.env.example`](../../.env.example). Key variables:

```env
AI_PROVIDER=anthropic                  # anthropic | openai | azure-openai
AI_MODEL=claude-sonnet-4-6             # pinned model ID (see models overview)
ANTHROPIC_API_KEY=sk-ant-...           # never commit; inject via secrets manager
AI_RATE_LIMIT_PER_MINUTE=60
AI_MAX_TOKENS_PER_DAY=100000
AI_CACHE_TTL=3600000
AI_CACHE_MAX_SIZE=1000
AI_TIMEOUT=30000
AI_RETRIES=3
```

- **Secrets** come from a managed secrets store (AWS Secrets Manager, Vault, etc.), not
  `.env` files in production.
- **Pin the model ID.** Claude IDs are pinned snapshots; choose one deliberately and bump
  it on a schedule after re-running evals — don't drift.
- **Separate keys per environment** (dev/stage/prod) and per workload where possible, so
  spend and blast radius are attributable.

## 4. Rate limiting, retries, timeouts

Already implemented in `LLMService` — operate, don't reinvent:

- Per-minute / per-hour request caps and a per-day token cap (`RateLimiter`).
- Per-endpoint API limits (summarize 20/min, coding 15/min, assist 30/min).
- Exponential backoff on retries and a hard request timeout.
- **Tune these to your provider tier and budget.** They are cost and abuse controls as
  much as stability controls. Consider the [Priority Tier](https://platform.claude.com/docs/en/api/service-tiers)
  for predictable latency on clinician-facing paths.

## 5. Observability & cost governance

You can't govern what you don't measure. Emit (PHI-redacted) per call:

- Model ID, feature/endpoint, latency, success/error, finish reason.
- `input_tokens`, `output_tokens`, and **`cache_read_input_tokens` /
  `cache_creation_input_tokens`** — the cache-health signal that proves the optimization
  in [`token-optimization.md`](./token-optimization.md) is working.
- Estimated cost per request and rolling spend per feature.

Then:
- Set **budget alerts** per feature and per environment.
- Track **cache hit ratio** (reads ≫ writes is the goal) and **cost per encounter**.
- Pipe the existing audit log to a durable, access-controlled sink in production (the
  `AuditLogger` has a hook for this — it currently no-ops in prod).

## 6. Deployment options (provider-independent code)

Identical Claude model IDs are available across:

- **Claude API** (direct) — simplest; BAA + ZDR via Anthropic.
- **AWS Bedrock** — BAA and data residency under AWS; global vs. regional endpoints
  control routing. Useful if the rest of Lithic already runs in AWS (S3/DICOM, etc.).
- **Google Vertex AI** / **Microsoft Foundry** — same model family under those clouds'
  agreements.

Because everything funnels through `ILLMProvider`, the deployment/data-residency decision
is a config + provider-implementation choice, not an application rewrite. Match the choice
to where your BAA and data-residency obligations already sit.

## 7. Reliability & failure modes

- **Graceful degradation.** If the model is unavailable or rate-limited, AI features must
  fail *soft* — the EHR's core clinical workflows cannot depend on an AI suggestion being
  available. Surface a clear "AI unavailable" state, never a blocked chart.
- **Human-in-the-loop for writes.** AI output is advisory. A licensed user approves before
  any code, diagnosis, or note enters the record. (See [`agents.md`](./agents.md).)
- **Provider fallback (optional).** The multi-provider abstraction allows failover to a
  secondary provider/model; if you enable it, ensure the fallback is also under BAA/ZDR.

## 8. Pre-production governance checklist

- [ ] BAA in place with Anthropic (or cloud provider); ZDR configured if required
- [ ] PHI redaction verified on every log/metric path; no PHI in cache keys or telemetry
- [ ] Model IDs pinned; bump process tied to an eval re-run
- [ ] Secrets in a managed store, separated per environment
- [ ] Rate limits, token caps, timeouts tuned to tier and budget
- [ ] Cost + cache-hit metrics emitted; budget alerts configured
- [ ] AI features degrade gracefully and require human approval to write
- [ ] Deployment surface (API / Bedrock / Vertex) matches data-residency obligations
