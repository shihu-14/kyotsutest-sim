---
name: assessment-workflow-ui
description: Design or implement assessment, quiz, exam, scoring, review, timer, answer marking, page navigation, and result workflow UI. Use for test-taking flows, answer sheets, grading feedback, review overlays, finish confirmations, score reveal timing, and keeping assessment modes consistent.
---

# Assessment Workflow UI

Keep the learner's current task obvious: answer, finish, review, or inspect
results.

## Workflow

1. Map the mode: selection/list, taking, confirmation, scoring, review, or
   editing.
2. Keep primary and destructive actions visually distinct.
3. Preserve answer state and page state intentionally across mode changes.
4. Keep document/page navigation consistent between taking and review modes
   unless the request says otherwise.
5. Use timing and animation only to communicate grading or transition state.
6. Verify unanswered, correct, incorrect, and partially complete cases.

## References

- Read `references/answer-marking.md` for answer sheet and mark behavior.
- Read `references/scoring-review-flow.md` for grading and review transitions.
- Read `references/timer-and-page-navigation.md` for timed exam navigation.
