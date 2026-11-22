// Throwaway stage 1 prototype. Everything specific to a model comes from the bundle:
// no type names may appear in this file (checked in tasks.md, step 8.2).
import { indexBundle, title, relationsOf, otherPlayers, isEdgeType, drillDown, buildTree } from "./lib/model.js";
import { createState, editAttribute, receiveSourceChange, markDeleted, listPending, applySync } from "./lib/deltas.js";

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? "" : v);
  }
  for (const child of children.flat(Infinity)) {
    if (child !== null && child !== undefined && child !== false) node.append(child instanceof Node ? child : String(child));
  }
  return node;
};

const app = { bundles: {}, bundle: null, state: null, index: null, viewId: null, selected: null, lastCalls: [] };

const typeInfo = (type) => app.bundle.presentation?.types?.[type] ?? {};
const typeLabel = (type) => typeInfo(type).label ?? type;
const icon = (type) => typeInfo(type).icon ?? "•";
const refresh = () => { app.index = indexBundle({ ...app.bundle, items: app.state.items }); };

function itemLabel(item) {
  if (item.missing) return el("span", { class: "missing" }, `⚠ missing item ${item.missing}`);
  const deleted = item.sync_status === "deleted" ? el("span", { class: "badge deleted" }, "deleted, not synchronized") : null;
  return el("span", {}, `${icon(item.type)} ${title(app.index, item)} `, el("span", { class: "muted" }, typeLabel(item.type)), deleted);
}

function nodeLink(item) {
  if (item.missing) return itemLabel(item);
  return el("span", { class: `node${app.selected === item.id ? " selected" : ""}`, onclick: () => select(item.id) }, itemLabel(item));
}

// ---- views -----------------------------------------------------------------

function renderTreeNodes(nodes) {
  return el("ul", { class: "tree" }, nodes.map((n) => {
    const li = el("li", {}, nodeLink(n.item));
    if (n.groups) {
      for (const g of n.groups) li.append(el("div", { class: "group" }, `${g.label} (${g.nodes.length})`), renderTreeNodes(g.nodes));
    } else if (n.children.length) {
      li.append(renderTreeNodes(n.children));
    }
    return li;
  }));
}

function renderView() {
  const view = app.bundle.presentation.views.find((v) => v.id === app.viewId);
  const target = $("view");
  target.replaceChildren(el("h3", {}, view.label));
  if (view.kind === "tree") {
    target.append(renderTreeNodes(buildTree(app.index, view)));
  } else {
    const items = [...(app.index.byType.get(view.type) ?? [])].sort((a, b) => title(app.index, a).localeCompare(title(app.index, b)));
    target.append(el("p", { class: "muted" }, `${items.length} items`), el("ul", { class: "tree" }, items.map((i) => el("li", {}, nodeLink(i)))));
  }
}

// ---- detail ------------------------------------------------------------------

function valueInput(spec, value) {
  if (spec?.type === "enum") {
    return el("select", {}, el("option", { value: "" }, "–"), spec.values.map((v) => el("option", { value: v, selected: v === value }, v)));
  }
  if (spec?.type === "boolean") return el("select", {}, ["true", "false"].map((v) => el("option", { value: v, selected: String(value) === v }, v)));
  return el("input", { type: spec?.type === "number" ? "number" : spec?.type === "date" ? "date" : "text", value: value ?? "" });
}

const readInput = (spec, input) => {
  if (input.value === "") return null;
  if (spec?.type === "number") return Number(input.value);
  if (spec?.type === "boolean") return input.value === "true";
  return input.value;
};

function attributeRows(item) {
  const specs = app.bundle.model.types[item.type]?.attributes ?? {};
  const order = typeInfo(item.type).attribute_order ?? [];
  const names = [...order, ...Object.keys(specs).filter((n) => !order.includes(n))];
  return names.map((name) => {
    const a = item.attributes?.[name] ?? { value: null };
    const spec = specs[name];
    const badges = [];
    if (a.binding) badges.push(el("span", { class: "badge bound" }, `🔗 ${a.binding.connector}`));
    for (const [direction, delta] of Object.entries(a.pending ?? {})) {
      const arrow = direction === "to_source" ? "corvia → source" : "source → corvia";
      badges.push(el("span", { class: `badge ${delta.status}` }, `${arrow}: ${delta.value} (${delta.status})`));
    }
    const edit = valueInput(spec, a.value);
    const actions = el("div", { class: "row-actions" }, edit,
      el("button", { onclick: () => { editAttribute(app.state, item.id, name, readInput(spec, edit)); rerender(); } }, a.binding ? "Change (pending)" : "Change"));
    if (a.binding) {
      const incoming = valueInput(spec, a.value);
      actions.append(incoming, el("button", { onclick: () => { receiveSourceChange(app.state, item.id, name, readInput(spec, incoming)); rerender(); } }, "Simulate source change"));
    }
    return el("tr", {}, el("th", {}, name), el("td", {}, a.value === null || a.value === undefined ? el("span", { class: "muted" }, "–") : String(a.value), badges, actions));
  });
}

function relationshipLine(rel, ownRole) {
  const roles = Object.keys(app.bundle.model.types[rel.type].roles);
  const open = el("button", { onclick: () => select(rel.id) }, "open");
  if (isEdgeType(app.index, rel.type)) {
    const [first, second] = roles;
    const labelAttr = typeInfo(rel.type).edge_label_attribute;
    const label = labelAttr ? rel.attributes?.[labelAttr]?.value : null;
    const from = otherPlayers(app.index, rel, first)[0];
    const to = otherPlayers(app.index, rel, second)[0];
    return el("li", {}, nodeLink(from), ` → ${typeLabel(rel.type)}${label ? ` · ${label}` : ""} → `, nodeLink(to), " ", open);
  }
  return el("li", {}, `${icon(rel.type)} ${typeLabel(rel.type)} (as ${ownRole}) `, open,
    el("ul", {}, roles.map((r) => el("li", {}, `${r}: `, otherPlayers(app.index, rel, r).map((p) => [nodeLink(p), " "])))));
}

function renderDetail() {
  const target = $("detail");
  const item = app.index.byId.get(app.selected);
  if (!item) { target.replaceChildren(el("p", { class: "muted" }, "Select an item.")); return; }
  const spec = app.bundle.model.types[item.type];
  const binding = item.binding ? el("span", { class: "badge bound" }, `🔗 ${item.binding.connector} · ${item.binding.id ?? "no id"}`) : el("span", { class: "badge" }, "only in corvia");
  target.replaceChildren(
    el("h3", {}, itemLabel(item), binding),
    el("table", {}, attributeRows(item)),
  );
  if (spec.kind === "relationship") {
    target.append(el("h4", {}, "Roles"), el("ul", {}, Object.keys(spec.roles).map((r) => el("li", {}, `${r}: `, otherPlayers(app.index, item, r).map((p) => [nodeLink(p), " "])))));
    if (typeInfo(item.type).drill_down) {
      const { elements, note } = drillDown(app.index, item.id);
      const path = elements.length ? elements.map((e, i) => [i ? " → " : "", nodeLink(e)]) : el("span", { class: "muted" }, "No technical path modeled.");
      target.append(el("h4", {}, "Technical path"), el("div", { class: "path" }, path, note ? el("p", {}, `Note: ${note}`) : null));
    }
  }
  const rels = relationsOf(app.index, item.id);
  target.append(el("h4", {}, `Relationships (${rels.length})`), el("ul", {}, rels.map((r) => relationshipLine(r.relationship, r.role))));
  if (item.sync_status !== "deleted") {
    target.append(el("p", {}, el("button", { onclick: () => { markDeleted(app.state, item.id); rerender(); } }, item.binding ? "Delete (pending)" : "Delete")));
  }
}

// ---- pending changes -----------------------------------------------------------

function renderPending() {
  const target = $("pending");
  const entries = listPending(app.state);
  const controls = new Map();
  const direction = { to_source: "corvia → source", from_source: "source → corvia", delete: "delete in source" };
  const rows = entries.map((e) => {
    const item = app.index.byId.get(e.itemId);
    const decision = el("select", {}, ["accept", "discard"].map((d) => el("option", { value: d, selected: d === e.proposed }, d)));
    const fail = e.direction === "from_source" ? null : el("input", { type: "checkbox" });
    controls.set(e.key, { decision, fail });
    return el("tr", {},
      el("td", {}, item ? nodeLink(item) : e.itemId),
      el("td", {}, e.attribute ?? "–"),
      el("td", {}, direction[e.direction]),
      el("td", {}, e.direction === "delete" ? "–" : `${e.current ?? "–"} → ${e.pending ?? "–"}`),
      el("td", {}, el("span", { class: `badge ${e.status}` }, e.status), e.message ? ` ${e.message}` : ""),
      el("td", {}, `${e.connector ?? "?"} · ${e.externalId ?? "?"}`),
      el("td", {}, decision),
      el("td", {}, fail ? el("label", {}, fail, " fail") : "–"),
    );
  });
  const run = el("button", { disabled: entries.length === 0, onclick: () => {
    const decisions = new Map([...controls].map(([k, c]) => [k, c.decision.value]));
    const results = new Map([...controls].filter(([, c]) => c.fail?.checked).map(([k]) => [k, { ok: false, message: "simulated failure" }]));
    app.lastCalls = applySync(app.state, decisions, results);
    rerender();
  } }, "Run check");
  target.replaceChildren(el("h3", {}, `Pending changes (${entries.length})`));
  if (entries.length) {
    target.append(el("table", {}, el("tr", {}, ["Item", "Attribute", "Direction", "Change", "Status", "Connector · ID", "Decision", "Simulate"].map((h) => el("th", {}, h))), rows));
  } else {
    target.append(el("p", { class: "muted" }, "No pending changes."));
  }
  target.append(el("p", {}, run));
  if (app.lastCalls.length) {
    const lines = app.lastCalls.map((c) => `→ ${c.connector}: ${c.operation} ${c.externalId}${c.attribute ? `.${c.attribute} = ${JSON.stringify(c.value)}` : ""}`);
    target.append(el("h4", {}, "Simulated calls to connectors (last check)"), el("div", { class: "calls" }, lines.join("\n")));
  }
}

// ---- wiring ------------------------------------------------------------------

function rerender() { refresh(); renderView(); renderDetail(); renderPending(); }
function select(id) { app.selected = id; renderView(); renderDetail(); }

async function loadModel(id) {
  app.bundles[id] ??= await (await fetch(`data/${id}.json`)).json();
  app.bundle = app.bundles[id];
  app.state = createState(app.bundle);
  app.selected = null;
  app.lastCalls = [];
  const views = app.bundle.presentation.views ?? [];
  app.viewId = views[0]?.id;
  $("view-select").replaceChildren(...views.map((v) => el("option", { value: v.id }, v.label)));
  rerender();
}

async function start() {
  const models = await (await fetch("data/index.json")).json();
  $("model-select").replaceChildren(...models.map((m) => el("option", { value: m.id }, m.label)));
  $("model-select").addEventListener("change", (e) => loadModel(e.target.value));
  $("view-select").addEventListener("change", (e) => { app.viewId = e.target.value; renderView(); });
  $("reset").addEventListener("click", () => loadModel($("model-select").value));
  await loadModel(models[0].id);
}

start();
