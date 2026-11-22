# Stage 1: agent entry point check

> **Status:** Draft, result of Task 9 of the [stage 1 change](../../openspec/changes/stage-1-metamodel-exploration/tasks.md)
> **Date:** 2026-11-22
> **Method:** A fresh AI agent (Claude, subagent without prior context) was allowed to read only `spec/metamodel/README.md` and `examples/smart-home/{model,items,presentation}.yaml`. It was not allowed to read the example README, the tests or the tools. It got the five questions without the expected answers.

## Questions and expected answers

| # | Question | Expected answer (derived from `items.yaml`) |
|---|---|---|
| 1 | Which devices are connected to Home Assistant instance 2, grouped by protocol? | BLE: Cottage Climate, Cottage Temperature Probe, Garage Climate. RF433: Cottage Door Contact. |
| 2 | Which connector and external ID does the device "Kitchen Light" come from? | `home-assistant`, `light.kitchen` |
| 3 | Which connections depend on the VPN tunnel? | `conn-cottage-climate`, `conn-cottage-probe`, `conn-cottage-door`, `conn-garage-climate` |
| 4 | Where does instance 2 run, and which location does it serve? | Runs on the Mini PC at the main house; serves the second site. |
| 5 | Which devices have no device class? | `dev-unknown`, `dev-lr-plug-router` |

## The agent's answers (verbatim)

> **1. Devices connected to HA instance 2, by protocol**
> - BLE: Cottage Climate, Cottage Temperature Probe, Garage Climate
> - RF433: Cottage Door Contact
> - Note: Garage Climate is still `located_at loc-main` (marked as case 3, a stale location), so grouping by location would give a different answer.
> - IDs: conn-cottage-climate, conn-cottage-probe, conn-garage-climate, conn-cottage-door, plus the matching dev-* items.
> - Difficulty: easy. I scanned connections with `target: [ha-2]` and read `protocol` on each. The overview view in presentation.yaml already describes this walk. A reverse index (incoming relationships per item) would have saved the scan.
>
> **2. Source of "Kitchen Light"**
> - Connector `home-assistant`, external ID `light.kitchen`, item `dev-kitchen-light`.
> - There are two pending deltas on the name: `from_source` "Kitchen Main Light" (open) and `to_source` "Kitchen Ceiling Light" (superseded_by_source). So the current name may soon change.
> - Difficulty: trivial, because the item binding is inline. I only had to search by name, since IDs are not names.
>
> **3. Connections that depend on the VPN tunnel (vpn-sites)**
> - conn-cottage-climate, conn-cottage-probe, conn-cottage-door, conn-garage-climate. Each `realized_by` path contains `vpn-sites` (path-cottage-climate, path-cottage-probe, path-cottage-door, path-garage-climate).
> - conn-remote has `protocol: vpn`, but it is not linked to vpn-sites. Its path_note describes a reverse proxy, so I left it out. That is an assumption.
> - Difficulty: medium. It takes two hops (tunnel to path to connection). It is also confusing that "vpn" is both a protocol value and an item type.
>
> **4. Where HA 2 runs and which location it serves**
> - Runs on host-minipc (Mini PC, a server), which is hosted at loc-main (Main house). It serves loc-cottage (Second site).
> - IDs: runs-ha-2, hosted-minipc, serves-ha-2.
> - Difficulty: easy. There are three relationships, and the comment on line 10 explains the split on purpose.
>
> **5. Devices with no device class**
> - dev-lr-plug-router (Living Room Plug, router view) and dev-unknown (Unknown Zigbee Device).
> - I found them by comparing all 12 devices with the 10 `classified_as` items.
> - Difficulty: medium. A missing relationship can only be found by checking every device. The "Case 1" comments gave it away, but an agent shouldn't depend on comments.
>
> **What helped and what got in the way**
> - Helped: relationships are explicit items with named roles, and model.yaml defines them all. That made multi-hop questions mechanical and easy to trust.
> - Helped: inline bindings and deltas answer provenance questions right on the item. The "Case N" comments explain intent.
> - Got in the way: one flat list of items with no reverse lookup. Questions like "what points to X" or "what has no Y" mean scanning the whole file.
> - Got in the way: some things are ambiguous. "vpn" is both a protocol and an item type, conn-remote's path exists only as free text, dev-lr-plug-router is probably the same plug as dev-lr-plug (not merged), and one location is stale. An agent has to decide which of these to trust.
> - Would help: a short header or index in items.yaml listing items by type, and noting known gaps like stale data, duplicates and unmodeled paths.

## Assessment

| # | Result | Note |
|---|---|---|
| 1 | Correct | It also flagged the stale location of the moved device without being asked. |
| 2 | Correct | It also reported the pending conflict on the name. |
| 3 | Correct | It excluded `conn-remote` and labeled that as an assumption, which is right. |
| 4 | Correct | |
| 5 | Correct | It relied partly on the "Case 1" comments. Without them it would have had to compare all devices. |

**What this shows (opinion):**

- The model works as a **structured entry point**: five of five answers were correct, with traceable IDs, in under half a minute.
- **Explicit relationships with named roles** and **bindings on the item** carried the answers.
- What is missing for agents is **navigation help**, not more structure: a reverse index ("what points to X"), a way to ask "what has no Y", and an explicit place for **known gaps** (stale data, unmerged duplicates, paths only as text). The YAML comments did this job here, but comments are not part of the model.
- Overloaded words (`vpn` as protocol value and as item type) cost the agent time. Naming in models matters for agents as much as for people.
