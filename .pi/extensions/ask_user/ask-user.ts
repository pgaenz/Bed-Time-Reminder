/**
 * Pure interaction logic for the `ask_user` tool.
 *
 * This module is deliberately free of Pi runtime imports so it can be unit
 * tested with Node's built-in test runner. The extension in `index.ts` wires it
 * to the model-callable tool and the terminal UI.
 */

/** A concrete choice the user can pick, with the tradeoff it represents. */
export interface AskUserOption {
  /** Short statement of the choice. */
  label: string;
  /** What the user gains or gives up by choosing this option. */
  tradeoff: string;
}

/** Validated input for one `ask_user` call. */
export interface AskUserInput {
  /** One clear question. */
  question: string;
  /** Brief explanation of why the decision matters. */
  reason: string;
  /** Two or three mutually exclusive options. */
  options: AskUserOption[];
  /** Optional suggested option label or free-text recommendation. */
  recommendation?: string;
}

/**
 * Explicit outcome of an `ask_user` call. A cancelled or unavailable result
 * never carries an answer, so it can never be mistaken for consent.
 */
export type AskUserResult =
  | { status: "answered"; answer: string }
  | { status: "cancelled" }
  | { status: "unavailable" };

/** Subset of `ctx.ui` used for one question. Injectable for tests. */
export interface AskUserUI {
  select(title: string, options: string[]): Promise<string | undefined>;
  input(title: string, placeholder?: string): Promise<string | undefined>;
}

/** Appended to every option list so the user can write their own answer. */
export const CUSTOM_ANSWER_LABEL = "Write a custom answer…";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 3;

/**
 * Rejects malformed calls before any dialog is shown, so the model gets a
 * clear error instead of an ambiguous prompt.
 */
export function validateAskUserInput(input: AskUserInput): void {
  if (!input.question?.trim()) {
    throw new Error("ask_user requires a non-empty question.");
  }
  if (!input.reason?.trim()) {
    throw new Error("ask_user requires a brief reason the decision matters.");
  }
  if (input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    throw new Error(`ask_user requires between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`);
  }
  for (const option of input.options) {
    if (!option.label?.trim()) {
      throw new Error("ask_user options require a non-empty label.");
    }
    if (!option.tradeoff?.trim()) {
      throw new Error("ask_user options require a tradeoff.");
    }
  }
}

/** Renders one option, marking it when it matches the recommendation. */
export function formatOption(option: AskUserOption, index: number, recommendation?: string): string {
  const marker = recommendation === option.label ? " (recommended)" : "";
  return `${index + 1}. ${option.label} — ${option.tradeoff}${marker}`;
}

/** Builds the dialog title from the question, reason, and any free-text recommendation. */
export function formatDialogTitle(input: AskUserInput): string {
  let title = input.question.trim();
  title += `\n\nWhy this matters: ${input.reason.trim()}`;

  const matchesOption = input.options.some((option) => option.label === input.recommendation);
  if (input.recommendation?.trim() && !matchesOption) {
    title += `\nRecommendation: ${input.recommendation.trim()}`;
  }
  return title;
}

/**
 * Asks one question and waits for the human's answer.
 *
 * Returns `unavailable` when no dialog-capable UI exists, `cancelled` when the
 * user dismisses either dialog or submits an empty custom answer, and
 * `answered` only with text the user actually provided.
 */
export async function askUser(input: AskUserInput, ui: AskUserUI | undefined): Promise<AskUserResult> {
  validateAskUserInput(input);

  if (!ui) {
    return { status: "unavailable" };
  }

  const options = input.options.map((option, index) => formatOption(option, index, input.recommendation));
  options.push(CUSTOM_ANSWER_LABEL);

  const selected = await ui.select(formatDialogTitle(input), options);
  if (selected === undefined) {
    return { status: "cancelled" };
  }

  if (selected === CUSTOM_ANSWER_LABEL) {
    const custom = await ui.input(input.question, "Type your answer");
    const answer = custom?.trim();
    if (!answer) {
      // An empty custom answer is not a choice; never fall back to a default.
      return { status: "cancelled" };
    }
    return { status: "answered", answer };
  }

  const chosen = input.options.find((_option, index) => options[index] === selected);
  return { status: "answered", answer: chosen ? chosen.label : selected };
}

/** Model-facing text for a result. Keeps the human's answer verbatim. */
export function askUserResultToText(result: AskUserResult): string {
  switch (result.status) {
    case "answered":
      return `The user answered: ${result.answer}`;
    case "cancelled":
      return "The user cancelled the question without answering. This is not consent; do not assume a default.";
    case "unavailable":
      return "No user-input UI is available, so the question was not asked. This is not consent; do not assume a default.";
  }
}
