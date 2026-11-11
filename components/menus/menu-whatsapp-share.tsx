"use client";

import { useState } from "react";
import { shareMenuViaWhatsApp } from "@/app/menus/actions";
import { WhatsappShareDialog } from "@/components/whatsapp/whatsapp-share-dialog";
import { MenuThemePicker } from "@/components/menus/menu-theme-picker";

type MenuWhatsappShareProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

export function MenuWhatsappShare({ menuId, menuName, variant = "icon", className = "", buttonClassName }: MenuWhatsappShareProps) {
  const [theme, setTheme] = useState("standard");
  return (
    <WhatsappShareDialog
      directOnly
      title="Send menu PDF"
      description="Choose a PDF design and enter the recipient’s phone number."
      variant={variant}
      buttonLabel="Share via WhatsApp"
      className={className}
      buttonClassName={buttonClassName}
      ariaLabel={`Share ${menuName} via WhatsApp`}
      content={<MenuThemePicker value={theme} onChange={setTheme} />}
      buildMessage={() => `Here is the menu for ${menuName}.`}
      onServerSend={(phone, text) => shareMenuViaWhatsApp(menuId, phone, text, theme)}
    />
  );
}
