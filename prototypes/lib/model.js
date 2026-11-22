// Model navigation for the stage 1 prototypes. Generic: no type names in here.

export function indexBundle(bundle) {
  const byId = new Map();
  const byType = new Map();
  const roleIndex = new Map(); // item id -> [{ relationship, role }]
  for (const item of bundle.items) {
    byId.set(item.id, item);
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type).push(item);
  }
  for (const item of bundle.items) {
    for (const [role, players] of Object.entries(item.roles ?? {})) {
      for (const player of players) {
        if (!roleIndex.has(player)) roleIndex.set(player, []);
        roleIndex.get(player).push({ relationship: item, role });
      }
    }
  }
  return { bundle, byId, byType, roleIndex };
}

const typePresentation = (index, typeName) => index.bundle.presentation?.types?.[typeName] ?? {};

export function title(index, item, seen = new Set()) {
  const attr = typePresentation(index, item.type).title_attribute;
  const value = attr ? item.attributes?.[attr]?.value : undefined;
  if (value !== undefined && value !== null && value !== "") return String(value);
  // A relationship without a name is titled by its players: "first role → other roles".
  const spec = index.bundle.model.types[item.type];
  if (spec?.kind === "relationship" && !seen.has(item.id)) {
    const next = new Set([...seen, item.id]);
    const names = (role) => (item.roles?.[role] ?? [])
      .map((id) => index.byId.get(id)).map((p, i) => (p ? title(index, p, next) : item.roles[role][i])).join(", ");
    const [first, ...rest] = Object.keys(spec.roles);
    return `${names(first)} → ${rest.map(names).join(" · ")}`;
  }
  return item.id;
}

export function relationsOf(index, itemId) {
  return index.roleIndex.get(itemId) ?? [];
}

export function otherPlayers(index, relationship, role) {
  return (relationship.roles?.[role] ?? []).map((id) => index.byId.get(id) ?? { missing: id });
}

export function isEdgeType(index, typeName) {
  const spec = index.bundle.model.types[typeName];
  if (!spec || spec.kind !== "relationship" || !typePresentation(index, typeName).as_edge) return false;
  const roles = Object.values(spec.roles);
  return roles.length === 2 && roles.every((r) => r.count === "1");
}

function relationshipsWith(index, itemId, viaType, role) {
  return relationsOf(index, itemId).filter((r) => r.relationship.type === viaType && r.role === role);
}

export function drillDown(index, relationshipId) {
  const visited = new Set([relationshipId]);
  const start = index.byId.get(relationshipId);
  const settings = start ? typePresentation(index, start.type).drill_down : undefined;
  const noteAttr = settings?.note_attribute;
  const note = noteAttr ? start.attributes?.[noteAttr]?.value ?? null : null;

  const expand = (relId) => {
    const rel = index.byId.get(relId);
    const dd = rel ? typePresentation(index, rel.type).drill_down : undefined;
    if (!dd) return [];
    const out = [];
    for (const { relationship } of relationshipsWith(index, relId, dd.via, dd.target_role)) {
      for (const element of otherPlayers(index, relationship, dd.path_role)) {
        const key = element.id ?? element.missing;
        if (visited.has(key)) continue;
        visited.add(key);
        out.push(element);
        if (element.id) out.push(...expand(element.id));
      }
    }
    return out;
  };

  return { elements: expand(relationshipId), note };
}

function childrenVia(index, item, hop) {
  const out = [];
  for (const { relationship } of relationshipsWith(index, item.id, hop.via, hop.from_role)) {
    out.push(...otherPlayers(index, relationship, hop.to_role));
  }
  return out;
}

export function buildTree(index, view) {
  const build = (item, depth, path) => {
    const node = { item, children: [] };
    const level = view.levels[depth];
    if (!level || item.missing) return node;
    for (const child of childrenVia(index, item, level)) {
      const key = child.id ?? child.missing;
      if (path.has(key)) continue;
      // A repeating level applies again to its own children (e.g. parts inside parts).
      const next = level.repeat ? depth : depth + 1;
      node.children.push(build(child, next, new Set([...path, key])));
    }
    if (level.group_by) {
      const groups = new Map();
      for (const child of node.children) {
        const owners = child.item.missing ? [] : childrenVia(index, child.item, level.group_by);
        const labels = owners.length ? owners.map((o) => (o.missing ? `missing: ${o.missing}` : title(index, o))) : ["(none)"];
        for (const label of labels) {
          if (!groups.has(label)) groups.set(label, []);
          groups.get(label).push(child);
        }
      }
      node.groups = [...groups].map(([label, nodes]) => ({ label, nodes }));
    }
    return node;
  };
  return (index.byType.get(view.root_type) ?? []).map((root) => build(root, 0, new Set([root.id])));
}

// A binary relationship seen from one of its players: that player first,
// the arrow pointing along the relationship's direction (first role → second role).
export function edgeFrom(index, relationship, ownRole) {
  const roles = Object.keys(index.bundle.model.types[relationship.type].roles);
  const otherRole = roles.find((r) => r !== ownRole);
  const labelAttr = typePresentation(index, relationship.type).edge_label_attribute;
  return {
    self: otherPlayers(index, relationship, ownRole)[0],
    others: otherPlayers(index, relationship, otherRole),
    arrow: ownRole === roles[0] ? "→" : "←",
    label: labelAttr ? relationship.attributes?.[labelAttr]?.value ?? null : null,
  };
}
