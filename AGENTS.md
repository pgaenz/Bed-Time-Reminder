# AGENTS.md

## Purpose

Implement and maintain the Pi extension with **small, focused, and easy-to-review changes**. Prioritize correctness, simplicity, and maintainability over unnecessary abstractions or large refactors.

## Working Conventions

* **Keep changes small:** Make the smallest change that fully solves the task. Avoid unrelated refactoring, formatting changes, or dependency changes.
* **Clear diffs:** Every change should have an obvious purpose and remain easy to review. Preserve existing project structure and conventions unless there is a clear reason to change them.
* **Follow existing patterns:** Inspect the surrounding code and reuse established APIs, naming conventions, error handling, and architecture before introducing new approaches.
* **Best practices:** Prefer simple, readable, idiomatic code. Keep functions focused, avoid duplication, handle errors explicitly, and avoid premature abstractions.
* **Minimal dependencies:** Do not add dependencies unless they are clearly necessary and justified.

## TDD: Red → Green → Refactor

Follow the **Red-Green-Refactor** cycle for behavioral changes:

1. **Red:** Write or update a focused test that demonstrates the desired behavior and fails for the right reason.
2. **Green:** Implement the smallest amount of code necessary to make the test pass.
3. **Refactor:** Improve the implementation while keeping all tests green. Do not change behavior during refactoring.

Tests should cover new behavior and important edge cases. Prefer focused unit tests over broad or brittle tests.

## Validation

Before considering a change complete:

* Run the relevant tests.
* Run the full test suite when practical.
* Run the project's configured linting, formatting, type checking, or build checks.
* Ensure there are no regressions.
* Review the final diff and remove unrelated changes.

## Git Hygiene

* Do not modify files unrelated to the task.
* Do not rewrite history, reset user changes, or discard uncommitted work.
* Keep commits/diffs focused when commits are requested.
* Never commit secrets, credentials, generated artifacts, or local configuration files.

## Agent Behavior

When requirements are ambiguous, inspect the repository and existing tests first. Ask for clarification only when the intended behavior cannot reasonably be inferred.

Do not over-engineer. **Prefer the smallest correct change with a clear test and a clear diff.**

