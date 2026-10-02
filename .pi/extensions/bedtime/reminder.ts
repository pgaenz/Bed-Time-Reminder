/**
 * Pure, runtime-independent reminder logic.
 *
 * The Pi extension wires this class to session lifecycle events and the
 * terminal UI. Keeping the clock, timer, and notifier injectable lets tests
 * simulate time without changing the system clock.
 */

export const BEDTIME_MESSAGE =
  "It is after midnight. Consider saving your work and getting some sleep.";

/** Late-night window is local 00:00 inclusive to 06:00 exclusive. */
export const LATE_NIGHT_START_HOUR = 0;
export const LATE_NIGHT_END_HOUR = 6;

/**
 * Poll interval. Shorter than one minute so the reminder appears within one
 * minute after midnight even if the session starts at an arbitrary second.
 */
export const CHECK_INTERVAL_MS = 30_000;

export type TimerHandle = ReturnType<typeof setInterval>;

export interface Scheduler {
  setInterval(callback: () => void, delayMs: number): TimerHandle;
  clearInterval(handle: TimerHandle): void;
}

export interface BedtimeReminderDeps {
  /** Current local time. Injectable so tests can simulate time. */
  now(): Date;
  /** Show a visible, non-blocking reminder. */
  notify(message: string): void;
  /** False in non-interactive modes, where no timer or notification runs. */
  isInteractive(): boolean;
  scheduler: Scheduler;
}

/** Returns true during local hours [00:00, 06:00). */
export function isLateNight(now: Date): boolean {
  const hour = now.getHours();
  return hour >= LATE_NIGHT_START_HOUR && hour < LATE_NIGHT_END_HOUR;
}

/** Local calendar date, e.g. "2026-01-02", used for once-per-date dedupe. */
export function localDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Tracks at most one automatic reminder per local calendar date for one
 * extension session. State is in-memory, so separate Pi processes and fresh
 * sessions start clean.
 */
export class BedtimeReminder {
  private timer: TimerHandle | undefined;
  private remindedDate: string | undefined;
  private readonly deps: BedtimeReminderDeps;

  constructor(deps: BedtimeReminderDeps) {
    this.deps = deps;
  }

  /** Starts checking: checks now, then every {@link CHECK_INTERVAL_MS}. */
  start(): void {
    if (!this.deps.isInteractive()) return;
    if (this.timer !== undefined) return;
    this.check();
    this.timer = this.deps.scheduler.setInterval(() => this.check(), CHECK_INTERVAL_MS);
  }

  /** Stops the timer. Safe to call more than once. */
  stop(): void {
    if (this.timer === undefined) return;
    this.deps.scheduler.clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Shows the message without changing the automatic reminder state. */
  preview(): void {
    this.deps.notify(BEDTIME_MESSAGE);
  }

  private check(): void {
    const now = this.deps.now();
    if (!isLateNight(now)) return;

    const dateKey = localDateKey(now);
    if (this.remindedDate === dateKey) return;

    this.remindedDate = dateKey;
    this.deps.notify(BEDTIME_MESSAGE);
  }
}
