# Local setup

From inside a new, empty product-catalogue project directory:

1. Install Spencer's verified skills from https://github.com/schneidenbach/skills:

   npx skills@latest add schneidenbach/skills --skill grill-with-docs --skill grilling --skill domain-modeling --skill relentless-quality-assurance --skill codex-code-review --skill revu --agent codex

2. Extract this pack's `.agents/skills/` and `AGENTS.md` into the project root:

   unzip -o /path/to/codex-assessment-setup.zip -d .

   The archive includes `INSTALL.md`, `AGENTS.md`, and three local skills. If a project already has `AGENTS.md`, merge intentionally instead of overwriting.

3. Verify:

   npx skills list
   find .agents/skills -name SKILL.md

4. Run Codex in this project directory. Use `/skills` or type `$` to invoke a skill. Restart Codex if newly created skills are not visible.

5. Supply the original PDF assessment to Codex before invoking `$grill-with-docs`. Keep a copy of the PDF in the repository only if permitted by its confidentiality terms.

Notes: This pack does not install itself on your computer. It contains plain Markdown skill instructions and does not execute commands on extraction. The external `revu` app is optional (`brew install schneidenbach/tap/revu` on macOS). Review skills before running them.
