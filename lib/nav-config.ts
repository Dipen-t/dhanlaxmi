import {
  CalendarDays,
  Package,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type HomeTile = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const homeTiles: HomeTile[] = [
  {
    href: "/raw-materials",
    title: "Raw Materials",
    description: "Catalog and vendor assignments",
    icon: Package,
  },
  {
    href: "/vendors",
    title: "Vendors",
    description: "Suppliers and delivery locations",
    icon: Truck,
  },
  {
    href: "/orders",
    title: "Orders",
    description: "Events, venues, and headcount",
    icon: CalendarDays,
  },
  {
    href: "/menus",
    title: "Menus",
    description: "Client menus with dish categories",
    icon: UtensilsCrossed,
  },
];
