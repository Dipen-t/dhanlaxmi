"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { getCatalogCategories, type CategoryWithDishes, type MenuDetail } from "@/app/menus/actions";
import { getKitchenCatalog, type KitchenCategoryWithDishes, type KitchenMenuDetail } from "@/app/kitchen-menus/actions";

const MenuDialog = dynamic(() => import("@/components/menus/menu-dialog").then(module => module.MenuDialog), { ssr: false });
const KitchenMenuDialog = dynamic(() => import("@/components/kitchen-menus/kitchen-menu-dialog").then(module => module.KitchenMenuDialog), { ssr: false });

export function MenuDetailEditor(props: { kind: "client"; menu: MenuDetail } | { kind: "kitchen"; menu: KitchenMenuDetail }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [clientCatalog, setClientCatalog] = useState<CategoryWithDishes[]>([]);
  const [kitchenCatalog, setKitchenCatalog] = useState<KitchenCategoryWithDishes[]>([]);
  async function edit() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      if (props.kind === "client") setClientCatalog(await getCatalogCategories());
      else setKitchenCatalog(await getKitchenCatalog());
      setOpen(true);
    } catch { toast.error("Could not open the menu editor. Check your connection and try again."); }
    finally { loadingRef.current = false; setLoading(false); }
  }
  const dishes = props.menu.categories.flatMap(category => category.dishes);
  return <>
    <button type="button" disabled={loading} onClick={edit} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><Pencil className="size-4" aria-hidden />{loading ? "Opening editor..." : "Edit menu"}</button>
    {open && (props.kind === "client" ? <MenuDialog open menu={{ id: props.menu.id, name: props.menu.name, categoryCount: props.menu.categories.length, dishCount: dishes.length, categoryIds: props.menu.categories.map(category => category.id), dishIds: dishes.map(dish => dish.id) }} catalog={clientCatalog} onClose={() => setOpen(false)} /> : <KitchenMenuDialog open menu={{ ...props.menu, dishCount: dishes.length, dishes: props.menu.categories.flatMap(category => category.dishes).map((dish, sortOrder) => ({ id: dish.id, quantity: dish.quantity, sortOrder })) }} catalog={kitchenCatalog} onClose={() => setOpen(false)} />)}
  </>;
}
