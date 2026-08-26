/**
 * Infer TypeScript interfaces from a sample of JSON.
 *
 * It reads the shape of one example, so it is a strong first draft, not a
 * schema: a field that is null in the sample but a string in real data will come
 * out wrong, and an empty array cannot say what it holds. Those cases become
 * `null` and `unknown[]` rather than a confident guess, and the tool's copy says
 * so. Arrays of objects are merged so a key missing from some elements is marked
 * optional and a key with mixed types becomes a union.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pascal(input: string): string {
  const parts = input.replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return /^[A-Za-z]/.test(name) ? name : `Type${name}`;
}

function singular(name: string): string {
  if (/ies$/i.test(name)) return name.slice(0, -3) + "y";
  if (/(ses|xes|zes|ches|shes)$/i.test(name)) return name.slice(0, -2);
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1);
  return name;
}

function safeKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function jsonToTypes(root: unknown, rootName = "Root"): string {
  const interfaces: string[] = [];
  const used = new Set<string>();

  const uniqueName = (hint: string): string => {
    const base = pascal(hint) || "Object";
    let name = base;
    let i = 2;
    while (used.has(name)) name = `${base}${i++}`;
    used.add(name);
    return name;
  };

  const typeOf = (value: unknown, hint: string): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return arrayType(value, hint);
    switch (typeof value) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "object":
        return objectType(value as Record<string, unknown>, hint);
      default:
        return "unknown";
    }
  };

  const objectType = (obj: Record<string, unknown>, hint: string): string => {
    const name = uniqueName(hint);
    const lines = Object.entries(obj).map(([k, v]) => `  ${safeKey(k)}: ${typeOf(v, k)};`);
    interfaces.push(`interface ${name} {\n${lines.join("\n") || ""}\n}`);
    return name;
  };

  const elementHint = (hint: string): string => {
    const s = singular(hint);
    return s === hint ? `${hint}Item` : s;
  };

  const mergedObjects = (arr: Array<Record<string, unknown>>, hint: string): string => {
    const name = uniqueName(elementHint(hint));
    const types = new Map<string, Set<string>>();
    const present = new Map<string, number>();
    for (const obj of arr) {
      for (const [k, v] of Object.entries(obj)) {
        if (!types.has(k)) types.set(k, new Set());
        types.get(k)!.add(typeOf(v, k));
        present.set(k, (present.get(k) ?? 0) + 1);
      }
    }
    const lines = [...types].map(([k, set]) => {
      const optional = (present.get(k) ?? 0) < arr.length ? "?" : "";
      const union = [...set].sort().join(" | ");
      return `  ${safeKey(k)}${optional}: ${union};`;
    });
    interfaces.push(`interface ${name} {\n${lines.join("\n") || ""}\n}`);
    return name;
  };

  const arrayType = (arr: unknown[], hint: string): string => {
    if (arr.length === 0) return "unknown[]";
    if (arr.every(isPlainObject)) return `${mergedObjects(arr as Array<Record<string, unknown>>, hint)}[]`;
    const parts = [...new Set(arr.map((el) => typeOf(el, elementHint(hint))))].sort();
    const union = parts.length === 1 ? parts[0] : `(${parts.join(" | ")})`;
    return `${union}[]`;
  };

  const rootType = typeOf(root, rootName);
  const decls = interfaces.join("\n\n");
  if (rootType === rootName || decls === "") {
    return decls || `type ${rootName} = ${rootType};`;
  }
  return `${decls}\n\ntype ${rootName} = ${rootType};`;
}
