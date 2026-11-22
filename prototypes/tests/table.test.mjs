import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { indexBundle } from "../lib/model.js";
import { listColumns, cellText, filterRows, sortRows } from "../lib/table.js";

const home = indexBundle(JSON.parse(readFileSync(new URL("../data/smart-home.json", import.meta.url), "utf-8")));
const devices = home.byType.get("device");
const col = (cols, id) => cols.find((c) => c.id === id);

test("listColumns lists attributes in attribute_order, then one column per relationship type", () => {
  const cols = listColumns(home, "device");
  const attrs = cols.filter((c) => c.kind === "attribute").map((c) => c.attribute);
  assert.deepEqual(attrs, ["name", "battery", "manufacturer", "purchase_date", "notes"]);
  const rels = cols.filter((c) => c.kind === "relationship").map((c) => c.relType);
  assert.deepEqual(rels, ["located_at", "classified_as", "connection", "broker_link"]);
  assert.equal(col(cols, "rel:located_at").label, "located at");
});

test("relationship cell shows direction and the other players", () => {
  const cols = listColumns(home, "device");
  const climate = home.byId.get("dev-cottage-climate");
  assert.equal(cellText(home, climate, col(cols, "rel:connection")), "→ Home Assistant 2 (ble)");
  assert.equal(cellText(home, climate, col(cols, "rel:classified_as")), "→ Climate sensor");
  const ha2 = home.byId.get("ha-2");
  const instanceCols = listColumns(home, "ha_instance");
  assert.match(cellText(home, ha2, col(instanceCols, "rel:connection")), /^← Cottage Climate \(ble\)/);
});

test("empty cells are empty strings", () => {
  const cols = listColumns(home, "device");
  assert.equal(cellText(home, home.byId.get("dev-unknown"), col(cols, "rel:classified_as")), "");
  assert.equal(cellText(home, home.byId.get("dev-unknown"), col(cols, "attr:battery")), "");
});

test("search matches any visible column, case-insensitive", () => {
  const cols = listColumns(home, "device");
  const hits = filterRows(home, devices, cols, { search: "BLE", filters: {} });
  assert.deepEqual(hits.map((i) => i.id).sort(), ["dev-cottage-climate", "dev-cottage-probe", "dev-garage-climate"]);
});

test("column filters combine with AND", () => {
  const cols = listColumns(home, "device");
  const hits = filterRows(home, devices, cols, { search: "", filters: { "rel:classified_as": "climate", "rel:located_at": "main" } });
  assert.deepEqual(hits.map((i) => i.id).sort(), ["dev-bath-climate", "dev-garage-climate", "dev-lr-climate", "dev-outdoor-climate"]);
});

test("search ignores hidden columns", () => {
  const cols = listColumns(home, "device").filter((c) => c.id !== "rel:connection");
  assert.deepEqual(filterRows(home, devices, cols, { search: "ble", filters: {} }), []);
});

test("sortRows sorts by column, empty values last in both directions", () => {
  const cols = listColumns(home, "device");
  const battery = col(cols, "attr:battery");
  const asc = sortRows(home, devices, battery, "asc").map((i) => cellText(home, i, battery));
  assert.deepEqual(asc.slice(0, 4), ["empty", "low", "ok", ""]);
  const desc = sortRows(home, devices, battery, "desc").map((i) => cellText(home, i, battery));
  assert.deepEqual(desc.slice(0, 4), ["ok", "low", "empty", ""]);
});

test("sortRows does not change the input array", () => {
  const before = devices.map((i) => i.id);
  sortRows(home, devices, col(listColumns(home, "device"), "attr:name"), "desc");
  assert.deepEqual(devices.map((i) => i.id), before);
});
