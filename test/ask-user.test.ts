import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CUSTOM_ANSWER_LABEL,
  askUser,
  askUserResultToText,
  validateAskUserInput,
  type AskUserInput,
  type AskUserUI,
} from "../.pi/extensions/ask_user/ask-user.ts";

/**
 * Test double for `ctx.ui`. Records the dialogs that were shown and returns a
 * scripted selection by index (or `undefined` to dismiss). `custom` selects the
 * appended custom-answer option.
 */
function createFakeUI(options: {
  select?: number | "custom" | undefined;
  inputResult?: string | undefined;
}) {
  const selects: { title: string; options: string[] }[] = [];
  const inputs: { title: string; placeholder?: string }[] = [];

  const ui: AskUserUI = {
    async select(title, selectOptions) {
      selects.push({ title, options: selectOptions });
      if (options.select === undefined) return undefined;
      if (options.select === "custom") return CUSTOM_ANSWER_LABEL;
      return selectOptions[options.select];
    },
    async input(title, placeholder) {
      inputs.push({ title, placeholder });
      return options.inputResult;
    },
  };

  return { ui, selects, inputs };
}

const sample: AskUserInput = {
  question: "Should the reminder remember previous notifications after Pi restarts?",
  reason: "Persistence changes the scope and the amount of rework.",
  options: [
    { label: "Session-only", tradeoff: "Simpler, but reminders reset on every restart." },
    { label: "Persist to disk", tradeoff: "Remembers across restarts, but adds state to manage." },
  ],
};

test("returns unavailable and does not prompt when no UI exists", async () => {
  const result = await askUser(sample, undefined);
  assert.deepEqual(result, { status: "unavailable" });
});

test("returns the selected option as the answer", async () => {
  const { ui } = createFakeUI({ select: 0 });
  const result = await askUser(sample, ui);
  assert.deepEqual(result, { status: "answered", answer: "Session-only" });
});

test("lets the user write a custom answer", async () => {
  const { ui, inputs } = createFakeUI({ select: "custom", inputResult: "Only on weekdays" });
  const result = await askUser(sample, ui);
  assert.deepEqual(result, { status: "answered", answer: "Only on weekdays" });
  assert.equal(inputs.length, 1);
});

test("returns cancelled when the user dismisses the selector", async () => {
  const { ui } = createFakeUI({ select: undefined });
  const result = await askUser(sample, ui);
  assert.deepEqual(result, { status: "cancelled" });
});

test("returns cancelled when the user dismisses the custom input", async () => {
  const { ui } = createFakeUI({ select: "custom", inputResult: undefined });
  const result = await askUser(sample, ui);
  assert.deepEqual(result, { status: "cancelled" });
});

test("returns cancelled for an empty custom answer instead of a default", async () => {
  const { ui } = createFakeUI({ select: "custom", inputResult: "   " });
  const result = await askUser(sample, ui);
  assert.deepEqual(result, { status: "cancelled" });
});

test("shows the question, reason, option tradeoffs, and a custom route", async () => {
  const { ui, selects } = createFakeUI({ select: 1 });
  await askUser(sample, ui);

  const [dialog] = selects;
  assert.ok(dialog.title.includes(sample.question));
  assert.ok(dialog.title.includes(sample.reason));
  assert.ok(dialog.options[0].includes(sample.options[0].label));
  assert.ok(dialog.options[0].includes(sample.options[0].tradeoff));
  assert.ok(dialog.options[1].includes(sample.options[1].label));
  assert.ok(dialog.options[1].includes(sample.options[1].tradeoff));
  assert.equal(dialog.options.at(-1), CUSTOM_ANSWER_LABEL);
});

test("marks a matching recommendation on its option", async () => {
  const { ui, selects } = createFakeUI({ select: 1 });
  await askUser({ ...sample, recommendation: "Persist to disk" }, ui);

  const [dialog] = selects;
  assert.ok(dialog.options[1].includes("(recommended)"));
  assert.ok(!dialog.options[0].includes("(recommended)"));
});

test("shows a free-text recommendation in the dialog", async () => {
  const { ui, selects } = createFakeUI({ select: 0 });
  await askUser({ ...sample, recommendation: "Pick whatever is safest" }, ui);

  const [dialog] = selects;
  assert.ok(dialog.title.includes("Pick whatever is safest"));
});

test("rejects an invalid question, reason, or option count", async () => {
  const base = { ...sample };
  assert.throws(() => validateAskUserInput({ ...base, question: "  " }));
  assert.throws(() => validateAskUserInput({ ...base, reason: "" }));
  assert.throws(() => validateAskUserInput({ ...base, options: [sample.options[0]] }));
  assert.throws(() =>
    validateAskUserInput({
      ...base,
      options: [...sample.options, { label: "Third", tradeoff: "More choice." }, { label: "Fourth", tradeoff: "Too many." }],
    }),
  );
  await assert.rejects(() => askUser({ ...base, question: "" }, createFakeUI({ select: 0 }).ui));
});

test("renders explicit model-facing text for every result status", () => {
  assert.ok(askUserResultToText({ status: "answered", answer: "Persist to disk" }).includes("Persist to disk"));
  assert.ok(askUserResultToText({ status: "cancelled" }).toLowerCase().includes("cancel"));
  assert.ok(askUserResultToText({ status: "unavailable" }).toLowerCase().includes("not asked"));
  assert.ok(!askUserResultToText({ status: "cancelled" }).includes("answered"));
});
