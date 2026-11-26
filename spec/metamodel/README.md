# corvia meta-model (Iteration 1)

> **Status:** Draft, Iteration 1 exploration. Defined in the OpenSpec change [meta-model exploration design](https://github.com/corvia-lab/corvia/blob/c445a5fa9c89ff2a2179209fdbec637d63327a36/openspec/changes/stage-1-metamodel-exploration/design.md).

A model folder holds three YAML files. The JSON Schemas in this folder check their structure (level 1). `tools/validate.py` also checks that items conform to the types of their model (level 2).

| File | Schema | Content |
|---|---|---|
| `model.yaml` | [`model.schema.json`](model.schema.json) | The concrete model: connectors and types |
| `items.yaml` | [`items.schema.json`](items.schema.json) | The items of that model |
| `presentation.yaml` | [`presentation.schema.json`](presentation.schema.json) | How types are displayed, and the views |

## Item

Everything in a model is an **item**: it has an `id` that is unique in the model, a `type`, and attributes. Relationships are items too (design **D1**).

## Type

A type has a user-chosen name and a `kind`:

- `item`: a thing, such as a device or an application.
- `relationship`: a connection between items. It has **roles**.

## Attribute

Attributes are typed: `string`, `text` (formatted free text), `number`, `boolean`, `date` (ISO `YYYY-MM-DD`) or `enum` (with `values`). An attribute can be `required`.

In `items.yaml`, an attribute is either a plain value (shorthand) or an object with `value`, an optional `binding` and optional `pending` deltas.

## Relationship and role

A relationship type names its roles, for example `source` and `target`. Each role says:

- `types`: which item types may play it. **Relationship types are allowed here.** This is how a relationship points to another relationship, e.g. "connection *realized by* path" (D1, D2).
- `count`: how many items play the role in one relationship (`"1"` or `"1..n"`). A relationship with more than two roles, or with a `"1..n"` role, is n-ary.
- `per_item`: how many relationships of this type one item may have in this role (`"0..1"`, `"0..n"`, `"1"`, `"1..n"`).
- `ordered`: whether the order of the players matters, e.g. the steps of a technical path.

`unique: true` on a relationship type means that no two relationships of that type have the same players in the same roles.

## Binding

An item or a single attribute can be **bound** to a source: `binding: { connector, id }`. A binding on the item says that the item comes from that source (and is needed to synchronize a delete). A binding on an attribute says that this attribute is read from and written to the source; its `id` may be left out when it is the item's external ID. Attributes without their own binding are unbound, even on a bound item. The meta-model knows nothing else about the source. Reading and writing it is the connector's job (D4). Unbound items and attributes exist only in corvia. The connectors a model may use are listed in `model.yaml`.

## Pending changes (deltas)

An attribute with its own binding can carry at most one delta per direction (D5):

- `pending.to_source`: a change made in corvia that is waiting to be written to the source.
- `pending.from_source`: a change reported by the source that is waiting to be taken over.

A delta has a `value` and a `status`: `open`, `superseded_by_source` or `failed` (with a `message`). After a successful check the delta disappears. Items that are deleted but not yet synchronized carry `sync_status: deleted`; `new` is reserved for items created in corvia.

## Presentation

Presentation settings are not part of the meta-model (D3). Per type they set a `label`, an `icon`, a `title_attribute`, the `attribute_order`, whether a relationship type is shown as an edge (`as_edge`, only for relationships with exactly two roles of count 1) and a `drill_down` to the technical path. `views` define trees (levels along relationships, optionally grouped; a level with `repeat: true` applies again to its own children, for nesting of any depth) and lists.
