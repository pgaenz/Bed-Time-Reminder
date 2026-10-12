/**
 * Pi `ask_user` extension.
 *
 * Exposes one model-callable tool that asks the human a single high-stakes
 * question and returns their answer. The tool only collects an answer; the
 * prompt guidance tells the model when consulting the user is worthwhile.
 */
import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { askUser, askUserResultToText, type AskUserInput } from "./ask-user.ts";

const OptionSchema = Type.Object({
  label: Type.String({ description: "Short statement of the choice" }),
  tradeoff: Type.String({ description: "What the user gains or gives up with this choice" }),
});

const AskUserParams = Type.Object({
  question: Type.String({ description: "One clear question to ask the user" }),
  reason: Type.String({
    description: "Brief explanation of why this decision matters (behavior, scope, or rework)",
  }),
  options: Type.Array(OptionSchema, {
    minItems: 2,
    maxItems: 3,
    description: "Two or three mutually exclusive options, each with its tradeoff",
  }),
  recommendation: Type.Optional(
    Type.String({ description: "Optional suggested option label or free-text recommendation" }),
  ),
});

const askUserTool = defineTool({
  name: "ask_user",
  label: "Ask User",
  description:
    "Ask the user one question when an unresolved choice materially changes user-visible " +
    "behavior, scope, or the amount of rework. Provide two or three concrete options with " +
    "tradeoffs and an optional recommendation. Returns the selected or written answer, or an " +
    "explicit cancelled/unavailable result.",
  promptSnippet: "Ask the user to resolve one important, unresolved choice.",
  promptGuidelines: [
    "Use ask_user when an unresolved choice would materially change user-visible behavior, scope, or the amount of rework and you cannot settle it from explicit requirements, existing code, or a safe default.",
    "Do not ask about explicit requirements, routine reversible details, or decisions you can make with a sensible default; state the assumption and proceed.",
    "Ask exactly one question per call, with two or three concrete options and their tradeoffs.",
    "A cancelled or unavailable result is not an answer: never claim the user approved a default.",
  ],
  exposure: "model-only",
  executionMode: "sequential",
  parameters: AskUserParams,

  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
    const result = await askUser(params as AskUserInput, ctx.hasUI ? ctx.ui : undefined);
    return {
      content: [{ type: "text", text: askUserResultToText(result) }],
      details: result,
    };
  },
});

export default function askUserExtension(pi: ExtensionAPI) {
  pi.registerTool(askUserTool);
}
