// Pending changes (design D5) for the Iteration 1 prototypes. State lives in memory only.

export function createState(bundle) {
  return { model: bundle.model, items: structuredClone(bundle.items) };
}

const find = (state, itemId) => state.items.find((i) => i.id === itemId);

function attribute(state, itemId, attr) {
  const item = find(state, itemId);
  if (!item) throw new Error(`unknown item ${itemId}`);
  item.attributes ??= {};
  item.attributes[attr] ??= { value: null };
  return { item, a: item.attributes[attr] };
}

export function editAttribute(state, itemId, attr, value) {
  const { a } = attribute(state, itemId, attr);
  if (!a.binding) {
    a.value = value; // unbound: corvia is leading, no sync needed
    return;
  }
  a.pending ??= {};
  // Last change wins; an open source change still wins over it (design D5).
  const superseded = a.pending.from_source?.status === "open";
  a.pending.to_source = { value, status: superseded ? "superseded_by_source" : "open" };
}

export function receiveSourceChange(state, itemId, attr, value) {
  const { a } = attribute(state, itemId, attr);
  a.pending ??= {};
  a.pending.from_source = { value, status: "open" };
  if (a.pending.to_source) a.pending.to_source.status = "superseded_by_source";
}

export function markDeleted(state, itemId) {
  const item = find(state, itemId);
  if (!item) return;
  if (item.binding) item.sync_status = "deleted";
  else state.items = state.items.filter((i) => i.id !== itemId);
}

const hasOpenSourceChange = (item) =>
  Object.values(item.attributes ?? {}).some((a) => a.pending?.from_source?.status === "open");

export function listPending(state) {
  const entries = [];
  for (const item of state.items) {
    for (const [name, a] of Object.entries(item.attributes ?? {})) {
      for (const direction of ["to_source", "from_source"]) {
        const delta = a.pending?.[direction];
        if (!delta) continue;
        entries.push({
          key: `${item.id}/${name}/${direction}`,
          itemId: item.id,
          attribute: name,
          direction,
          current: a.value,
          pending: delta.value,
          status: delta.status,
          message: delta.message,
          connector: a.binding?.connector ?? item.binding?.connector ?? null,
          externalId: a.binding?.id ?? item.binding?.id ?? null,
          proposed: direction === "to_source" && delta.status === "superseded_by_source" ? "discard" : "accept",
        });
      }
    }
    if (item.sync_status === "deleted") {
      entries.push({
        key: `${item.id}//delete`,
        itemId: item.id,
        attribute: null,
        direction: "delete",
        current: null,
        pending: null,
        status: "open",
        connector: item.binding?.connector ?? null,
        externalId: item.binding?.id ?? null,
        proposed: hasOpenSourceChange(item) ? "discard" : "accept", // the source wins
      });
    }
  }
  return entries;
}

function clearDelta(a, direction) {
  delete a.pending[direction];
  if (Object.keys(a.pending).length === 0) delete a.pending;
}

export function applySync(state, decisions, results) {
  const calls = [];
  const removed = new Set();
  for (const entry of listPending(state)) {
    const decision = decisions.get(entry.key) ?? entry.proposed;
    const item = find(state, entry.itemId);
    if (!item) continue;

    if (entry.direction === "delete") {
      if (decision === "discard") {
        delete item.sync_status;
        continue;
      }
      calls.push({ connector: entry.connector, externalId: entry.externalId, attribute: null, value: null, operation: "delete" });
      const result = results.get(entry.key) ?? { ok: true };
      if (result.ok) removed.add(item.id);
      continue;
    }

    const a = item.attributes[entry.attribute];
    if (!a.pending?.[entry.direction]) continue; // already cleared by an accepted source change
    if (decision === "discard") {
      clearDelta(a, entry.direction);
      continue;
    }
    if (entry.direction === "from_source") {
      a.value = entry.pending;
      delete a.pending;
      continue;
    }
    calls.push({ connector: entry.connector, externalId: entry.externalId, attribute: entry.attribute, value: entry.pending, operation: "update" });
    const result = results.get(entry.key) ?? { ok: true };
    if (result.ok) {
      a.value = entry.pending;
      clearDelta(a, "to_source");
    } else {
      a.pending.to_source = { value: entry.pending, status: "failed", message: result.message ?? "write-back failed" };
    }
  }
  state.items = state.items.filter((i) => !removed.has(i.id));
  return calls;
}
