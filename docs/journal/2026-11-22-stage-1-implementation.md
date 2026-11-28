# 2026-11-22 – Third session: implementing and evaluating stage 1

> **Status:** Draft, journal entry
> **Participants:** quasipapa (human), Claude (AI agent, chat session in the Claude mobile app, with subagents for review)
> **Purpose:** A rough record of how we worked and what we learned. It is part of the research question on how Business, IT and AI work together in one project.
> **Previous session:** [Requirements exploration](2026-11-22-requirements-exploration.md)

---

## 1. What happened

The session ran from about 21:50 to 00:40, with breaks. It took the [stage 1 design](https://github.com/corvia-lab/corvia/blob/c445a5fa9c89ff2a2179209fdbec637d63327a36/openspec/changes/stage-1-metamodel-exploration/design.md) from the previous session through to a decision on stage 2.

| Step | What happened |
|---|---|
| **Specification in OpenSpec** | The design became the first [OpenSpec](https://github.com/Fission-AI/OpenSpec) change. Setting up OpenSpec in the repository took several rounds (see 2.3). |
| **Plan** | The agent wrote an implementation plan with ten tasks as `tasks.md` (superpowers/writing-plans). quasipapa chose to have the agent execute it itself, with one independent review at the end. |
| **Implementation** | The agent implemented the plan test-first (superpowers/executing-plans): meta-model as JSON Schemas, a validator, the smart home and enterprise example models, and a throwaway clickable prototype. A fresh agent checked whether the model works as an entry point for agents (five of five questions answered correctly). |
| **Review** | A separate reviewer agent found three important issues. The agent fixed them, each with a test that failed first. |
| **Feedback rounds** | quasipapa reviewed the pull request and asked for changes: Markdown for text attributes, list views as searchable and editable tables, and the selected item always on the left in relationships. |
| **Scope extension** | quasipapa added a third example from his own practice, **business letters**, with conditions on relationships and structure types with typed fields. Every relationship could be expressed without changing the meta-model. |
| **Diagrams** | PlantUML class diagrams of the meta-model (by hand) and of the three example models (generated from the model files). |
| **Decision** | quasipapa assessed stage 1 and recorded the decision in the [findings](../findings/stage-1-findings.md). The pull request was merged. |

---

## 2. Observations

### 2.1 As seen by quasipapa

- **Speed:** developing the meta-model and deriving the concrete models was possible in a (very) short time.
- **The human sets the focus:** the first UI, deliberately designed as a throwaway prototype, leaves a lot of room for improvement. Because the focus was on evaluating the model, we deliberately did not spend much time on it. Here, too, the human sets the focus, not the AI.
- **The temptation of polish:** there is a risk of spending a long time on details and fine-tuning even in an early phase of finding ideas, and losing focus. Changes are very quick, and "let's just do this one more thing, then it's complete" is a big temptation. It takes discipline not to get sidetracked.
- **Extending the scope worked:** adding a new concrete model (business letters) caused no problems.
- **Example data:** the generated example data is valid in content. The agent contributed a lot of general knowledge from different domains on the spot.
- **Immediate feedback helps:** being able to evaluate right away helps a lot in finding ideas and making decisions.
- **Low cost:** the cost of the evaluation is (very) manageable. A Claude Pro subscription at about 20 € is money well spent. Without agentic support, quasipapa estimates at least 40 person-days for planning, models, test data and prototype.
- **Technical skills are still needed:** it does not work entirely without technical knowledge. Small things like setting up OpenSpec can be handled, but support from someone comfortable with the command line helps.

### 2.2 Observed by the agent

- **Exploration is the expensive part, implementation the cheap one (fact, from commit times):** the exploration with the human took about 2.5 hours. Once design and plan were agreed, the agent's implementation of the ten tasks took about 20 minutes. The human's review and feedback took most of the remaining time, and that is where the decisions were made.
- **Tests caught real mistakes:** a schema that rejected grouped tree levels, a rendering bug that showed `[object HTMLSpanElement]` instead of a technical path, and a missing case in the Markdown renderer. Each was found by a test or by an automated browser check, not by reading the code.
- **An independent review pays off:** the reviewer agent, which had not seen the work being produced, found three issues the implementing agent had missed. One was a real ordering problem in the synchronization rules, not just a code slip.
- **Decisions stay visible:** every deviation from the plan was recorded as a ruling with its cost, and the important ones went into the pull request for the human to check.
- **Test variant vs. practice:** for the business letters, quasipapa chose the variants that test the meta-model hardest (conditions and structure fields as items), while saying that practice will likely use simpler ones. Making this explicit kept the test honest without pretending it was the target design.
- **Invented data has gaps the human may not see at first:** the address block was used in only one document, while quasipapa expected it in all. Neither noticed when the data was planned; it came up while using the prototype.

### 2.3 Friction and limits

- **Agent ignored its own tool guidance:** the agent created the OpenSpec change folder by hand, although the OpenSpec skills in the repository say to always use the CLI. Validation failed, and quasipapa had to repair it in the terminal.
- **Setting up the tooling took several rounds:** `openspec init` first installed its skills globally instead of into the project. Pushing from a GitHub Codespace failed with an access error until git was told to use the user's own login instead of the Codespace token.
- **Environment limits of the agent:** the agent could not run the OpenSpec CLI or render PlantUML in its environment. The human had to check these results (OpenSpec validation, diagrams in IntelliJ).
- **Small things cost time:** a changed prototype only became visible after a hard reload, because the browser had cached the old files.
- **Long session:** the conversation grew very long. Stage 2 will start in a new chat, with the repository as the shared memory.
