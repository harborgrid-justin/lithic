# Folder & Module Structure for LLM Code

The canonical layout for AI/LLM code in Lithic, and the rules for where new code goes.
A predictable structure keeps prompts, providers, and orchestration separable — which is
what lets you swap models, cache prefixes, and test prompts in isolation.

## Current layout (as built)

```
src/
├── types/
│   └── ai.ts                     # All LLM/AI type definitions (providers, requests,
│                                 # responses, config, audit, errors)
├── lib/
│   └── ai/
│       ├── llm-service.ts        # Provider-agnostic orchestration: cache, rate limit,
│       │                         # PHI redaction, audit, retries, timeout, streaming
│       ├── providers/            # One file per provider, all implement ILLMProvider
│       │   ├── anthropic.ts      #   Claude (recommended default)
│       │   ├── openai.ts
│       │   └── azure-openai.ts
│       ├── prompts/              # Versioned prompt templates, no business logic
│       │   ├── clinical-prompts.ts
│       │   └── coding-prompts.ts
│       ├── clinical-summarizer.ts        # Clinical AI services (workflows/agents).
│       ├── coding-assistant.ts           # Each composes prompts + llm-service into a
│       ├── documentation-assistant.ts    # task-specific capability. See agents.md for
│       ├── diagnosis-suggester.ts        # how each maps to an Anthropic building block.
│       ├── med-reconciliation.ts
│       └── quality-gap-detector.ts
├── components/
│   └── ai/                       # React UI: assistant panel, suggestion cards, helpers
│       ├── AIClinicalAssistant.tsx
│       ├── AICodingSuggestions.tsx
│       ├── AIDocumentationHelper.tsx
│       └── AISuggestionCard.tsx
├── hooks/
│   └── useAIAssistant.ts         # Client hooks: useAIAssistant, useClinicalSummarization,
│                                 # useCodingSuggestions, useDocumentationAssistant,
│                                 # useStreamingResponse
└── app/
    └── api/
        └── ai/                   # HTTP boundary (auth, rate limit, validation, routing)
            ├── assist/route.ts   #   router endpoint → delegates by mode
            ├── summarize/route.ts
            └── suggest-codes/route.ts
```

## Layering rules

Dependencies point **downward only**. A layer may import the layer(s) below it, never
above.

```
components/ai  ──►  hooks  ──►  app/api/ai  ──►  lib/ai services  ──►  llm-service  ──►  providers
                                                        │
                                                        └──►  prompts        types/ai (used by all)
```

- **`types/ai.ts`** — pure types. No runtime, no imports from `lib`. Everything depends
  on it; it depends on nothing.
- **`providers/`** — translate the neutral `LLMRequest`/`LLMResponse` to/from one vendor
  API. Implement `ILLMProvider`. **No clinical logic, no prompt text, no PHI policy
  here.** Provider files are the only place a vendor SDK or endpoint is referenced.
- **`llm-service.ts`** — the single choke point for every model call. Cross-cutting
  concerns (caching, rate limiting, PHI redaction, audit, retries, timeouts) live here so
  no service can bypass them. Add new cross-cutting behavior here, not in services.
- **`prompts/`** — template strings + variable substitution only. No network calls, no
  conditionals beyond filling slots. This makes prompts reviewable and cacheable as
  stable prefixes. Treat prompt edits like code changes (review + version note).
- **`lib/ai/<service>.ts`** — one capability per file. Compose prompts + `llm-service`.
  This is where the "agent vs workflow" decision is realized.
- **`app/api/ai/`** — the trust boundary. Authentication, authorization, input
  validation, rate-limit headers, and request→service routing happen here and nowhere
  upstream of it. PHI must be validated/authorized before it reaches a service.
- **`components/ai` + `hooks`** — presentation and client state only. They call the API
  routes; they never hold API keys or talk to providers directly.

## Where do I put…?

| You're adding… | Put it in… | And remember |
|----------------|-----------|--------------|
| A new clinical capability | `src/lib/ai/<name>.ts` + a route in `src/app/api/ai/<name>/` | Decide the pattern first (see `agents.md`); pick a model |
| A new prompt | `src/lib/ai/prompts/<domain>-prompts.ts` | Keep the stable part first so it caches; version it |
| Support for another vendor | `src/lib/ai/providers/<vendor>.ts` implementing `ILLMProvider` | Register it in `LLMService.initializeProvider` |
| A cross-cutting concern (e.g. a new cache tier, cost meter) | `llm-service.ts` | Every call must inherit it; don't scatter it |
| A new shared type | `src/types/ai.ts` | No runtime imports |
| UI for an AI feature | `src/components/ai/` + a hook in `src/hooks/` | Stream where it helps perceived latency |

## Conventions

- **Prompts are assets, not strings-in-code-flow.** Keep them declarative in `prompts/`
  with named exports (`CLINICAL_SUMMARY_BRIEF`, `ICD10_SUGGESTION`, …) so they can be
  reviewed, diffed, cached, and eventually evaluated.
- **One provider concern per provider file.** If you find a model name or vendor header
  outside `providers/` (other than config/env plumbing), that's a leak — move it.
- **Config over constants.** Model IDs, limits, and toggles come from `AIServiceConfig`
  (env-driven), not hard-coded in services. See `.env.example` and [`enterprise.md`](./enterprise.md).
- **Name by pattern, not by hype.** If a "service" is a single augmented-LLM call, don't
  call it an agent. Honest names keep the architecture legible.
- **Co-locate tests** with the unit they cover; mock at the `ILLMProvider` seam so service
  tests never hit the network.
