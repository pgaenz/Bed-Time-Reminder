# Bed-Time-Reminder

The completed reminder has these acceptance criteria:

- Use the local time zone of the machine running Pi. For this assignment, late-night hours are 00:00 inclusive to 06:00 exclusive.
- Display a visible message such as “It is after midnight. Consider saving your work and getting some sleep.” The user remains free to continue.
- While interactive Pi remains open and the computer is awake, display the reminder within one minute after midnight without requiring another user prompt.
- If Pi starts between midnight and 06:00, show the reminder on startup. If execution resumes after a pause during that window, show it on the next check.
- Show at most one automatic reminder per local calendar date within the current extension session. Repeated prompts and timer checks must not produce duplicates.
- A fresh session or extension reload may remind again. Persistence across restarts is optional. Separate Pi processes maintain separate state.
- A manual /bedtime-test command previews the message without changing the automatic reminder state.
Stop the timer when the extension session shuts down. Reloading must not accumulate active timers or use an old session context.
- Do not make extra model calls, block tools, or terminate Pi to deliver the reminder. Skip both notification and timer creation in noninteractive operation.

This is a reminder inside a running Pi session. It does not wake a sleeping computer or run while Pi is closed. If the computer resumes after 06:00, skip the missed reminder. Use simulated time for testing; do not change your system clock or wait until midnight.

## Running and testing

The extension lives in `.pi/extensions/bedtime/`.

Run the unit tests (Node's built-in test runner; no dependencies):

```bash
npm test
```

Preview the reminder in a live Pi session without waiting for midnight:

```bash
pi --extension ./.pi/extensions/bedtime/index.ts
```

Then run `/bedtime-test`. The explicit `--extension` flag loads the file without project trust; to have it load automatically in this project instead, run `/trust` once and then `/reload`.

See the automatic reminder and its once-per-date behavior with simulated time (no clock changes, no waiting):

```bash
npm run demo
```
