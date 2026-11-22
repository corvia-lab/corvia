# Stage 1 Meta-Model Exploration – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The checkboxes are also tracked by OpenSpec (`openspec-apply-change`).

**Goal:** Specify the generic meta-model, a smart home model and an enterprise control model as validated YAML files, and build throwaway static prototypes that let the maintainer judge usability, editing and simulated synchronization.

**Architecture:** The meta-model is defined by JSON Schemas (structure, level 1) and a Python validator (conformance of items to their concrete model, level 2). A Python script turns each example folder into one normalized JSON bundle. Static HTML pages with plain ES modules read the bundles. Two small JS modules hold the testable logic: model navigation (`model.js`) and pending changes (`deltas.js`).

**Tech Stack:** Python ≥ 3.11 with PyYAML, jsonschema and pytest; Node.js ≥ 20 (built-in `node:test`, no npm packages); plain HTML, CSS and ES modules in the browser, no framework and no bundler.

**Spec:** [`design.md`](design.md) and [`proposal.md`](proposal.md) in this change.

## Global Constraints

- Everything in the repository is in English: files, comments, commit messages (AGENTS.md §3).
- Example data is invented. No real hostnames, IP addresses or personal data (AGENTS.md §5, design D8).
- Prototypes are throwaway: static pages, no backend, state in memory only, reload restores the bundle state (D6, D7).
- Write-back to sources is simulated, never real (D5).
- The meta-model knows no API paths, protocols or credentials of sources; a binding is only `connector` + `id` (D4).
- Prototype code contains no type-specific logic. Everything type-specific comes from the model or the presentation file (D7).
- Commits: imperative mood, `Co-Authored-By:` trailer for AI-assisted commits (AGENTS.md §5).
- Record the time spent per task in `docs/findings/stage-1-findings.md` (cycle time is part of the exploration, D8).

## Review Focus

- **Dangling references:** a relationship that names an item ID that does not exist (or an item marked deleted). The validator reports it, and the prototype shows the relationship with a "missing item" marker instead of failing. → Task 2 and Task 6.
- **Cycles:** `realized_by` chains or tree levels that loop back. Path and tree building stop at already visited items. → Task 6.
- **YAML type coercion and non-ASCII text:** values such as `no`, `on`, `0123` or dates that YAML turns into other types, and names with umlauts. The validator reports a wrong type instead of accepting it, and UTF-8 text survives the round trip. → Task 2 and Task 5.
- **Source change on an item deleted in corvia:** the source wins, so the proposed decision is to discard the delete. → Task 7.
- **Editing an unbound attribute, and editing a bound one twice:** unbound changes the value directly with no delta; bound keeps only the last pending value. → Task 7.

---

## 1. Meta-model structure (level 1)

**Files:**
- Create: `requirements-dev.txt` (`PyYAML>=6`, `jsonschema>=4.20`, `pytest>=8`)
- Create: `pyproject.toml` (pytest config only: `testpaths = ["tests"]`, `pythonpath = ["tools"]`)
- Create: `spec/metamodel/README.md` (concepts in prose: item, type, attribute, relationship as item, role, binding, pending delta, sync status)
- Create: `spec/metamodel/model.schema.json`, `spec/metamodel/items.schema.json`, `spec/metamodel/presentation.schema.json`
- Create: `tools/corvia_tools/__init__.py`, `tools/corvia_tools/load.py`, `tools/corvia_tools/structure.py`
- Test: `tests/test_structure.py`, fixtures in `tests/fixtures/minimal/` (`model.yaml`, `items.yaml`, `presentation.yaml`)

**File format (decided here, used by all later tasks):**

`model.yaml`
```yaml
model: <name>
connectors: [<connector-name>, ...]
types:
  <type-name>:
    kind: item | relationship
    attributes:
      <attr>: { type: string|text|number|boolean|date|enum, required: <bool>, values: [..] }   # values only for enum
    roles:            # only for kind: relationship
      <role>: { types: [<type-name>, ...], count: "1"|"1..n", per_item: "0..1"|"0..n"|"1"|"1..n", ordered: <bool> }
    unique: <bool>    # relationship: no two with the same role players
```
Role `types` may name relationship types. This is how "realized by" points to a relationship (D1).

`items.yaml`
```yaml
items:
  - id: <unique-id>
    type: <type-name>
    binding: { connector: <name>, id: <external-id> }        # optional, item level
    sync_status: new | deleted                                # optional (D5)
    attributes:
      <attr>: <scalar>                                        # shorthand
      <attr>: { value: <scalar>, binding: {...}, pending: { to_source: {value, status, message}, from_source: {value, status} } }
    roles:                                                    # only for relationships
      <role>: [<item-id>, ...]
```
Delta `status` values: `open`, `superseded_by_source`, `failed`.

`presentation.yaml`
```yaml
types:
  <type-name>:
    label: <text>
    icon: <single emoji or short text>
    title_attribute: <attr>
    attribute_order: [<attr>, ...]
    as_edge: <bool>                     # relationships only
    edge_label_attribute: <attr>
    drill_down: { via: <relationship-type>, target_role: <role>, path_role: <role>, note_attribute: <attr> }
views:
  - id: <id>
    label: <text>
    kind: tree | list
    root_type: <type-name>              # tree
    levels: [ { via: <relationship-type>, from_role: <role>, to_role: <role>, group_by: { via, from_role, to_role } } ]
    type: <type-name>                   # list
```

**Interfaces:**
- Produces: `load_folder(path: str | Path) -> dict` returning `{"model": dict, "items": list[dict], "presentation": dict}`; `structure_errors(doc: dict, kind: Literal["model","items","presentation"]) -> list[str]` (empty list = valid).

- [x] 1.1 Write failing tests in `tests/test_structure.py`: `test_minimal_fixture_is_structurally_valid` (all three kinds return `[]`), `test_unknown_top_level_key_is_rejected` (adding `foo: 1` to the model gives one error mentioning `foo`), `test_relationship_without_roles_is_rejected`, `test_enum_without_values_is_rejected`, `test_utf8_names_load` (an item name `"Küche Licht"` loads unchanged).
- [x] 1.2 Run `pytest tests/test_structure.py -v`. Expected: FAIL (module not found).
- [x] 1.3 Write the three JSON Schemas (draft 2020-12, `additionalProperties: false` everywhere), the minimal fixture (one item type, one binary relationship type, two items, one relationship), `load_folder` (UTF-8, `yaml.safe_load`) and `structure_errors` (`jsonschema.Draft202012Validator`, one message per error with its JSON path).
- [x] 1.4 Run `pytest tests/test_structure.py -v`. Expected: 5 passed.
- [x] 1.5 Write `spec/metamodel/README.md` (one short section per concept, with a link to the design decision it comes from).
- [x] 1.6 Commit: `Add meta-model schemas and structure validation`.

## 2. Conformance validator (level 2) and CLI

**Files:**
- Create: `tools/corvia_tools/conformance.py`, `tools/validate.py` (CLI wrapper)
- Test: `tests/test_conformance.py` (builds small invalid variants of the minimal fixture in `tmp_path`)

**Interfaces:**
- Consumes: `load_folder`, `structure_errors` (Task 1).
- Produces: `conformance_errors(folder: dict) -> list[str]`; CLI `python tools/validate.py <folder>` prints one error per line, exits `0` when valid and `1` otherwise, and runs level 1 before level 2.

- [x] 2.1 Write failing tests, one per rule, each asserting exactly one error that contains the quoted fragment:
  `test_duplicate_item_id` ("duplicate id"), `test_unknown_type` ("unknown type"), `test_unknown_attribute` ("unknown attribute"), `test_missing_required_attribute` ("required"), `test_wrong_value_type` (string attribute with YAML value `no` → "expected string"), `test_enum_value_not_allowed` ("not in enum"), `test_role_player_type_not_allowed` ("not allowed in role"), `test_role_count_violated` (two players in a `count: "1"` role → "count"), `test_per_item_violated` (device in two `per_item: "0..1"` relationships → "per_item"), `test_unique_relationship_duplicate` ("unique"), `test_dangling_reference` ("unknown item"), `test_unknown_connector` ("unknown connector"), `test_pending_on_unbound_attribute` ("pending requires binding"), `test_presentation_unknown_type` ("unknown type"), `test_as_edge_on_non_binary_relationship` ("as_edge requires exactly two roles with count 1"), `test_minimal_fixture_conforms` (`[]`).
- [x] 2.2 Run `pytest tests/test_conformance.py -v`. Expected: FAIL.
- [x] 2.3 Implement `conformance_errors` and the CLI. A binding counts as present when the item or the attribute has one. Date values must be ISO `YYYY-MM-DD`, given as string or as a YAML date.
- [x] 2.4 Run `pytest -v`. Expected: all passed. Run `python tools/validate.py tests/fixtures/minimal`. Expected: exit code 0, no output.
- [x] 2.5 Commit: `Add conformance validator and validate CLI`.

## 3. Smart home example model

**Files:**
- Create: `examples/smart-home/model.yaml`, `examples/smart-home/items.yaml`, `examples/smart-home/presentation.yaml`, `examples/smart-home/README.md` (the setup in prose, the list of messy cases and which item IDs show each one)
- Test: `tests/test_examples.py`

**Content (from design, "Invented example setup"):**
- Item types: `location`, `host`, `ha_instance`, `device`, `device_class`, `gateway`, `broker`, `vpn_tunnel`, `external_service`.
- Relationship types: `runs_on` (ha_instance → host), `hosted_at` (host → location), `serves` (ha_instance → location), `located_at` (device|gateway → location), `classified_as` (device → device_class, `per_item: "0..1"`), `connection` (binary: `source` device|gateway|broker|ha_instance, `target` ha_instance|gateway|broker|external_service; attributes `protocol` enum [zigbee, thread, matter, mqtt, ble, rf433, wifi, https, vpn], `scope` enum [internal, external], `path_note` text), `broker_link` (n-ary: `broker` count 1, `publishers` 1..n, `subscribers` 1..n), `realized_by` (`realized` → connection, `path` 1..n ordered → gateway|broker|vpn_tunnel|host|connection), `tunnel_endpoints` (vpn_tunnel → 2 locations, `count: "1..n"`).
- Connectors: `home-assistant`, `router`, `vendor-cloud`.
- All seven messy cases from the design. Case 7 is `ha_instance` 2: `runs_on` a host that is `hosted_at` location 1 while it `serves` location 2.
- Presentation: an overview tree `location → (serves) ha_instance → (connection, target role) device`, grouped by `classified_as`; a list view per main type; `connection` with `as_edge: true`, `edge_label_attribute: protocol`, `drill_down` via `realized_by`.

- [x] 3.1 Write failing tests in `tests/test_examples.py`: `test_smart_home_is_valid` (level 1 and 2 return `[]`), `test_smart_home_has_messy_cases`, one assert per case: a device without `classified_as`; two devices sharing one `name` with different connectors; a moved device, shown as a device `located_at` location 1 but connected to an instance that serves location 2 (stage 1 has no history, so the move shows up as this inconsistency); a device whose `name` is bound and `purchase_date` unbound; a `connection` with `path_note` and no `realized_by`; a device with `battery: empty`; an `ha_instance` whose `serves` location differs from the `hosted_at` location of its host; an item with a pending `from_source` delta that conflicts with a pending `to_source` delta.
- [x] 3.2 Run `pytest tests/test_examples.py -v`. Expected: FAIL (folder missing).
- [x] 3.3 Write the three YAML files and the README. Aim for 30 to 50 items in total.
- [x] 3.4 Run `pytest -v` and `python tools/validate.py examples/smart-home`. Expected: all passed, exit code 0.
- [x] 3.5 Commit: `Add smart home example model`.

## 4. Enterprise control model

**Files:**
- Create: `examples/enterprise/model.yaml`, `examples/enterprise/items.yaml`, `examples/enterprise/presentation.yaml`, `examples/enterprise/README.md`
- Modify: `tests/test_examples.py`

**Content:** Item types `business_process`, `application`, `server`, `datacenter`. Relationship types `supported_by` (process → application, with attribute `criticality` enum [low, medium, high]), `runs_on` (application → server), `located_in` (server → datacenter). Connector `ea-tool`. About 10 items, including one application without a server (messy case). Presentation: tree `business_process → application → server`.

- [x] 4.1 Write failing tests: `test_enterprise_is_valid`, `test_enterprise_chain_exists` (at least one process → application → server → datacenter chain).
- [x] 4.2 Run `pytest tests/test_examples.py -v`. Expected: the two new tests FAIL.
- [x] 4.3 Write the files.
- [x] 4.4 Run `pytest -v` and `python tools/validate.py examples/enterprise`. Expected: all passed, exit code 0.
- [x] 4.5 Record in `docs/findings/stage-1-findings.md` (create the file with the headings from Task 10) anything in the enterprise model that the meta-model could not express directly.
- [x] 4.6 Commit: `Add enterprise control model`.

## 5. JSON bundles for the prototypes

**Files:**
- Create: `tools/corvia_tools/bundle.py`, `tools/build_bundles.py`
- Create (generated, committed): `prototypes/data/smart-home.json`, `prototypes/data/enterprise.json`, `prototypes/data/index.json` (`[{"id": "smart-home", "label": ...}, ...]`)
- Test: `tests/test_bundle.py`

**Interfaces:**
- Consumes: `load_folder`, `structure_errors`, `conformance_errors`.
- Produces: `build_bundle(folder_path) -> dict` with keys `model`, `items`, `presentation`. Every attribute is in object form `{"value": ..., "binding"?: ..., "pending"?: ...}`. Dates are ISO strings. Item order is preserved. `python tools/build_bundles.py` writes all bundles from `examples/*`, refuses to write when validation fails (exit 1), and writes JSON with `ensure_ascii=False`, `indent=2`.

- [x] 5.1 Write failing tests: `test_shorthand_is_normalized`, `test_dates_become_iso_strings`, `test_utf8_survives` ("Küche" stays "Küche" in the written file), `test_invalid_folder_is_refused`, `test_committed_bundles_are_current` (rebuilding equals the committed files).
- [x] 5.2 Run `pytest tests/test_bundle.py -v`. Expected: FAIL.
- [x] 5.3 Implement and run `python tools/build_bundles.py`.
- [x] 5.4 Run `pytest -v`. Expected: all passed.
- [x] 5.5 Commit: `Add bundle export for prototypes`.

## 6. Model navigation module (`model.js`)

**Files:**
- Create: `prototypes/lib/model.js` (ES module, no dependencies)
- Test: `prototypes/tests/model.test.mjs` (run with `node --test prototypes/tests/`), using `prototypes/data/smart-home.json` and small inline bundles

**Interfaces:**
- Consumes: bundle format from Task 5.
- Produces:
  - `indexBundle(bundle) -> Index` with `Index.byId: Map<string, Item>`, `Index.byType: Map<string, Item[]>`, `Index.bundle`
  - `title(index, item) -> string` (presentation `title_attribute`, otherwise the item ID)
  - `relationsOf(index, itemId) -> Array<{ relationship: Item, role: string }>`
  - `otherPlayers(index, relationship, role) -> Array<Item | { missing: string }>`
  - `isEdgeType(index, typeName) -> boolean` (`as_edge` set and exactly two roles with `count: "1"`)
  - `drillDown(index, relationshipId) -> { elements: Array<Item | { missing: string }>, note: string | null }`
  - `buildTree(index, view) -> TreeNode[]` with `TreeNode = { item, children: TreeNode[], groups?: Array<{ label: string, nodes: TreeNode[] }> }`. Items without a group go into the group labeled `"(none)"`.

- [x] 6.1 Write failing tests: `title uses title_attribute`, `relationsOf finds both directions`, `isEdgeType true for connection, false for broker_link`, `drillDown returns ordered path`, `drillDown returns note when no realized_by exists`, `drillDown stops on a cycle` (inline bundle where A is realized by B and B by A; returns without hanging, each element at most once), `missing player is marked, not thrown` (inline bundle with a dangling ID), `buildTree groups devices by class with (none) group`, `buildTree works for the enterprise bundle without code changes`.
- [x] 6.2 Run `node --test prototypes/tests/`. Expected: FAIL.
- [x] 6.3 Implement `model.js`. Track visited IDs in `drillDown` and `buildTree`.
- [x] 6.4 Run `node --test prototypes/tests/`. Expected: all pass.
- [x] 6.5 Commit: `Add model navigation module for prototypes`.

## 7. Pending changes module (`deltas.js`)

**Files:**
- Create: `prototypes/lib/deltas.js`
- Test: `prototypes/tests/deltas.test.mjs`

**Interfaces:**
- Consumes: `Index` from Task 6 (works on a deep copy of `bundle.items`).
- Produces:
  - `createState(bundle) -> State`
  - `editAttribute(state, itemId, attr, value) -> void`: for a bound attribute, set `pending.to_source = { value, status: "open" }`, overwriting any earlier one (the last change wins). For an unbound attribute, set the value directly.
  - `receiveSourceChange(state, itemId, attr, value) -> void`: set `pending.from_source = { value, status: "open" }`. An existing `to_source` becomes `superseded_by_source`.
  - `markDeleted(state, itemId) -> void`: bound items get `sync_status: "deleted"`, unbound items are removed at once.
  - `listPending(state) -> PendingEntry[]` with `PendingEntry = { key, itemId, attribute: string | null, direction: "to_source" | "from_source" | "delete", current, pending, status, connector, externalId, proposed: "accept" | "discard" }`. `key` is `` `${itemId}/${attribute ?? ""}/${direction}` ``. Proposals: `from_source` → accept; superseded `to_source` → discard; a delete on an item with an open `from_source` → discard (the source wins); otherwise accept.
  - `applySync(state, decisions: Map<string, "accept" | "discard">, results: Map<string, { ok: boolean, message?: string }>) -> OutboundCall[]` with `OutboundCall = { connector, externalId, attribute, value, operation: "update" | "delete" }`. Accepted `from_source`: take over the value and remove both deltas. Accepted `to_source` or delete: emit a call; on `ok` apply it and remove the delta, otherwise set `status: "failed"` with the message. Discarded: remove the delta.
  - Creating items is out of scope for the prototype. Record it as a finding.

- [x] 7.1 Write failing tests: `edit unbound attribute changes value without delta`, `edit bound attribute twice keeps last value only`, `source change supersedes corvia change`, `listPending proposes source wins`, `accepted source change updates value and clears deltas`, `accepted corvia change emits outbound call`, `failed write-back keeps delta with failed status and message`, `discard removes delta`, `delete of bound item waits for sync`, `delete of unbound item is immediate`, `source change on deleted item proposes discarding the delete`, `state does not mutate the original bundle`.
- [x] 7.2 Run `node --test prototypes/tests/`. Expected: the new tests FAIL.
- [x] 7.3 Implement `deltas.js`.
- [x] 7.4 Run `node --test prototypes/tests/`. Expected: all pass.
- [x] 7.5 Commit: `Add pending changes module for prototypes`.

## 8. Clickable prototype

**Files:**
- Create: `prototypes/index.html`, `prototypes/app.js`, `prototypes/style.css`, `prototypes/README.md` (marked as throwaway; how to start: `python3 -m http.server -d prototypes 8000`, then open `http://localhost:8000`)

**Interfaces:**
- Consumes: `model.js` (Task 6), `deltas.js` (Task 7), `prototypes/data/*.json` (Task 5).

**Screens (all driven by the bundle, no type names in `app.js`):**
- Model switcher (from `index.json`) and view switcher (from `presentation.views`).
- Tree and list views rendered with `buildTree`, with group headings and counts.
- Item detail: attributes in `attribute_order`, a "bound" marker with connector + ID, inline editing; relationships shown as edges (`A → B · <edge_label>`) when `isEdgeType`, otherwise as a node with its role players; "missing item" markers; a drill-down panel for the technical path or its note.
- Pending changes: the table from `listPending` with the proposed decision preselected, a per-row toggle for "simulate failure", a "Run check" button that calls `applySync` and shows the outbound calls.
- A "Simulate source change" action on bound attributes (calls `receiveSourceChange`), so the conflict case can be tried.

- [x] 8.1 Build the pages.
- [x] 8.2 Verify by hand in a browser, checking off each line:
  1. Both models open, and their trees render.
  2. Devices are grouped by class, including "(none)".
  3. The drill-down for a location 2 Bluetooth connection shows the ESP32 → VPN path in order.
  4. Renaming a bound device creates one pending row, and renaming it again still shows one row.
  5. A simulated source change marks the corvia change as superseded, with "discard" preselected.
  6. A simulated failure leaves the row with status "failed".
  7. Reloading the page restores the original state.
  8. `grep -nE "ha_instance|device|business_process" prototypes/app.js` returns nothing.
- [x] 8.3 Run `node --test prototypes/tests/` and `pytest`. Expected: all pass.
- [x] 8.4 Commit: `Add throwaway clickable prototype`.

## 9. Agent entry point check

**Files:**
- Create: `docs/findings/stage-1-agent-check.md` (questions, the agent's answers, assessment)

- [x] 9.1 Write five questions into the file, each with the expected answer derived from `examples/smart-home/items.yaml`:
  1. Which devices are connected to Home Assistant instance 2, grouped by protocol?
  2. Which connector and external ID does device X come from?
  3. Which connections depend on the VPN tunnel?
  4. Where does instance 2 run, and which location does it serve?
  5. Which devices have no device class?
- [x] 9.2 Dispatch a fresh subagent that may read only `spec/metamodel/README.md` and `examples/smart-home/`. Give it the questions without the expected answers, and record its answers verbatim.
- [x] 9.3 Assess each answer (correct / partly / wrong) and note what in the model helped or got in the way.
- [x] 9.4 Commit: `Add agent entry point check`.

## 10. Findings document

**Files:**
- Create or complete: `docs/findings/stage-1-findings.md` with the status line `> **Status:** Draft, findings of stage 1, decision pending`

**Headings:** Hypothesis and result · What the meta-model could express directly · Where it needed workarounds · Presentation information that turned out to be needed (D3 candidates kept or dropped, and new ones such as `drill_down`) · Editing and synchronization (D5 rules as experienced) · Agent entry point (summary of Task 9) · Cycle time (time per task, from the log) · Open questions for stage 2 · **Decision on stage 2** (left empty for quasipapa)

- [x] 10.1 Fill every heading except the decision. Separate facts, assumptions and opinions.
- [ ] 10.2 Ask quasipapa to evaluate the prototype (Task 8.2 checklist as a starting point) and to write the decision.
- [x] 10.3 Commit: `Add stage 1 findings draft`.

## 11. Maintainer feedback on the prototype (2026-11-22)

Requested by quasipapa after reviewing PR #1.

**Files:**
- Create: `prototypes/lib/table.js`, `prototypes/lib/markdown.js`
- Modify: `prototypes/app.js`, `prototypes/style.css`, `prototypes/README.md`
- Test: `prototypes/tests/table.test.mjs`, `prototypes/tests/markdown.test.mjs`

**Interfaces:**
- `listColumns(index, typeName) -> Column[]`: attributes in `attribute_order`, then one column per relationship type in which the type can play a role. `Column = { id: "attr:<name>" | "rel:<type>", kind, label, attribute?, spec?, relType? }`
- `cellText(index, item, column) -> string`: binary relationships as `→ other (edge label)` or `← other`, n-ary as `as <role>; <role>: players`
- `filterRows(index, items, visibleColumns, { search, filters }) -> Item[]` (case-insensitive; column filters combine with AND; search covers title and visible columns)
- `sortRows(index, items, column, "asc" | "desc") -> Item[]` (empty values last in both directions)
- `renderMarkdown(text) -> string` (safe subset, HTML escaped, only http(s) links)

- [x] 11.1 Text attributes (e.g. `notes`) are edited in a multi-line field and shown as Markdown.
- [x] 11.2 List views become tables: search, sort by column, filter per column, choose visible columns, edit attributes in place (bound attributes create pending changes), one column per relationship type.
- [x] 11.3 Tests: `node --test 'prototypes/tests/*.test.mjs'` → 38 pass. Checked in a browser (automated): search, filter, sort, hide column, edit in place, Markdown rendering, no console errors.

## 12. Business letter example (design D9, 2026-11-22)

**Files:**
- Create: `examples/business-letter/{model,items,presentation}.yaml`, `examples/business-letter/README.md`, `prototypes/data/business-letter.json` (generated)
- Modify: `spec/metamodel/presentation.schema.json` and `spec/metamodel/README.md` (`repeat` on tree levels), `prototypes/lib/model.js` (`buildTree` repeat, derived titles for unnamed relationships)
- Test: `tests/test_examples.py`, `tests/test_structure.py`, `prototypes/tests/model.test.mjs`

- [x] 12.1 Tests first: example valid; conditions attached to "contains" relationships and reused; parts nested at least two levels; partner structure type with ordered scalar fields; letter groups and letters both consume data items and groups; tree level may repeat; repeating tree reaches the deepest part; unnamed relationships get titles from their players.
- [x] 12.2 Model, data and presentation as in D9.
- [x] 12.3 `python tools/build_bundles.py`; pytest → 47 passed; node → 40 pass; browser check: tree, condition on relationship, conditions list, no console errors.
- [x] 12.4 Findings updated, including the UI fine-tuning the maintainer deferred.

## 13. Relationship direction in the detail view (maintainer feedback, 2026-11-22)

- [x] 13.1 In the detail view, the selected item always stands on the left of a binary relationship; the arrows show the direction (e.g. `Contract letters ← member of ← Welcome letter`). New function `edgeFrom(index, relationship, ownRole) -> { self, others, arrow: "→" | "←", label }` in `prototypes/lib/model.js`, test in `prototypes/tests/model.test.mjs`; node → 41 pass; checked in the browser.
