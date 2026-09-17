import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-brand-light/30">
      {session && (
        <header className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/admin" className="font-bold text-brand-dark">
              Panel IIDEMAYA
            </Link>
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
