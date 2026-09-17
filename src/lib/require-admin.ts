import { redirect } from "next/navigation";
import { auth } from "./auth";

// Úsalo al inicio de cualquier página o server action del panel admin.
// Si no hay sesión, redirige al login en vez de dejar pasar la petición.
export async function requireAdminSession() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
