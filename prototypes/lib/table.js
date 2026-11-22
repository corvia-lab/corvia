// List view logic: columns per type, cell text, search, filter and sort. Generic.
import { title, relationsOf, otherPlayers } from "./model.js";

const typePresentation = (index, typeName) => index.bundle.presentation?.types?.[typeName] ?? {};

export function listColumns(index, typeName) {
  const types = index.bundle.model.types;
  const spec = types[typeName];
  const order = typePresentation(index, typeName).attribute_order ?? [];
  const names = [...order, ...Object.keys(spec.attributes ?? {}).filter((n) => !order.includes(n))];
  const columns = names.map((attribute) => ({
    id: `attr:${attribute}`, kind: "attribute", attribute, label: attribute, spec: spec.attributes[attribute],
  }));
  for (const [relType, relSpec] of Object.entries(types)) {
    if (relSpec.kind !== "relationship") continue;
    if (!Object.values(relSpec.roles).some((r) => r.types.includes(typeName))) continue;
    columns.push({ id: `rel:${relType}`, kind: "relationship", relType, label: typePresentation(index, relType).label ?? relType });
  }
  return columns;
}

const playerTitle = (index, p) => (p.missing ? `missing: ${p.missing}` : title(index, p));

function relationshipText(index, item, relType) {
  const roles = Object.keys(index.bundle.model.types[relType].roles);
  const labelAttr = typePresentation(index, relType).edge_label_attribute;
  const parts = [];
  for (const { relationship, role } of relationsOf(index, item.id)) {
    if (relationship.type !== relType) continue;
    const label = labelAttr ? relationship.attributes?.[labelAttr]?.value : null;
    const suffix = label ? ` (${label})` : "";
    if (roles.length === 2) {
      const other = roles.find((r) => r !== role);
      const arrow = role === roles[0] ? "→" : "←";
      parts.push(`${arrow} ${otherPlayers(index, relationship, other).map((p) => playerTitle(index, p)).join(", ")}${suffix}`);
    } else {
      const others = roles.filter((r) => r !== role)
        .map((r) => `${r}: ${otherPlayers(index, relationship, r).map((p) => playerTitle(index, p)).join(", ")}`);
      parts.push(`as ${role}; ${others.join("; ")}${suffix}`);
    }
  }
  return parts.join(", ");
}

export function cellText(index, item, column) {
  if (column.kind === "relationship") return relationshipText(index, item, column.relType);
  const value = item.attributes?.[column.attribute]?.value;
  return value === null || value === undefined ? "" : String(value);
}

export function filterRows(index, items, columns, { search = "", filters = {} } = {}) {
  const needle = search.trim().toLowerCase();
  const active = Object.entries(filters).filter(([, v]) => v && v.trim());
  return items.filter((item) => {
    for (const [colId, value] of active) {
      const column = columns.find((c) => c.id === colId);
      if (column && !cellText(index, item, column).toLowerCase().includes(value.trim().toLowerCase())) return false;
    }
    if (!needle) return true;
    return [title(index, item), ...columns.map((c) => cellText(index, item, c))].some((t) => t.toLowerCase().includes(needle));
  });
}

export function sortRows(index, items, column, direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  const numeric = column.kind === "attribute" && column.spec?.type === "number";
  return [...items].sort((a, b) => {
    const x = cellText(index, a, column);
    const y = cellText(index, b, column);
    if (x === "" || y === "") return (x === "") - (y === ""); // empty last in both directions
    const cmp = numeric ? Number(x) - Number(y) : x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" });
    return cmp * factor;
  });
}
