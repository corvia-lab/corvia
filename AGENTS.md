# AGENTS.md – How we work with AI agents in corvia

This file sets out how **all AI agents** (e.g. Claude, Codex, Copilot, Cursor) work in this repository. It is the single source of truth for agent rules. Tool-specific files such as `CLAUDE.md` refer to it.

corvia is a research, exploration and experimentation project. One of its questions is how Business, IT and AI work together well. Please read the [README](README.md) first.

---

## 1. Roles

- **AI proposes, people decide.** Agents research, draft, implement and summarize. Decisions on scope, architecture, naming, licensing and anything published are made by the human maintainers (currently quasipapa and gp).
- **Ask instead of guessing.** If a request is ambiguous or important information is missing, ask before you start building.
- **Ask before irreversible or public actions**, such as pushing to `main`, deleting files, changing the license or publishing anything outside the repository, unless a maintainer explicitly asked for it.

## 2. Quality of statements

- **Do not invent facts.** If you are not sure, say so.
- **Cite sources** for factual statements based on research (links to documentation, standards, repositories).
- **Separate facts, assumptions and opinions** clearly, e.g. "verified", "assumption", "recommendation".
- **Check version-dependent information** (software versions, features, command syntax) before relying on it. If no version is given, assume the latest available version and say so.

## 3. Language

- **Everything in the repository is written in English:** documentation, code comments, commit messages, issues and pull request descriptions.
- Discussions with the maintainers may take place in German. Anything that goes into the repository is written or translated into English.

## 4. Documentation

| Location | Content |
|---|---|
| `README.md` | Vision, project character, naming, license |
| `docs/drafts/` | Drafts and starting points for discussion. Each file starts with a status line. |
| `docs/journal/` | A rough record of how we work and what we learn, especially about collaboration between humans and AI. One file per session or milestone, named `YYYY-MM-DD-<topic>.md`. |

- **Document as you go.** Summarize results, decisions and their reasons while you work, not afterwards.
- **Journal entries focus on insight, not on operational detail.** Readers want to learn how we work, not every setup step.
- **Make AI contributions visible.** If an agent made a substantial contribution, the document or commit says so.

## 5. Commits and changes

- Commit messages in English, imperative mood, with a short summary line (e.g. `Add initial concept draft`).
- AI-assisted commits carry a `Co-Authored-By:` trailer that names the agent.
- Keep changes small and focused. Do not mix unrelated changes in one commit.
- Never commit secrets, tokens, passwords, personal data or private network details (e.g. internal hostnames, IP addresses).

## 6. Connectors

- Connectors to concrete sources are **not** part of this repository. The project provides **skills and templates** for building them with AI.
- When you work on connector templates, use generic examples. Do not put real credentials or environment details into the repository.

## 7. License

- The project is licensed under **Apache 2.0** (see [LICENSE](LICENSE) and [NOTICE](NOTICE)).
- Contributions are made under the same license.
- Do not add code or content from sources with incompatible licenses. If you are not sure, ask.
