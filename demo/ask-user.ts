/**
 * Scripted demonstration of the `ask_user` contract.
 *
 * Uses the real pure `askUser` logic with fake UIs, so it shows exactly what
 * the model receives for an answered, cancelled, and unavailable result
 * without requiring an interactive Pi session.
 *
 * Run: npm run demo:ask
 */
import { CUSTOM_ANSWER_LABEL, askUser, askUserResultToText, type AskUserInput } from "../.pi/extensions/ask_user/ask-user.ts";

const question: AskUserInput = {
  question: "Should the reminder remember previous notifications after Pi restarts?",
  reason: "Persistence changes the scope and the amount of rework.",
  options: [
    { label: "Session-only", tradeoff: "Simpler; reminders reset when Pi restarts." },
    { label: "Persist to disk", tradeoff: "Remembers across restarts; adds state to manage." },
  ],
  recommendation: "Session-only",
};

function fakeUi(select: number | "custom" | undefined, inputResult?: string) {
  return {
    async select(_title: string, options: string[]) {
      if (select === undefined) return undefined;
      if (select === "custom") return CUSTOM_ANSWER_LABEL;
      return options[select];
    },
    async input() {
      return inputResult;
    },
  };
}

async function scenario(label: string, input: AskUserInput, ui: ReturnType<typeof fakeUi> | undefined) {
  const result = await askUser(input, ui);
  console.log(`\n${label}`);
  console.log(`  status : ${result.status}`);
  if (result.status === "answered") console.log(`  answer : ${result.answer}`);
  console.log(`  model  : ${askUserResultToText(result)}`);
}

console.log("ask_user scenarios");
console.log(`Question: "${question.question}"`);
console.log(`Options : ${question.options.map((o) => o.label).join(" | ")}`);

await scenario("1. User picks the recommended option", question, fakeUi(0));
await scenario("2. User writes a custom answer", question, fakeUi("custom", "Persist only for the current project"));
await scenario("3. User dismisses the dialog (cancelled)", question, fakeUi(undefined));
await scenario("4. User submits an empty custom answer (cancelled)", question, fakeUi("custom", "   "));
await scenario("5. No dialog-capable UI (unavailable)", question, undefined);
