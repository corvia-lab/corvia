import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  indexBundle, title, relationsOf, otherPlayers, isEdgeType, drillDown, buildTree,
} from "../lib/model.js";

const load = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf-8"));
const home = indexBundle(load("smart-home"));
const enterprise = indexBundle(load("enterprise"));

const role = (types, extra = {}) => ({ types, count: "1", per_item: "0..n", ...extra });
const tiny = (items, presentation = { types: {} }) => indexBundle({
  model: {
    model: "tiny",
    types: {
      thing: { kind: "item", attributes: { name: { type: "string" } } },
      link: { kind: "relationship", attributes: { note: { type: "text" } }, roles: { a: role(["thing"]), b: role(["thing"]) } },
      via: { kind: "relationship", roles: { realized: role(["link"]), path: role(["link", "thing"], { count: "1..n", ordered: true }) } },
    },
  },
  items,
  presentation,
});

test("title uses title_attribute", () => {
  assert.equal(title(home, home.byId.get("ha-1")), "Home Assistant 1");
  const t = tiny([{ id: "x", type: "thing", attributes: { name: { value: "X" } } }]);
  assert.equal(title(t, t.byId.get("x")), "x");
});

test("relationsOf finds both directions", () => {
  const roles = relationsOf(home, "ha-1").map((r) => `${r.relationship.type}:${r.role}`);
  assert.ok(roles.includes("runs_on:guest"));
  assert.ok(roles.includes("connection:target"));
  assert.ok(roles.includes("connection:source"));
});

test("isEdgeType true for connection, false for broker_link", () => {
  assert.equal(isEdgeType(home, "connection"), true);
  assert.equal(isEdgeType(home, "broker_link"), false);
  assert.equal(isEdgeType(home, "device"), false);
});

test("drillDown returns ordered path", () => {
  const { elements, note } = drillDown(home, "conn-cottage-climate");
  assert.deepEqual(elements.map((e) => e.id), ["gw-esp32", "vpn-sites", "host-minipc"]);
  assert.equal(note, null);
});

test("drillDown returns note when no realized_by exists", () => {
  const { elements, note } = drillDown(home, "conn-remote");
  assert.deepEqual(elements, []);
  assert.match(note, /Reverse proxy/);
});

test("drillDown stops on a cycle", () => {
  const presentation = { types: { link: { drill_down: { via: "via", target_role: "realized", path_role: "path" } } } };
  const t = tiny([
    { id: "t1", type: "thing", attributes: {} },
    { id: "A", type: "link", attributes: {}, roles: { a: ["t1"], b: ["t1"] } },
    { id: "B", type: "link", attributes: {}, roles: { a: ["t1"], b: ["t1"] } },
    { id: "vA", type: "via", attributes: {}, roles: { realized: ["A"], path: ["B"] } },
    { id: "vB", type: "via", attributes: {}, roles: { realized: ["B"], path: ["A"] } },
  ], presentation);
  const ids = drillDown(t, "A").elements.map((e) => e.id);
  assert.deepEqual(ids, ["B"]);
});

test("missing player is marked, not thrown", () => {
  const t = tiny([
    { id: "t1", type: "thing", attributes: {} },
    { id: "L", type: "link", attributes: {}, roles: { a: ["t1"], b: ["ghost"] } },
  ]);
  assert.deepEqual(otherPlayers(t, t.byId.get("L"), "b"), [{ missing: "ghost" }]);
  assert.equal(otherPlayers(t, t.byId.get("L"), "a")[0].id, "t1");
});

test("buildTree groups devices by class with (none) group", () => {
  const view = home.bundle.presentation.views.find((v) => v.id === "overview");
  const roots = buildTree(home, view);
  assert.deepEqual(roots.map((r) => r.item.id), ["loc-main", "loc-cottage"]);
  const ha1 = roots[0].children.find((c) => c.item.id === "ha-1");
  const labels = ha1.groups.map((g) => g.label);
  assert.ok(labels.includes("Climate sensor"));
  assert.ok(labels.includes("(none)"));
  const none = ha1.groups.find((g) => g.label === "(none)").nodes.map((n) => n.item.id);
  assert.ok(none.includes("dev-unknown"));
  const ha2 = roots[1].children.find((c) => c.item.id === "ha-2");
  assert.ok(ha2.children.some((c) => c.item.id === "dev-garage-climate"));
});

test("buildTree works for the enterprise bundle without code changes", () => {
  const view = enterprise.bundle.presentation.views.find((v) => v.id === "chain");
  const roots = buildTree(enterprise, view);
  const order = roots.find((r) => r.item.id === "proc-order");
  const shop = order.children.find((c) => c.item.id === "app-shop");
  assert.equal(shop.children[0].item.id, "srv-web");
  assert.equal(shop.children[0].children[0].item.id, "dc-1");
});

test("buildTree stops on a cycle", () => {
  const t = tiny([
    { id: "x", type: "thing", attributes: {} },
    { id: "y", type: "thing", attributes: {} },
    { id: "xy", type: "link", attributes: {}, roles: { a: ["x"], b: ["y"] } },
    { id: "yx", type: "link", attributes: {}, roles: { a: ["y"], b: ["x"] } },
  ]);
  const level = { via: "link", from_role: "a", to_role: "b" };
  const roots = buildTree(t, { kind: "tree", root_type: "thing", levels: [level, level, level] });
  const x = roots.find((r) => r.item.id === "x");
  assert.equal(x.children[0].item.id, "y");
  assert.deepEqual(x.children[0].children, []);
});
