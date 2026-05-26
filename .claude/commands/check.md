---
description: Run the local CI gate — type-check, lint, and tests — and summarize results
argument-hint: "[optional test path/pattern]"
allowed-tools: Bash
---

Run Lithic's definition-of-done gate and report a concise pass/fail summary. Stop at the
first command that fails, show the relevant error output, and propose a fix.

1. `npm run type-check`
2. `npm run lint`
3. `npm run test $ARGUMENTS` (run the full unit suite if no pattern is given)

If all pass, state that the change meets the local gate. Do not modify code in this command
unless explicitly asked.
