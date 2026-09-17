"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-sm font-medium text-foreground/60 hover:text-brand"
    >
      Cerrar sesión
    </button>
  );
}
