import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BEDTIME_MESSAGE,
  BedtimeReminder,
  isLateNight,
  localDateKey,
  type Scheduler,
  type TimerHandle,
} from "../.pi/extensions/bedtime/reminder.ts";

/**
 * Test double for the real timer API. It records the callbacks without
 * scheduling anything, so tests can simulate time by calling `fire()`.
 */
class FakeScheduler implements Scheduler {
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  setInterval(callback: () => void, _delayMs: number): TimerHandle {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id as unknown as TimerHandle;
  }

  clearInterval(handle: TimerHandle): void {
    this.callbacks.delete(handle as unknown as number);
  }

  get size(): number {
    return this.callbacks.size;
  }

  fire(): void {
    for (const callback of [...this.callbacks.values()]) {
      callback();
    }
  }
}

function createHarness(options: { interactive?: boolean; start: Date }) {
  let current = options.start;
  const notifications: string[] = [];
  const scheduler = new FakeScheduler();
  const reminder = new BedtimeReminder({
    now: () => new Date(current.getTime()),
    notify: (message) => notifications.push(message),
    isInteractive: () => options.interactive ?? true,
    scheduler,
  });

  return {
    reminder,
    scheduler,
    notifications,
    setTime: (date: Date) => {
      current = date;
    },
  };
}

test("isLateNight includes 00:00 and excludes 06:00", () => {
  assert.equal(isLateNight(new Date(2026, 0, 2, 0, 0, 0)), true);
  assert.equal(isLateNight(new Date(2026, 0, 2, 5, 59, 59)), true);
  assert.equal(isLateNight(new Date(2026, 0, 2, 6, 0, 0)), false);
  assert.equal(isLateNight(new Date(2026, 0, 1, 23, 59, 59)), false);
  assert.equal(isLateNight(new Date(2026, 0, 2, 12, 0, 0)), false);
});

test("localDateKey formats the local calendar date", () => {
  assert.equal(localDateKey(new Date(2026, 0, 2, 3, 0, 0)), "2026-01-02");
});

test("start reminds immediately when starting inside the late-night window", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 0, 30, 0) });
  harness.reminder.start();
  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE]);
});

test("start outside the window does not remind", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 12, 0, 0) });
  harness.reminder.start();
  assert.deepEqual(harness.notifications, []);
});

test("start creates a repeating check only in interactive mode", () => {
  const interactive = createHarness({ interactive: true, start: new Date(2026, 0, 2, 12, 0, 0) });
  interactive.reminder.start();
  assert.equal(interactive.scheduler.size, 1);

  const headless = createHarness({ interactive: false, start: new Date(2026, 0, 2, 12, 0, 0) });
  headless.reminder.start();
  assert.equal(headless.scheduler.size, 0);
  assert.deepEqual(headless.notifications, []);
});

test("a timer check reminds at most once per local date", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 12, 0, 0) });
  harness.reminder.start();

  harness.setTime(new Date(2026, 0, 3, 0, 0, 10));
  harness.scheduler.fire();
  harness.scheduler.fire();
  harness.setTime(new Date(2026, 0, 3, 3, 0, 0));
  harness.scheduler.fire();

  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE]);
});

test("a reminder can fire again on the next local date", () => {
  const harness = createHarness({ start: new Date(2026, 0, 3, 0, 30, 0) });
  harness.reminder.start();

  harness.setTime(new Date(2026, 0, 4, 0, 0, 5));
  harness.scheduler.fire();

  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE, BEDTIME_MESSAGE]);
});

test("resuming after a pause reminds on the next check", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 12, 0, 0) });
  harness.reminder.start();

  // The computer slept across midnight; the next check sees 02:00.
  harness.setTime(new Date(2026, 0, 3, 2, 0, 0));
  harness.scheduler.fire();

  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE]);
});

test("preview notifies without consuming the automatic reminder", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 12, 0, 0) });
  harness.reminder.start();

  harness.reminder.preview();
  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE]);

  harness.setTime(new Date(2026, 0, 3, 0, 5, 0));
  harness.scheduler.fire();

  assert.equal(harness.notifications.length, 2);
});

test("stop clears the timer and repeated start/stop stay idempotent", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 12, 0, 0) });
  harness.reminder.start();
  harness.reminder.start();
  assert.equal(harness.scheduler.size, 1);

  harness.reminder.stop();
  harness.reminder.stop();
  assert.equal(harness.scheduler.size, 0);
});

test("timer checks outside the window stay silent", () => {
  const harness = createHarness({ start: new Date(2026, 0, 2, 5, 0, 0) });
  harness.reminder.start();

  harness.setTime(new Date(2026, 0, 2, 7, 0, 0));
  harness.scheduler.fire();

  assert.deepEqual(harness.notifications, [BEDTIME_MESSAGE]);
});
