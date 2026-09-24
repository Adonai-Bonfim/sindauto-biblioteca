import { Bell, BookOpen, LibraryBig, House, UserRound } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Início", icon: House },
  { to: "/catalogo", label: "Catálogo", icon: BookOpen },
  { to: "/meus-livros", label: "Meus livros", icon: LibraryBig },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5" aria-label="Sindauto Bahia">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-yellow font-black italic text-brand-red">S</span>
      <span className="text-sm font-bold leading-tight text-primary-foreground">Sindauto<br />Bahia</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto grid h-20 max-w-app grid-cols-[minmax(0,1fr)_auto] items-center px-4 sm:px-6 lg:px-8">
          <Brand />
          <Button type="button" aria-label="Notificações" size="icon" variant="ghost" className="h-10 w-10 shrink-0 rounded-full bg-primary-foreground/14 text-primary-foreground hover:bg-primary-foreground/22 hover:text-primary-foreground">
            <Bell size={19} />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-app px-4 py-6 sm:px-6 md:py-8 lg:px-8">{children}</main>
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/96 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-nav backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`relative flex min-w-0 flex-col items-center gap-1 py-1 text-[11px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                <span className="truncate">{label}</span>
                {active && <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}