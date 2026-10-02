/**
 * Simulated-time demo for the bed-time reminder.
 *
 * Runs the real BedtimeReminder controller with a fake clock and scheduler,
 * so it demonstrates the automatic reminder and per-date dedupe without
 * waiting for midnight or changing the system clock.
 *
 * Run: npm run demo
 */
import {
  BEDTIME_MESSAGE,
  BedtimeReminder,
  type Scheduler,
  type TimerHandle,
} from "../.pi/extensions/bedtime/reminder.ts";

/** Records interval callbacks; `fire()` simulates the timer firing. */
class ManualScheduler implements Scheduler {
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

  fire(): void {
    for (const callback of [...this.callbacks.values()]) {
      callback();
    }
  }
}

function stamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const clock = { current: new Date(2026, 0, 2, 23, 59, 50) };
const scheduler = new ManualScheduler();
let reminderCount = 0;

const reminder = new BedtimeReminder({
  now: () => new Date(clock.current.getTime()),
  notify: () => {
    reminderCount += 1;
  },
  isInteractive: () => true,
  scheduler,
});

function step(label: string, when: Date): void {
  const before = reminderCount;
  clock.current = when;
  scheduler.fire();
  const result = reminderCount > before ? "REMINDER SHOWN" : "no reminder";
  console.log(`${stamp(when)}  ${label.padEnd(38, ".")} ${result}`);
}

console.log("Bed-time reminder simulation (local machine time)");
console.log(`Message: "${BEDTIME_MESSAGE}"\n`);

clock.current = new Date(2026, 0, 2, 23, 59, 50);
reminder.start();
console.log(`${stamp(clock.current)}  ${"session starts before midnight".padEnd(38, ".")} no reminder`);

step("first check after midnight", new Date(2026, 0, 3, 0, 0, 10));
step("repeated check, same date", new Date(2026, 0, 3, 0, 0, 40));
step("later check, same date", new Date(2026, 0, 3, 3, 0, 0));
step("next calendar date after midnight", new Date(2026, 0, 4, 0, 0, 5));

console.log(`\nTotal automatic reminders: ${reminderCount} (once per local date)`);
reminder.stop();
