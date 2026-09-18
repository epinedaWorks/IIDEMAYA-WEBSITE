"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const [saliendo, setSaliendo] = useState(false);

  return (
    <button
      onClick={() => {
        setSaliendo(true);
        signOut({ callbackUrl: "/admin/login" });
      }}
      disabled={saliendo}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 active:bg-red-100 disabled:opacity-60"
    >
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
