/** Return only to the expected local list, never to an arbitrary supplied URL. */
export function listReturnTo(value: string | null, listPath: string) {
  if (!value || value.length > 4096) return listPath;
  try {
    const url = new URL(value, "https://app.invalid");
    return url.origin === "https://app.invalid" && url.pathname === listPath
      ? `${listPath}${url.search}`
      : listPath;
  } catch {
    return listPath;
  }
}

export function parentDestination(pathname: string) {
  const section = pathname.split("/").filter(Boolean);
  const root = section[0];
  const names: Record<string, string> = {
    orders: "orders", vendors: "vendors", menus: "client menus", "kitchen-menus": "kitchen menus",
  };
  if (section.length > 1 && names[root]) return { href: `/${root}`, label: `Back to ${names[root]}` };
  return { href: "/", label: "Back to home" };
}

export function calendarDate(value: string | null, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1900) return fallback;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : fallback;
}

export function orderListState(params: Pick<URLSearchParams, "get">, today: string) {
  const date = calendarDate(params.get("date"), today);
  const rawMonth = params.get("month");
  const month = rawMonth && calendarDate(`${rawMonth}-01`, "") ? rawMonth : date.slice(0, 7);
  const rawView = params.get("view");
  const view: "calendar" | "list" | "grid" = rawView === "list" || rawView === "grid" ? rawView : "calendar";
  return { date, month, view, query: params.get("q") || "" };
}
