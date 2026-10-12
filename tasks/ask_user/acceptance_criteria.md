##  Acceptance criteria

- Accept one clear question, a brief reason it matters, and two or three options with tradeoffs. Allow an optional recommendation.
- Display the question and context. Let the user select an option or write a custom answer.
- Return an explicit result: answered with the selected/custom answer, cancelled, or unavailable. Preserve the user's answer accurately.
- Wait for the human's response before returning an answered result. Cancellation, an empty custom answer, or unavailable UI must not silently select a default or claim consent.
- Guide the agent to use the tool for important unresolved choices, and proceed without questions for explicit requirements or routine reversible details.
- Handle one question at a time. Do not build a new chat system, remote notification service, or multi-agent messaging framework.

Example question: “Should the reminder remember previous notifications after Pi restarts?” Explain the tradeoff between a simpler session-only design and persistance on disk, offer those options, and allow a written alternative.
