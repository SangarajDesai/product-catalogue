---
name: commit-message
description: Draft an accurate Conventional Commit message from staged Git changes. Use when the user asks for a commit message or is ready to commit a verified slice. Never commit or stage files automatically.
---

# Draft a commit message

1. Confirm the current directory is a Git repository with `git rev-parse --show-toplevel`.
2. Read `git status --short`, `git diff --cached --stat`, and `git diff --cached` (including all staged changes).
3. If nothing is staged, say so and stop. Do not stage files yourself.
4. Summarize the actual change, its purpose, and any impact on tests or behavior. Do not claim tests passed unless evidence is visible from the current session.
5. Suggest one Conventional Commits subject: `type(scope): imperative description`. Use `feat`, `fix`, `refactor`, `test`, `docs`, or `chore` as appropriate. Aim for <=72 characters.
6. Add a short body only if it explains an important why/trade-off; do not list unrelated details or invent ticket IDs.
7. Present the message as text for user approval. Never run `git commit`, `git push`, or `git add` unless explicitly requested separately.
