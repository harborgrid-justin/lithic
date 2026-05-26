# LLM Engineering Guidance (Claude)

Enterprise-grade guidance for building and operating the Lithic Healthcare Platform's
AI features on **Anthropic Claude**. This suite is the canonical reference for model
selection, prompting, agent architecture, code layout, token economics, and the
security/compliance posture required for a HIPAA-regulated EHR.

All recommendations are grounded in Anthropic's published documentation. Primary
sources are linked inline and consolidated under [References](#references). When this
guidance and the Anthropic docs disagree, **the Anthropic docs win** — they are the
source of truth and change faster than this repo.

> Scope: this is product/application guidance for the code under `src/lib/ai/`,
> `src/components/ai/`, and `src/app/api/ai/`. It is provider-agnostic where the
> abstraction allows, but **Claude is the recommended default** for clinical workloads
> (see [Why Claude](#why-claude-for-lithic)).

## Documents in this suite

| Doc | What it covers |
|-----|----------------|
| [`claude-best-practices.md`](./claude-best-practices.md) | Choosing a model, prompting, XML structure, examples, thinking/effort, structured output, the official SDK |
| [`agents.md`](./agents.md) | Workflows vs. agents, the building-block patterns, Lithic's clinical agent catalog, tool design, sub-agents |
| [`folder-structure.md`](./folder-structure.md) | The canonical module layout for LLM code and where new agents/prompts/providers go |
| [`token-optimization.md`](./token-optimization.md) | Prompt caching, Batch API, model right-sizing, output budgeting, context hygiene — maximizing useful tokens, minimizing waste |
| [`enterprise.md`](./enterprise.md) | HIPAA/BAA, Zero Data Retention, PHI handling, rate limiting, observability, governance, deployment on Bedrock/Vertex |

## Model quick reference

Current generally available Claude models (verify against the
[models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
before pinning — IDs and pricing change).

| Model | API ID | Context | Max output | Price (in / out per MTok) | Use it for |
|-------|--------|---------|------------|---------------------------|------------|
| **Claude Opus 4.7** | `claude-opus-4-7` | 1M | 128k | $5 / $25 | Hardest reasoning, long-horizon agentic work, complex differential diagnosis |
| **Claude Sonnet 4.6** | `claude-sonnet-4-6` | 1M | 64k | $3 / $15 | **Default** for most clinical features: summarization, coding, documentation |
| **Claude Haiku 4.5** | `claude-haiku-4-5` | 200k | 64k | $1 / $5 | High-volume, latency-sensitive, cheap classification/extraction |

Pinning: every Claude model ID is a pinned snapshot. From the 4.6 generation onward the
IDs are dateless but still pinned (not evergreen). Pin an explicit ID in config; never
rely on an implicit "latest". See
[Model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions).

## Why Claude for Lithic

- **HIPAA-eligible** under a Business Associate Agreement, and **Zero Data Retention**
  is available for qualifying organizations — both prerequisites for processing PHI.
  See [`enterprise.md`](./enterprise.md).
- **1M-token context** on Opus 4.7 / Sonnet 4.6 fits long encounters, prior notes, and
  guideline corpora without aggressive truncation.
- **Prompt caching** turns large, stable clinical system prompts and guideline context
  into a ~0.1x read cost, which is the single biggest lever on our spend. See
  [`token-optimization.md`](./token-optimization.md).
- **Multi-cloud**: identical model IDs on the Claude API, AWS Bedrock, Google Vertex AI,
  and Microsoft Foundry, so the BAA/data-residency choice is independent of the code.

## Five rules that matter most

1. **Right-size the model.** Default to Sonnet 4.6. Escalate to Opus 4.7 only for tasks
   that measurably need it; drop to Haiku 4.5 for bulk extraction/classification.
2. **Cache the stable prefix.** System prompts, tool definitions, and guideline context
   belong behind a cache breakpoint. Never let a timestamp or per-request field sit
   inside the cached prefix.
3. **Budget output.** Set `max_tokens` to the real ceiling for the task. Output tokens
   cost 5x input; runaway generations are the most common source of waste.
4. **Never send raw PHI to logs.** Redaction is enforced in `llm-service.ts`; keep it on.
   Inference payloads to Claude are covered by the BAA, but logs and caches are not.
5. **Keep agents as simple as the task allows.** Prefer a single well-prompted call or a
   fixed workflow over an autonomous loop. Add orchestration only when the task is
   genuinely open-ended. See [`agents.md`](./agents.md).

## References

Anthropic documentation (the authoritative sources for everything here):

- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [API & data retention (ZDR)](https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention)
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (engineering blog)
- [Anthropic Trust Center](https://trust.anthropic.com) (HIPAA, BAA, certifications)
