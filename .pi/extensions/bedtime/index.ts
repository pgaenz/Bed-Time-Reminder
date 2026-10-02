/**
 * Pi bed-time reminder extension.
 *
 * While an interactive session is open, reminds the user once per local
 * calendar date during the late-night window (00:00–06:00). The reminder is a
 * plain notification: it neither calls the model nor blocks the user.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { BEDTIME_MESSAGE, BedtimeReminder } from "./reminder.ts";

export default function bedtimeExtension(pi: ExtensionAPI) {
  let reminder: BedtimeReminder | undefined;

  pi.on("session_start", (_event, ctx) => {
    // A reload replaces the runtime, but stopping the previous timer keeps
    // shutdown order irrelevant and prevents timer accumulation.
    reminder?.stop();

    reminder = new BedtimeReminder({
      now: () => new Date(),
      notify: (message) => ctx.ui.notify(message, "info"),
      isInteractive: () => ctx.hasUI,
      scheduler: {
        setInterval: (callback, delayMs) => setInterval(callback, delayMs),
        clearInterval: (handle) => clearInterval(handle),
      },
    });

    reminder.start();
  });

  pi.on("session_shutdown", () => {
    reminder?.stop();
    reminder = undefined;
  });

  pi.registerCommand("bedtime-test", {
    description: "Preview the bed-time reminder message",
    handler: async (_args, ctx) => {
      // Direct notify: previewing must not change automatic reminder state.
      ctx.ui.notify(BEDTIME_MESSAGE, "info");
    },
  });
}
