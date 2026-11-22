# 2026-11-22 – Project kickoff with an AI agent

> **Status:** Draft, journal entry
> **Participants:** quasipapa (human), Claude (AI agent, chat session)
> **Purpose:** A rough record of how we worked and what we learned. It is part of the research question on how Business, IT and AI work together in one project.

---

## 1. What happened

The whole kickoff took place in **one chat session of about five hours** (12:39–17:40), with several breaks.

### 1.1 Finding a name (about 25 minutes)

1. **Starting point:** quasipapa described the basic ideas of the tool (see [initial-concept.md](../drafts/initial-concept.md)) and asked for a name for a public GitHub repository.
2. **Model-centric names:** The agent suggested names and checked them against existing projects with web searches. Several were dropped because projects with the same name already exist in the same or a nearby field (*tessera*, *metaloom*, *polymodel*, …). *relata* was a favourite.
3. **More context, new check:** Once it was clear that the repository would live under a personal namespace, the agent re-assessed the conflicts. Organization names no longer counted, but confusion with similar projects still did.
4. **Shift of focus:** quasipapa moved the emphasis from the *model* to the *purpose*: collecting, evaluating, curating and synchronizing information. This led to *synopta*.
5. **Invented word from initials:** quasipapa asked for an invented word built from the initials of terms for the use cases that also expresses *connection*. The agent suggested *corvia* (**C**ollect · **O**rganize · **R**elate · **V**ersion · **I**ntegrate · **A**nalyze), among others.
6. **Human interpretation:** quasipapa added a second meaning: *cor/core* as the heart of the information collection and *via* as the way to improvements. That made the decision.
7. **Final checks:** package registries (PyPI, npm, Docker Hub): no exact match found. The trademark check could not be done reliably by the agent and stays with the humans (DPMAregister, TMview).

### 1.2 Setting up the project frame (about 1.5 hours of active work)

| Topic | Decision | How it came about |
|---|---|---|
| **License** | Apache 2.0 | The agent compared MIT and Apache 2.0 against the requirement "free to use and modify, with attribution". Apache 2.0 won because of the NOTICE file, the contribution terms and the patent grant. |
| **Project character** | Research, exploration and experimentation | quasipapa added this to the README step by step: first research and experiment, then exploration. |
| **AI support** | AI is involved on purpose in visioning, design, requirements and development | Added to the README as a project principle: "AI proposes, people decide." |
| **GitHub setup** | Organization **corvia-lab**, repository `corvia-lab/corvia` | We discussed several options. The agent supported the work at an operational level, with tips on how to set up the repository on GitHub. |
| **Documentation language** | English | Recorded as a rule in `CLAUDE.md`. |
| **Location of drafts** | `docs/drafts/` in the public repository | The agent compared the options (public repo, private repo, Claude project, GitHub Discussions). The public repo fits the transparency promised in the README. |

### 1.3 First results in the repository

- `README.md`: vision, project character, AI support, naming history, license rationale
- `LICENSE` (Apache 2.0, created on GitHub), `NOTICE`, `CITATION.cff`
- `CLAUDE.md`: project rules for AI agents (documentation language)
- `docs/drafts/initial-concept.md`: the initial concept, translated into English
- this journal entry

---

## 2. Observations

### 2.1 What worked well (as seen by quasipapa)

- **Efficient naming:** The names came out of a discussion with the agent, including checks for conflicts with existing products, organizations and repositories.
- **Documentation "on the fly":** The documentation grows while we work, because the agent summarizes as it goes.
- **Fluid working with parallel threads:** This allows parallel threads in thinking and doing. The agent's summaries *still* produce a structured overall picture.
- **Working from a tablet:** Most of the human work was done on a tablet, while the agent had direct access to the repository. It researched, wrote and committed, and the human steered, reviewed and decided. This way of working felt very efficient.
- **Context knowledge on demand:** Topics such as citations, authorship and license choice are background knowledge that can be retrieved and researched efficiently through an agent. That covers both the *content* and how to *implement it technically* (e.g. `NOTICE`, `CITATION.cff`).

### 2.2 What stays with the humans

- **Thinking along and giving creative impulses** to steer what the agents do. Examples from this session: the shift from the model to the purpose, asking for an invented word built from initials, and the double meaning *cor* + *via*.
- **Making decisions**, such as the name, the license, the organization and where documents live.

### 2.3 Friction and limits (observed by the agent)

- **Checks for name conflicts are only indicative.** Web searches often return similar rather than exact names. Some sources (GitHub API, GitHub pages) could not be queried because of rate limits. Trademark registers cannot be searched reliably this way.
- **Setting up access took several rounds.** Before the agent could write to the repository, a few setup steps were needed on the human side. Each missing step only showed up during the next attempt.
- **Some results can only be verified by humans.** For example, the agent could not see how GitHub renders `CITATION.cff`. quasipapa reported the APA display back, and the agent adjusted the file, without success, then reverted. Remaining issue: the APA view shows "quasipapa, & gp." until full names are added.
- **The setup may not carry over to companies.** This project is public and run privately, so giving an agent direct write access to the repository was easy to justify. In a real company context, especially with higher requirements for data protection and security, other or stricter policies may apply and must be followed. Examples: which agents may access which repositories and data, whether agents may push or only open pull requests, and where data may be processed.
- **Separating fact, assumption and opinion helps.** The agent marked which statements were verified, which were assumptions and which were recommendations. That made the human decisions easier.
