# corvia – Initial Concept

> **Status:** Draft, the starting point for further thinking and discussion
> **Source:** Original idea sketch by quasipapa (2026-11-22), restructured, content unchanged
> **Note:** The model-based approach (section 2) is *one possible* solution and does not have to be the best one.

---

## 1. Core idea

Generic management and evaluation of metadata for "any" use case.

The focus is on:

- **collecting** information
- **evaluating** information
- **curating** information
- **synchronizing** information

---

## 2. Two levels (one possible approach)

### 2.1 Generic model

Management of a generic model that can represent many different concrete models.

### 2.2 Concrete models

Management of concrete models with:

- **Typed items**
  - The type is a name chosen by the users.
  - Attributes and possible relationships to other items depend on the type.
- **Typed attributes on items**, e.g. string, formatted free text, number, enum, …
- **Relationships between 2..n items** with
  - multiplicities 1..1, 1..n, n..m
  - unique and non-unique relationships

### 2.3 Managing the concrete models

The concrete models themselves are managed as well.

---

## 3. Sources and connectors

- The tool collects metadata from different sources and relates them to each other.
  Examples: Home Assistant, FritzBox, Omada, Dockhand, PVE, …
- **Connectors are not part of the project.**
  The project provides **skills and templates** that make it efficient to build connectors with AI.
- Connector variants:
  - Integration via **REST**
  - **Import and export** of models and/or items via **CSV, XML, JSON**
- **Bidirectional updates:** Some information should be updatable in both directions: read again from the source, and changed at the source from within the tool.

---

## 4. Versioning and stages

- Models, items and relationships are **versioned**.
- Versions of models and items are delivered through **stages**:
  **Development → Test → Production**
- In development, different versions can be **merged**.

---

## 5. Example use cases

| Audience | Use case |
|---|---|
| **Private users** | An overview of the devices in a smart home, including the infrastructure needed to run it |
| **Commercial users** | Importing data from tools such as LUY, LeanIX, … for an end-to-end view of **processes → systems → infrastructure** |

---

## 6. The idea behind the name

Taken from the naming process (see the README):

- **cor / core:** the core, the heart of the information collection
- **via:** the way, e.g. to improvements that become visible through the collected information

---

## Discussion notes

*(Space for questions, ideas and decisions. Please add your handle and the date to each entry.)*

-
