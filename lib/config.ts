export function getAdminPath(path = "") {
  const base = "/admin";
  return path ? `${base}/${path}` : base;
}
