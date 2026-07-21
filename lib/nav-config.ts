import {
  CalendarDays,
  Package,
  Truck,
  UtensilsCrossed,
  ChefHat,
  Banknote,
  Receipt,
  BarChart3,
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
    title: "Client Menus",
    description: "Client menus with dish categories",
    icon: UtensilsCrossed,
  },
  {
    href: "/kitchen-menus",
    title: "Kitchen Menus",
    description: "Kitchen printouts with selected dishes",
    icon: ChefHat,
  },
  {
    href: "/reports",
    title: "Reports",
    description: "View financial and operational reports",
    icon: BarChart3,
  },
];
