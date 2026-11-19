/** Community Pigeon .nim names are not Nimiq addresses. */
export const isNimName = (name: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.nim$/.test(name.trim().toLowerCase()) && name.trim().length <= 36;
export function normalizeNimName(name: string) {
  const normalized = name.trim().toLowerCase();
  if (!isNimName(normalized)) throw new Error("Enter a valid name such as paul.nim.");
  return normalized;
}
