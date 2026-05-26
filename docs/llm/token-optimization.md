# Token Optimization: Maximize Useful Tokens, Minimize Waste

Token spend is the dominant variable cost of the AI features. This doc is the playbook
for getting the most value per token. Grounded in Anthropic's
[Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching),
[Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing),
and [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) docs.

## The cost model in one line

`cost ≈ (input_tokens × in_price) + (output_tokens × out_price)`, where **output is ~5x
input** ($25 vs $5 per MTok on Opus 4.7; $15 vs $3 on Sonnet 4.6). So the three levers,
in order of impact:

1. **Make repeated input nearly free** → prompt caching (0.1x reads).
2. **Stop paying for output you don't need** → `max_tokens` budgets + concise prompting.
3. **Right-size the model** → don't run Opus where Haiku suffices.

A fourth lever applies to anything non-interactive: **Batch API = 50% off**.

## 1. Prompt caching (the biggest lever)

Caching reuses a prompt *prefix* across requests. A cache **read costs 0.1x** the base
input price; a cache **write costs 1.25x** (5-minute TTL) or **2.0x** (1-hour TTL). For
our large, stable clinical system prompts and guideline context, this is the difference
between affordable and not.

### Minimum cacheable tokens

A prefix below the minimum is silently *not* cached (no error). Minimums by model:

| Model | Minimum cacheable tokens |
|-------|--------------------------|
| Opus 4.7 / 4.6 / 4.5 | 4,096 |
| Sonnet 4.6 / 4.5 | 1,024 |
| Haiku 4.5 | 4,096 |

Implication: pile the stable, reusable content (system prompt, tool definitions,
guidelines, format rules, few-shot examples) into the prefix so it clears the threshold
and earns the discount.

### What to cache, and the ordering rule

Cache invalidation is **hierarchical**: `tools → system → messages`. Put the most stable
content first so a change downstream doesn't blow away the whole cache.

```
[ tool definitions ]      ← changes rarely        ┐
[ system prompt ]         ← changes per release    │ cache this prefix
[ guideline / RAG context]← changes daily/hourly   ┘  (breakpoint here)
[ per-request PHI / note ]← changes every request  ← NOT cached
[ user message ]          ← changes every request  ← NOT cached
```

**Golden rule:** the cache breakpoint goes on the **last stable block**. Never put a
timestamp, request ID, patient ID, or the incoming message inside the cached prefix — the
hash changes every call and you pay the write cost with zero reads. This is the #1 caching
mistake.

### How to set it

Prefer **automatic caching**: pass `cache_control: { type: "ephemeral" }` at the top
level and Anthropic places/advances the breakpoint at the last cacheable block. For
finer control (e.g. tools change at a different cadence than guidelines), set explicit
breakpoints on up to **4** content blocks.

```ts
system: [
  { type: 'text', text: TOOL_AND_FORMAT_RULES },               // stable
  { type: 'text', text: GUIDELINE_CONTEXT,
    cache_control: { type: 'ephemeral' } },                    // breakpoint on last stable block
],
messages: [{ role: 'user', content: encounterNote }],          // volatile, after breakpoint
```

### TTL choice

- **5-minute (default):** refreshed for free on each hit. Right for bursty,
  back-to-back requests (a clinician working through one chart).
- **1-hour (2x write):** worth it when the same prefix is reused less often than every 5
  minutes but still many times an hour (a shared guideline corpus across users), or for
  latency-sensitive agentic flows.

### Pre-warm to kill first-request latency

Load a big system prompt into cache *before* users arrive with a `max_tokens: 0` call —
it populates `cache_creation_input_tokens` and returns no output, so you pay the write
once and every real request reads cheaply.

### Measure it

Watch `cache_read_input_tokens` and `cache_creation_input_tokens` in the usage object.
Remember `input_tokens` reports **only tokens after the last breakpoint**, so:
`total = cache_read + cache_creation + input_tokens`. A healthy cache shows reads ≫
writes. Wire these into the audit/metrics path (see [`enterprise.md`](./enterprise.md)).

### Fit caching into Lithic's existing cache

`llm-service.ts` already has an in-memory **response** cache (exact-match, TTL, FIFO).
That's complementary, not redundant:
- **Response cache** = skip the API call entirely for identical requests.
- **Prompt cache** = cheaper input tokens when the request differs but shares a prefix.
Keep the response cache for idempotent, repeatable calls; rely on prompt caching for the
long-prefix clinical calls that vary only in the trailing note.

## 2. Budget output tokens

Output is the expensive half. For every call:

- Set `max_tokens` to the **realistic ceiling**, not the model max. A 150-word summary
  needs ~250 tokens, not 4,000.
- Ask for concision and *show* a concise example — positive examples beat "don't ramble."
- Use **extended thinking only when it earns its keep**; thinking tokens are billed.
  Skip it for extraction/lookups; use it for differentials and reconciliation.
- On Opus 4.7, tune the **effort** parameter: `low`/`medium` for well-scoped tasks (it
  scopes work tightly and spends fewer tokens), `high`/`xhigh` for genuinely hard work.

## 3. Right-size the model

| Workload | Don't | Do | Rough saving |
|----------|-------|----|--------------|
| Bulk PHI tagging / classification | Opus 4.7 | Haiku 4.5 | ~5x cheaper input, ~5x output |
| Standard summarize / code / document | Opus 4.7 | Sonnet 4.6 | ~40% cheaper |
| Genuinely hard reasoning | Sonnet 4.6 | Opus 4.7 (only here) | quality where it counts |

Run a small eval set before committing a feature to a model. The cheapest model that
passes your quality bar is the correct one.

## 4. Batch the non-interactive work — 50% off

The [Message Batches API](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
processes large request volumes **asynchronously at 50% of standard cost**, with most
batches finishing in under an hour. It **stacks with prompt caching**. Ideal Lithic uses:

- Overnight quality-gap detection across a patient panel.
- Bulk re-summarization or re-coding after a guideline update.
- Large eval runs when tuning prompts/models.

Use it for anything where a sub-hour turnaround is acceptable; keep synchronous calls for
clinician-facing, real-time interactions. (Note: Batch is **not** ZDR-eligible — see
[`enterprise.md`](./enterprise.md) before batching PHI.)

## 5. Context hygiene (don't pay to re-read the chart)

- **Retrieve, don't dump.** Pull the relevant prior notes/labs (RAG) instead of pasting
  the entire chart. Less input = less cost and better focus.
- **Layout for caching:** long, stable documents at the top (also the prompting best
  practice); volatile query last.
- **Trim conversation history.** In multi-turn assistant sessions, summarize or window
  old turns instead of resending everything each call.
- **De-duplicate.** Don't include the same guideline text in both the system prompt and
  the context block.

## Anti-patterns (waste to hunt down)

- ❌ A per-request value (timestamp, patient ID) inside the cached prefix → cache never
  hits; you pay write cost forever.
- ❌ `max_tokens` left at the model maximum "to be safe" → invites runaway, expensive
  generations.
- ❌ Opus for classification/extraction → 5x overspend for no quality gain.
- ❌ Synchronous calls for overnight bulk jobs → leaving the 50% Batch discount on the table.
- ❌ Pasting the whole chart every turn → linear cost growth, degraded focus.
- ❌ Extended thinking on trivial tasks → paying for reasoning tokens you don't need.
- ❌ Prefix below the cache minimum → no caching at all, silently.

## Optimization checklist

- [ ] Stable prefix (tools → system → guidelines) is cached; volatile data sits after the breakpoint
- [ ] Prefix clears the model's minimum cacheable token count
- [ ] TTL chosen for the access pattern (5m bursty / 1h spread-out)
- [ ] `max_tokens` set to a real ceiling; concise output requested with an example
- [ ] Cheapest model that passes the eval is in use
- [ ] Non-interactive jobs run through the Batch API
- [ ] Context retrieved, not dumped; history windowed
- [ ] `cache_read` vs `cache_creation` monitored in metrics
