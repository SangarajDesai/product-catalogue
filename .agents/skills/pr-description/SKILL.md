---
name: pr-description
description: Draft a reviewer-friendly pull-request title and description from the actual feature-branch diff, decisions, and verified test evidence. Use before opening a pull request. Never invent implementation, testing results, or AI mistakes.
---

# Draft a pull request description

1. Confirm a Git repository and identify the target base branch (`main` unless the user specifies otherwise). Check that the branch exists locally or as a remote tracking branch. Do not fetch, push, or create a PR without permission.
2. Inspect `git status`, the merge base, `git log --oneline <base>..HEAD`, and `git diff <base>...HEAD` including changed filenames. Distinguish committed changes from uncommitted changes; do not silently claim uncommitted work is in the PR.
3. Read existing `README.md`, `DECISIONS.md`, `AI_USAGE.md`, and acceptance criteria where available. Do not rewrite these documents without a separate request.
4. Draft:
   - A clear, concise PR title
   - **Summary**: what behavior changed and why
   - **Implementation**: important boundaries and decisions supported by the diff
   - **Verification**: exact tests or browser checks actually performed, with outcomes; explicitly flag not-run checks
   - **Assumptions / Trade-offs**: link to documented decisions; note simplifications
   - **Known limitations / Next steps**: accurate remaining work, if any
   - **Reviewer walkthrough**: minimal local steps to exercise the critical user journey
5. Do not copy confidential information, fabricated metrics, or invented AI-error anecdotes.
6. Return a complete Markdown draft to review. Do not run `gh pr create`, publish, or merge without a separate explicit request. In this assessment the PR should remain open.
