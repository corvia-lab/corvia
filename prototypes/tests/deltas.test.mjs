import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createState, editAttribute, receiveSourceChange, markDeleted, listPending, applySync,
} from "../lib/deltas.js";

const bundle = () => ({
  model: {
    model: "tiny",
    connectors: ["demo"],
    types: { thing: { kind: "item", attributes: { name: { type: "string" }, note: { type: "text" } } } },
  },
  items: [
    {
      id: "t1", type: "thing", binding: { connector: "demo", id: "ext-1" },
      attributes: { name: { value: "Lamp", binding: { connector: "demo" } }, note: { value: "local" } },
    },
    { id: "t2", type: "thing", attributes: { name: { value: "Free" } } },
    { id: "t3", type: "thing", binding: { connector: "demo", id: "ext-3" }, attributes: { name: { value: "Old", binding: { connector: "demo" } } } },
  ],
  presentation: { types: {} },
});

const item = (state, id) => state.items.find((i) => i.id === id);

test("edit unbound attribute changes value without delta", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "note", "changed");
  assert.deepEqual(item(s, "t1").attributes.note, { value: "changed" });
  assert.deepEqual(listPending(s), []);
});

test("edit bound attribute twice keeps last value only", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Lamp A");
  editAttribute(s, "t1", "name", "Lamp B");
  const pending = listPending(s);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].pending, "Lamp B");
  assert.equal(pending[0].current, "Lamp");
  assert.equal(pending[0].key, "t1/name/to_source");
  assert.equal(pending[0].externalId, "ext-1");
  assert.equal(pending[0].connector, "demo");
});

test("source change supersedes corvia change", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  receiveSourceChange(s, "t1", "name", "Theirs");
  const p = item(s, "t1").attributes.name.pending;
  assert.equal(p.to_source.status, "superseded_by_source");
  assert.deepEqual(p.from_source, { value: "Theirs", status: "open" });
});

test("listPending proposes source wins", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  receiveSourceChange(s, "t1", "name", "Theirs");
  const byKey = Object.fromEntries(listPending(s).map((p) => [p.key, p.proposed]));
  assert.deepEqual(byKey, { "t1/name/to_source": "discard", "t1/name/from_source": "accept" });
});

const decide = (state) => new Map(listPending(state).map((p) => [p.key, p.proposed]));

test("accepted source change updates value and clears deltas", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  receiveSourceChange(s, "t1", "name", "Theirs");
  const calls = applySync(s, decide(s), new Map());
  assert.deepEqual(calls, []);
  assert.deepEqual(item(s, "t1").attributes.name, { value: "Theirs", binding: { connector: "demo" } });
});

test("accepted corvia change emits outbound call", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  const calls = applySync(s, decide(s), new Map([["t1/name/to_source", { ok: true }]]));
  assert.deepEqual(calls, [{ connector: "demo", externalId: "ext-1", attribute: "name", value: "Mine", operation: "update" }]);
  assert.equal(item(s, "t1").attributes.name.value, "Mine");
  assert.equal(item(s, "t1").attributes.name.pending, undefined);
});

test("failed write-back keeps delta with failed status and message", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  applySync(s, decide(s), new Map([["t1/name/to_source", { ok: false, message: "timeout" }]]));
  const name = item(s, "t1").attributes.name;
  assert.equal(name.value, "Lamp");
  assert.deepEqual(name.pending.to_source, { value: "Mine", status: "failed", message: "timeout" });
});

test("discard removes delta", () => {
  const s = createState(bundle());
  editAttribute(s, "t1", "name", "Mine");
  applySync(s, new Map([["t1/name/to_source", "discard"]]), new Map());
  assert.equal(item(s, "t1").attributes.name.pending, undefined);
  assert.equal(item(s, "t1").attributes.name.value, "Lamp");
});

test("delete of bound item waits for sync", () => {
  const s = createState(bundle());
  markDeleted(s, "t3");
  assert.equal(item(s, "t3").sync_status, "deleted");
  const [entry] = listPending(s);
  assert.equal(entry.key, "t3//delete");
  const calls = applySync(s, decide(s), new Map([["t3//delete", { ok: true }]]));
  assert.deepEqual(calls, [{ connector: "demo", externalId: "ext-3", attribute: null, value: null, operation: "delete" }]);
  assert.equal(item(s, "t3"), undefined);
});

test("delete of unbound item is immediate", () => {
  const s = createState(bundle());
  markDeleted(s, "t2");
  assert.equal(item(s, "t2"), undefined);
  assert.deepEqual(listPending(s), []);
});

test("source change on deleted item proposes discarding the delete", () => {
  const s = createState(bundle());
  markDeleted(s, "t3");
  receiveSourceChange(s, "t3", "name", "Renamed at source");
  const byKey = Object.fromEntries(listPending(s).map((p) => [p.key, p.proposed]));
  assert.equal(byKey["t3//delete"], "discard");
  assert.equal(byKey["t3/name/from_source"], "accept");
  applySync(s, decide(s), new Map());
  assert.equal(item(s, "t3").sync_status, undefined);
  assert.equal(item(s, "t3").attributes.name.value, "Renamed at source");
});

test("state does not mutate the original bundle", () => {
  const original = bundle();
  const s = createState(original);
  editAttribute(s, "t1", "name", "Mine");
  markDeleted(s, "t2");
  assert.deepEqual(original, bundle());
});

test("edit after an open source change stays superseded", () => {
  const s = createState(bundle());
  receiveSourceChange(s, "t1", "name", "Theirs");
  editAttribute(s, "t1", "name", "Mine later");
  const byKey = Object.fromEntries(listPending(s).map((p) => [p.key, p]));
  assert.equal(byKey["t1/name/to_source"].status, "superseded_by_source");
  assert.equal(byKey["t1/name/to_source"].proposed, "discard");
  const calls = applySync(s, decide(s), new Map());
  assert.deepEqual(calls, []);
  assert.equal(item(s, "t1").attributes.name.value, "Theirs");
});
