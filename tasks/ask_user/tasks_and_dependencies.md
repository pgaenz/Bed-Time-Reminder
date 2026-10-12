### Tasks and dependencies

| ID | Task | depends_on | Completion evidence |
|---|---|---|---|
| W2-0 | Agree on the tool contract and asking policy | [] | Input/result shapes and concrete ask/proceed examples. |
| W2-1 | Set up herdr workers and write failing contract tests | [W2-0] | Worker briefs, file ownership, and failing tests. |
| W2-2 | Implement tool registration and interaction | [W2-1] | Contract tests pass and a real dialog works. |
| W2-3 | Independently prepare review cases | [W2-1] | Cases and expected outcomes derived from the specification. |
| W2-4 | Review the implementation and fix supported findings | [W2-2, W2-3] | Reproduced findings resolved and tests pass. |
| W2-5 | Demonstrate agent behavior and submit | [W2-4] | Scenarios, reviewed PR, and reflection. |

```text
W2-0 → W2-1 ─┬→ W2-2 ─┐
              └→ W2-3 ─┴→ W2-4 → W2-5
```
