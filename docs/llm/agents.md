# Agent Architecture

How to structure multi-step AI behavior in Lithic. Grounded in Anthropic's
[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
and [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview).

## The core distinction: workflows vs. agents

Anthropic draws a sharp line, and so should we:

- **Workflow** — LLMs and tools orchestrated through *predefined code paths*. Steps are
  fixed; you (the engineer) decide the control flow.
- **Agent** — the LLM *dynamically directs its own process and tool usage*, looping on
  environmental feedback until done.

> **Default to workflows.** Most Lithic clinical features are well-defined tasks with
> fixed steps — they are workflows, not agents. Reach for an autonomous agent only when
> the task is genuinely open-ended and the number/order of steps can't be known ahead of
> time. Agents cost more tokens, are harder to test, and are harder to make safe in a
> regulated setting.

The guiding principle from Anthropic: **start simple, add complexity only when it
demonstrably improves outcomes.** A single well-prompted call beats a chain; a chain
beats an agent — until the task proves otherwise.

## Building blocks (in increasing complexity)

1. **Augmented LLM** — one model call with retrieval, tools, and memory. The atom of
   everything below. Most Lithic services are this plus light glue.
2. **Prompt chaining** — decompose into sequential calls with programmatic checks
   between them (gate, validate, transform). Use when a task splits into clean stages.
3. **Routing** — classify the input, then dispatch to a specialized prompt/model. This
   is exactly what `/api/ai/assist` does today (mode → handler).
4. **Parallelization** — fan out independent subtasks (sectioning) or sample the same
   task multiple times for confidence (voting). Good for "check N interactions" or
   "extract M code candidates".
5. **Orchestrator–workers** — a lead model decomposes a task at runtime and delegates to
   workers. Use only when subtasks can't be enumerated in advance.
6. **Evaluator–optimizer** — one model produces, another critiques and the producer
   revises. Useful for documentation quality passes where "good enough" is checkable.
7. **Autonomous agent** — the model loops with tools and environment feedback. Highest
   power, highest cost/risk. In a HIPAA EHR, gate these behind human review.

## Lithic's clinical "agents" mapped to building blocks

Each service in `src/lib/ai/` is best understood as one of the patterns above. Most are
**augmented-LLM workflows**, not autonomous agents — name them honestly.

| Service (`src/lib/ai/`) | Class | Pattern | Recommended model | Notes |
|--------------------------|-------|---------|-------------------|-------|
| `clinical-summarizer.ts` | `ClinicalSummarizer` | Augmented LLM | Sonnet 4.6 | Brief vs. detailed = two prompts; cache the system + format rules |
| `coding-assistant.ts` | `CodingAssistant` | Prompt chaining + tool-use output | Sonnet 4.6 | Suggest → validate → specificity. Force JSON via tool schema |
| `documentation-assistant.ts` | `DocumentationAssistant` | Augmented LLM + evaluator pass | Sonnet 4.6 | Generate, then quality-check pass (evaluator–optimizer) |
| `diagnosis-suggester.ts` | `DiagnosisSuggester` | Augmented LLM + extended thinking | **Opus 4.7** | Ranked differential benefits from thinking; highest-stakes |
| `med-reconciliation.ts` | `MedicationReconciliationAssistant` | Parallelization (per-pair checks) | Sonnet 4.6 | Interaction/duplication checks fan out; aggregate + severity |
| `quality-gap-detector.ts` | `QualityGapDetector` | Routing + augmented LLM | Sonnet 4.6 / Haiku 4.5 | Route by measure type; Haiku for bulk patient panels |

The HTTP surface in `src/app/api/ai/` is the **router**: `/assist` classifies a mode and
delegates to the right service; `/summarize` and `/suggest-codes` are direct workflow
endpoints.

## Designing the agent–computer interface (tools)

Anthropic's strongest practical advice: **invest in tool design the way you invest in
UI design.** Tools are how Claude acts on the world; bad tool ergonomics produce bad
agents.

- Give each tool a precise, example-rich description. Document the *why* and the failure
  modes, not just the parameter list.
- Make inputs hard to get wrong (clear types, enums, sensible defaults). Prevent errors
  at the schema level rather than handling them after.
- Return errors as actionable text the model can recover from.
- Keep the tool set small and orthogonal. Overlapping tools cause thrashing.
- For Lithic, tools are the bridge to the EHR: FHIR reads, drug-interaction lookups,
  coding-database queries. Each must enforce authz and PHI minimization independently of
  the model — **never trust the model to scope its own data access.**

## Sub-agents

Opus 4.7 spawns sub-agents conservatively by default and that behavior is steerable.

- Don't spawn a sub-agent for work the model can finish in one response.
- Do fan out sub-agents when reading multiple files/records or processing a list of items
  in the same turn.
- If you want more/less delegation, say so explicitly in the prompt — Opus 4.7 follows
  scope instructions literally.
- Give sub-agent runs a generous `max_tokens` budget (Anthropic suggests starting ~64k at
  `high`/`xhigh` effort) so they have room to think and call tools.

## Safety rails for a regulated EHR

- **Human-in-the-loop for anything that writes.** AI may *suggest* codes, diagnoses, and
  documentation; a licensed user approves before anything enters the record.
- **Bounded loops.** Any autonomous loop needs a hard step/token ceiling and a timeout.
  `LLMService` already enforces timeouts, retries, and rate limits — keep agentic loops
  inside those guards.
- **Auditability.** Every agent step is logged via the audit logger (PHI-redacted). An
  agent you can't reconstruct after the fact is not deployable here.
- **Transparency.** Surface the model's plan/reasoning to the clinician where it informs a
  decision; don't hide why a suggestion was made.

## When to escalate from workflow to agent

Add complexity only when you can answer yes:

1. Is the step count/order genuinely unknowable in advance?
2. Have you measured that a fixed workflow underperforms?
3. Can you bound cost, latency, and blast radius?
4. Is there a human approving any state change?

If any answer is no, keep it a workflow.
