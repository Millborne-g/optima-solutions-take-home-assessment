export type NavItem = {
  href: string;
  label: string;
  match: "exact" | "prefix";
};

export const MAIN_NAV: NavItem[] = [
  { href: "/contacts", label: "Contacts", match: "prefix" },
  { href: "/syncs", label: "Order syncs", match: "exact" },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function titleForPath(pathname: string): string {
  if (pathname.startsWith("/syncs")) return "Order syncs";
  if (pathname.includes("/edit")) return "Edit contact";
  if (pathname.startsWith("/contacts")) return "Contacts";
  return "HubSpot Order Sync";
}
