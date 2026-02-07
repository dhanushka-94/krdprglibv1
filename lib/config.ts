export const ADMIN_PATH =
  process.env.NEXT_PUBLIC_ADMIN_PATH ?? "k7x9p2";

export function getAdminPath(path = "") {
  const base = `/${ADMIN_PATH}`;
  return path ? `${base}/${path}` : base;
}
