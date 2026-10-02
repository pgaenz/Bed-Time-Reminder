import { test } from "node:test";
import assert from "node:assert/strict";

import bedtimeExtension from "../.pi/extensions/bedtime/index.ts";
import { BEDTIME_MESSAGE } from "../.pi/extensions/bedtime/reminder.ts";

type AnyHandler = (event: unknown, ctx: unknown) => unknown;

interface FakeCommand {
  name: string;
  handler: (args: string, ctx: unknown) => Promise<void>;
}

function createFakePi() {
  const handlers = new Map<string, AnyHandler[]>();
  let command: FakeCommand | undefined;

  const pi = {
    on(event: string, handler: AnyHandler) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return () => {};
    },
    registerCommand(name: string, options: { handler: FakeCommand["handler"] }) {
      command = { name, handler: options.handler };
    },
  };

  const emit = (event: string, payload: unknown, ctx: unknown) => {
    for (const handler of handlers.get(event) ?? []) {
      handler(payload, ctx);
    }
  };

  return { pi, emit, getCommand: () => command };
}

test("registers /bedtime-test and previews the message", async () => {
  const fake = createFakePi();
  bedtimeExtension(fake.pi as never);

  const command = fake.getCommand();
  assert.equal(command?.name, "bedtime-test");

  const notifications: string[] = [];
  await command!.handler("", {
    hasUI: true,
    ui: { notify: (message: string) => notifications.push(message) },
  });

  assert.deepEqual(notifications, [BEDTIME_MESSAGE]);
});

test("starts on session_start and stops cleanly on session_shutdown", () => {
  const fake = createFakePi();
  bedtimeExtension(fake.pi as never);

  const ctx = { hasUI: true, ui: { notify: () => {} } };
  assert.doesNotThrow(() => fake.emit("session_start", { type: "session_start", reason: "startup" }, ctx));
  assert.doesNotThrow(() => fake.emit("session_shutdown", { type: "session_shutdown", reason: "quit" }, ctx));
});
