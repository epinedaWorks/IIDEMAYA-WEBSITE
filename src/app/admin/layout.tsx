import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-brand-light/30">
      {session && (
        <header className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-brand-dark">
                Panel IIDEMAYA
              </Link>
              <nav className="flex gap-1 text-sm text-foreground/70">
                <Link href="/admin" className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand-light hover:text-brand active:scale-95 active:bg-brand-light/70">
                  Postulaciones
                </Link>
                <Link href="/admin/anuncios" className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand-light hover:text-brand active:scale-95 active:bg-brand-light/70">
                  Anuncios
                </Link>
                <Link href="/admin/ajustes" className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand-light hover:text-brand active:scale-95 active:bg-brand-light/70">
                  Ajustes
                </Link>
                <Link href="/admin/cuenta" className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand-light hover:text-brand active:scale-95 active:bg-brand-light/70">
                  Mi cuenta
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-foreground/60">{session.user?.email}</span>
              <SignOutButton />
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
