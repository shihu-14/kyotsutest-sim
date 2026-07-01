# Scoring Review Flow

Scoring should make progress and results understandable without blocking review.

- Delay only when it supports the grading experience.
- Keep fast paths for pages with no gradable items if the flow animates page by
  page.
- Show correct and incorrect feedback at the location the user associates with
  the question.
- After scoring, transition to review with the same document and answer context
  whenever possible.
- Keep final score actions clear: review, return home, or retry if supported.
- Do not replay completed scoring animations when returning from review unless
  explicitly requested.

Test all result states: all correct, some incorrect, unanswered, and no gradable
items on a page.
