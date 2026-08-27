# CLAUDE.md

Required context before any code change: @AGENTS.md.

## Notes for Claude Code

- Verify by actually running it: `docker compose up --build` from scratch, then paste the reference
  query from `docs/requirements/ASSIGNMENT.md` — the citation source, not the copy in
  `REQUIREMENTS.md` — into Apollo Sandbox unchanged.
- Keep commits meaningful and atomic — the git history is part of what gets reviewed.
- Chat replies follow the language of the request; repository files stay English (see AGENTS.md).
