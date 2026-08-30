"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/invoices", label: "Invoices" },
] as const;

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b"
      style={{ background: "var(--surface-card)", borderColor: "var(--border-default)" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex gap-0">
        {links.map(({ href, label }) => {
          const active = href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                active
                  ? "border-[var(--color-accent)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
