# Example: business letters

> **Status:** Draft, stage 1 example model (design D9). All data is invented.

Business letters as quasipapa knows them from practice, reduced to a small invented data set. The aim is to test whether the meta-model can express the relationships of this domain. Volumes do not matter here.

## Structure

- **Business functions** are supported by **business letters**. Each letter belongs to exactly one **letter group**.
- A letter contains **documents**, a document contains **document parts**, and parts can contain parts at any depth.
- A **condition** says when a document or part appears. It is attached to the "contains" relationship itself (a relationship pointing to a relationship) and can be reused. Example: "Customer pays by direct debit" applies both to the SEPA mandate in the welcome letter and to the payment details in the SEPA mandate.
- Letter groups and letters **need data**: data items or whole data item groups, and **data structures**.
- A data structure has a **structure type**. The type defines the structure's **fields** (scalar, in order). Example: `partner` with `type` (enum: natural_person, legal_person), `name`, `first_name`, `birth_date`.
- Data items and data structures are **provided by data sources**.

## Test choices vs. expected practice

| Topic | In this example | Expected in practice |
|---|---|---|
| Condition | Its own reusable item, attached to the relationship | An attribute on the relationship |
| Fields of a structure type | Each field is an item, linked to the type in order | The definition as text on the type |

The example uses the variants that test the meta-model more strongly.

## Volumes in practice

About 500 letters, 200 business functions, 8,000 data items, 200 data structures, 200 data sources, 800,000 relationships between letters (or groups) and data items (or groups), and at most about 2,000 data items per letter. They matter for the UI later, not for this example.
