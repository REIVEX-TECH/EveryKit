/**
 * Splitting a class into groups, two ways: a number of groups, or groups of a
 * size. The balance option spreads a remainder so no group is left tiny.
 */

/** Split `names` into `groupCount` groups. Balanced deals round-robin for even sizes. */
export function intoGroups(names: string[], groupCount: number, balanced: boolean): string[][] {
  const count = Math.max(1, Math.min(groupCount, names.length || 1));
  const groups: string[][] = Array.from({ length: count }, () => []);
  if (balanced) {
    names.forEach((name, i) => groups[i % count].push(name));
  } else {
    const size = Math.ceil(names.length / count);
    names.forEach((name, i) => groups[Math.floor(i / size)].push(name));
  }
  return groups.filter((g) => g.length > 0);
}

/**
 * Split `names` into groups of about `size`. Unbalanced makes groups of exactly
 * `size` with the remainder in a final, smaller group; balanced spreads the
 * remainder so sizes differ by at most one.
 */
export function intoGroupsOfSize(names: string[], size: number, balanced: boolean): string[][] {
  const s = Math.max(1, size);
  if (balanced) {
    const count = Math.max(1, Math.round(names.length / s));
    return intoGroups(names, count, true);
  }
  const groups: string[][] = [];
  for (let i = 0; i < names.length; i += s) groups.push(names.slice(i, i + s));
  return groups.length > 0 ? groups : [[]];
}
