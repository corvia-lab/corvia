# corvia

**The core of your metadata, the way to better decisions.**

> **C**ollect · **O**rganize · **R**elate · **V**ersion · **I**ntegrate · **A**nalyze

corvia collects metadata from many different sources, relates it, keeps it versioned and lets you curate and synchronize it, from a smart home up to an enterprise landscape of processes, systems and infrastructure.

---

## A research, exploration and experimentation project

corvia is deliberately run as a **research, exploration and experimentation project**. It is not a finished product, and it may change direction as we learn:

- **Research:** asking questions on purpose and documenting what we find
- **Exploration:** looking into new ground without a fixed goal, such as new sources, new ways of working and new uses of AI
- **Experimentation:** testing hypotheses in practice and keeping or dropping them

All three apply on two levels:

### 1. Collaboration

The central question is **how Business, IT and AI can work together well within one project**:

- How does a business vision become requirements, a design and finally working software when AI takes part in every step?
- Which roles, rituals and artefacts help people and AI work together, and which get in the way?
- How do we keep transparency, quality and accountability when large parts of the work are done with AI?

The project starts with two people actively working on it. Experiences, decisions and lessons learned are documented in the repository so others can follow them and reuse them.

### 2. Content

The tool itself is an experiment too:

- **Hypothesis:** A generic, versioned meta-model (typed items, typed attributes, relationships with multiplicities) can describe very different domains, from a smart home to enterprise architecture.
- **Open questions:** How far does the generic approach go? Where do we need domain-specific extensions? Is bidirectional synchronization with the sources workable in practice?
- **Openness:** The model-based approach is *one possible* solution, not a fixed commitment. If a better approach turns up, we will follow it.

Expect breaking changes, unfinished parts and changes of direction. They are part of the experiment.

We call each research and development cycle an **iteration**. In corvia, a **stage** is one of Development, Test or Production. **Promotion** transfers a version from Development to Test or from Test to Production after explicit approval for that transfer. Documents written before 2026-11-26 (journal entries, findings) still call iterations "stages"; they are kept as written.

---

## AI-assisted by design

AI support is not an add-on here. It is part of how the project works, and **it is used on purpose in every phase**:

| Phase | How AI is involved |
|---|---|
| **Visioning** | Sharpening the idea, use cases and naming. The name *corvia* itself came out of a session with AI (see below). |
| **Design** | Architecture options, the data model and alternatives compared with their trade-offs |
| **Requirements** | Turning ideas into structured, testable requirements, and spotting gaps and contradictions |
| **Development** | Writing code, tests and documentation, and doing reviews |
| **Connectors** | corvia ships no connectors. Instead it provides **skills and templates** so you can build connectors to your own sources efficiently with AI. |

Guiding principle: **AI proposes, people decide.** Every decision is made and owned by the people on the project. Where AI made a substantial contribution, we say so.

---

## About the name

### Meaning

The name works on two levels:

**As an acronym**, it lists what the tool does:

| Letter | Stands for | What it means in corvia |
|---|---|---|
| **C** | Collect | Gather metadata from different sources (e.g. Home Assistant, FritzBox, Omada, Proxmox VE, LeanIX, LUY) |
| **O** | Organize | Structure the information as typed items with typed attributes |
| **R** | Relate | Connect items through relationships (1..1, 1..n, n..m, unique or non-unique) |
| **V** | Version | Version models, items and relationships and promote them through stages (Development → Test → Production) |
| **I** | Integrate | Connect sources via REST or via CSV/XML/JSON import and export, in both directions where needed. Connectors are not shipped; skills and templates help you build them with AI. |
| **A** | Analyze | Evaluate the combined picture |

**As a word**, it combines two parts:

- **cor / core**: *cor* is Latin for "heart", and *core* means the centre where all the information comes together.
- **via**: Latin for "way". It is the path from the collected information to the improvements you can identify from it.

Read together: *from the core to the way forward*.

### How we got here

The name came out of a short brainstorming session in November 2026:

1. **Model-centric names first.** The first ideas focused on the generic meta-model (typed items, attributes, relationships). *relata* (Latin: "things set in relation") and *polymodel* were considered. *polymodel* was dropped because the name is already widely used for polymorphic ORM models (e.g. a PyPI package and a Google App Engine class).
2. **Shift of focus.** The model is only one possible way to build the tool, so the focus moved to what the tool does: **collecting, evaluating, curating and synchronizing** information. That led to *synopta* (from *synopsis*, an overall view). Names like *tessera*, *cairn* and *kurator* were dropped because projects with these names already exist in the same or a nearby field.
3. **An invented word built from initials.** The last step was a word made from the initials of German and English terms for the use cases, one that also expresses the idea of *connection*. Candidates included *savia*, *lincas*, *sylca* and **corvia**. corvia won: its acronym covers the core features, including versioning and integration, and the word itself carries the "core" and "way" meaning described above.

---

## License

corvia is licensed under the **[Apache License 2.0](LICENSE)**.

### Why Apache 2.0

We wanted the code to be **freely available and changeable, with credit to its authors**. That calls for a permissive license. We chose Apache 2.0 over the shorter MIT License for these reasons:

1. **Reliable credit for the authors.** Anyone who redistributes the code must keep the license text and the [NOTICE](NOTICE) file, and the NOTICE file names the project's authors.
2. **Clear rules for contributions.** The license states the terms under which contributions are made. That helps from the start, with two active contributors and possibly more later.
3. **Changes stay traceable.** Modified files must say that they were changed, which suits a research project well.
4. **Explicit patent grant.** Contributors grant users the patent rights they need, so there is no ambiguity.
5. **The project name is protected.** The license grants no right to use the name *corvia* or the authors' names, so derived projects cannot pose as the original.

We decided against a copyleft license (GPL/AGPL). We do not want to force anyone to publish their own changes. We would rather have corvia used and developed further as widely as possible, in research, in private and in commercial settings.

---

*Repository: [github.com/corvia-lab/corvia](https://github.com/corvia-lab/corvia)*
