# Claude Best Practices

How to call Claude well from Lithic. Grounded in Anthropic's
[Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
and [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview).
Read [`token-optimization.md`](./token-optimization.md) alongside this — prompting and
cost are inseparable.

## 1. Choose the right model

Start from the default and move only with evidence.

| Task profile | Model | Why |
|--------------|-------|-----|
| Most clinical features (summarize, code, document) | **Sonnet 4.6** (`claude-sonnet-4-6`) | Best intelligence/speed/cost balance; 1M context |
| Hardest reasoning, long agentic traces, ambiguous differentials | **Opus 4.7** (`claude-opus-4-7`) | Most capable; step-change agentic coding/reasoning |
| Bulk extraction, classification, routing, PHI tagging | **Haiku 4.5** (`claude-haiku-4-5`) | Cheapest, fastest, near-frontier for narrow tasks |

Guidance from Anthropic: if unsure, start with Opus 4.7 for the *most complex* tasks,
but for a production EHR the economically correct default is **Sonnet 4.6**, escalating
to Opus 4.7 per-feature when an eval shows it's needed. Don't pay Opus prices for a
classification task Haiku does just as well.

**Pin the model ID in configuration**, not in scattered call sites. The runtime default
lives in `getLLMService()` / `LLMService.create()` and should be driven by the
`AI_MODEL` env var (see [`enterprise.md`](./enterprise.md) and `.env.example`).

## 2. Use the official SDK, not hand-rolled `fetch`

Today `src/lib/ai/providers/anthropic.ts` calls the REST endpoint directly with `fetch`.
That works, but the official SDK gives you typed requests/responses, streaming helpers,
retries with proper backoff, and first-class support for caching/thinking/tool-use
parameters as they evolve.

```bash
npm install @anthropic-ai/sdk
```

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: userText }],
});
```

The `ILLMProvider` abstraction in `llm-service.ts` is the right seam: keep the interface,
swap the Anthropic implementation's internals to the SDK. See
[Get started](https://platform.claude.com/docs/en/get-started).

## 3. Prompting fundamentals

These are the highest-leverage techniques, in order.

### Be clear and direct
Treat Claude as a brilliant new clinician who lacks your local context. State the task,
the audience, the constraints, and the output format explicitly. Anthropic's golden rule:
*show your prompt to a colleague with no context — if they'd be confused, so is Claude.*

### Add the "why"
Explaining the motivation behind an instruction improves adherence. "Flag drug
interactions because a missed interaction can cause patient harm" beats "flag drug
interactions."

### Structure with XML tags
Wrap distinct content types in their own tags so Claude never confuses instructions with
data. This matters most when PHI/free text is interpolated into a prompt.

```xml
<instructions>
Summarize the encounter for a referring physician. Use SOAP format.
</instructions>

<encounter_note>
{{note}}
</encounter_note>

<constraints>
Do not invent findings. If data is missing, write "not documented".
</constraints>
```

### Use examples (multishot)
3–5 well-chosen examples are the most reliable way to lock output format and tone. Wrap
each in `<example>` tags (and the set in `<examples>`). For coding/extraction tasks,
examples beat lengthy prose instructions.

### Long-context layout
Put long documents **at the top**, above the query and instructions — this measurably
improves quality. Wrap multiple documents in `<document>` tags with `<document_content>`
and `<source>` subtags. This layout also maximizes the cacheable prefix (see token doc).

### System prompt = role
Set the clinical role in the `system` field ("You are a board-certified coding
specialist…"). Even one sentence sharpens behavior. The system prompt is also the
ideal cache target.

## 4. Thinking and effort (Claude 4.x)

- **Extended/adaptive thinking** lets the model reason before answering. Use it for
  multi-step problems (differential diagnosis, complex med reconciliation); skip it for
  lookups and simple extraction — it adds latency and tokens. See
  [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking).
- **Effort parameter** (Opus 4.7) trades intelligence for tokens/latency: `low`,
  `medium`, `high`, `xhigh`, `max`. Use `high`/`xhigh` for agentic/coding and
  intelligence-sensitive clinical reasoning; use `low`/`medium` for cheap, well-scoped
  tasks. Opus 4.7 respects `low`/`medium` strictly (scopes work to exactly what's asked).
- Opus 4.7 **interprets instructions literally** — state scope explicitly ("apply to
  every section, not just the first"). Don't rely on it generalizing an instruction.

## 5. Control output length

Output tokens cost ~5x input tokens, so verbosity is expensive. Claude 4.x calibrates
length to perceived task complexity. If you need terse output, say so and *show* a
concise example (positive examples work better than "don't be verbose"):

```text
Provide concise, focused responses. Skip non-essential context, keep examples minimal.
```

Always set `max_tokens` to the realistic ceiling for the task — it's both a cost guard
and a safety valve against runaway generations.

## 6. Structured / machine-readable output

When a service needs JSON (e.g. coding suggestions, diagnosis lists):

- Define the schema in the prompt and give one filled example.
- Use **tool use** to force a schema when the output must be parsed reliably — define a
  tool whose input schema is your target shape and let Claude "call" it. See
  [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview).
- Optionally prefill the assistant turn with the opening `{` to suppress preamble.
- Validate every parsed payload server-side; never trust shape blindly.

## 7. Streaming

For user-facing latency (the AI assistant panel, documentation helper), stream responses.
The provider already implements SSE streaming; the React hooks consume it. Streaming does
not change cost — bill is by tokens, not delivery mode — but it dramatically improves
perceived responsiveness. Note: streamed requests bypass the response cache by design.

## Checklist for a new Claude call

- [ ] Model chosen by task profile (default Sonnet 4.6), ID pinned via config
- [ ] Stable prefix (system + tools + guideline context) cached; volatile data after the breakpoint
- [ ] `max_tokens` set to a real ceiling
- [ ] Thinking/effort enabled only when the task needs it
- [ ] PHI wrapped in XML data tags, never mixed into instructions
- [ ] 3–5 examples if output format matters
- [ ] Output validated; tool-use schema used when parsing is required
