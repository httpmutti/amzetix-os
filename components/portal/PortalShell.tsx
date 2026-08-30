"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PortalSidebar } from "./PortalSidebar";
import { cn } from "@/lib/utils";

const OpenSidebarCtx = createContext<() => void>(() => {});
export const useOpenPortalSidebar = () => useContext(OpenSidebarCtx);

interface Props {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  companyName: string;
}

export function PortalShell({ children, userName, userEmail, userImage, companyName }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <OpenSidebarCtx.Provider value={() => setSidebarOpen(true)}>
      <div className="flex h-dvh overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-[var(--surface-overlay)] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <PortalSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          companyName={companyName}
        />
        <main className={cn("min-w-0 flex-1 bg-[var(--surface-page)] overflow-y-auto")}>
          {children}
        </main>
      </div>
    </OpenSidebarCtx.Provider>
  );
}
