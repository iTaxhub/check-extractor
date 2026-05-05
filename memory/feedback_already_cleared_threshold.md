---
name: Already-cleared auto-approve needs ≥80% score + intuit_id dedup
description: Tagging a Kyriq check as qbAlreadyCleared from clearedIntuitIds must require high score AND be deduped per intuit_id; otherwise multiple low-confidence matches all silently approve against the same QB txn
type: feedback
---

When `runFullMatch` builds `clearedIntuitIds` from `kyriqApproved` +
`audit_logs`, never tag a row as `qbAlreadyCleared` (or auto-flip its
status to approved) unless **score >= 80** AND the row is the highest-scoring
match for that `intuit_id`. Always dedup by `qbTxn.intuit_id` after the
per-check loop and strip the tag from the losers.

**Why:** Around 2026-05 the user shipped the auto-approve flow with a
40-score threshold and no dedup. Result: a single approved Kyriq cheque
against QB `#800012 ($960)` caused four unrelated cheques (different
payees, different dates, same amount) that bucket-collided at 40% to be
silently flipped to `approved` in the Done tab. The user found 37 rows in
Done when they expected far fewer and called the bogus ones "duplicates".

**How to apply:** Whenever you touch `runFullMatch`, the `clearedIntuitIds`
construction, the `qbAlreadyCleared` / `needsAutoApprove` tags, or the
sidepanel's `autoApproveCleared`:
- Keep the `bestScore >= 80` gate when computing `alreadyCleared`.
- Keep the post-loop dedup that picks one winner per `intuit_id` and
  reverts the rest's tag + status pre-flip (only revert pre-flip if the
  DB hasn't persisted approval).
- The 40% floor is fine for *displaying* a candidate match, but never
  for inheriting cleared-state.
