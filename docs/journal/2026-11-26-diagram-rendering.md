# 2026-11-26 – Short session: how readers can see the diagrams

> **Status:** Draft, journal entry
> **Participants:** quasipapa (human), Claude (AI agent, chat session in the Claude mobile app)
> **Purpose:** A rough record of how we worked and what we learned.
> **Previous session:** [Implementing and evaluating stage 1](2026-11-22-stage-1-implementation.md)

---

## 1. What happened

quasipapa asked how users of the repository can see the PlantUML diagrams, since GitHub does not render them. The agent listed five options. quasipapa asked what speaks against Mermaid, then asked the agent to check the repository itself. Based on that check, quasipapa decided to keep PlantUML and render SVGs in a GitHub Actions workflow. The decision and its reasons are in [docs/diagrams/README.md](../diagrams/README.md#decision-keep-plantuml-render-svgs-in-ci). The agent then wrote the workflow and opened the pull request in the same session.

## 2. Observations

### 2.1 Observed by the agent

- **General answers were not enough:** the first two answers compared Mermaid and PlantUML in general terms ("Mermaid is weaker for large class diagrams"). Only after reading the four `.puml` files did concrete blockers show up: reading-direction markers on associations, `enum {…}` in attribute types, the `<<relationship>>` stereotype that carries design D1, and double edges between the same classes. The decision rests on these, not on the general comparison.
- **The human asked the right follow-up question:** "Look in the repository yourself" turned a generic recommendation into one grounded in our files. An agent with repository access should do this before recommending, not after being asked.
- **Research is never complete in one pass:** a later search for the workflow found an official PlantUML browser extension that renders PlantUML inside GitHub. The first answer had missed it. It is now listed as a viewing option.
- **The first real run found what reading could not:** the agent could not run PlantUML in its environment, so the first workflow run was the first test. It wrote `corvia-metamodel.svg` instead of `metamodel.svg`, because the name after `@startuml` sets the file name. It also showed that the bot commit starts a run that GitHub holds for approval, while the documentation the agent had cited says such pushes start no run at all. Both were fixed or documented within minutes. A small, fast feedback loop beat more research.
