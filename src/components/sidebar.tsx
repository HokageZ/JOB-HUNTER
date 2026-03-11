"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  KanbanSquare,
  FileText,
  MessageCircle,
  Settings,
  Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/setup", label: "Profile", icon: UserCircle },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/tracker", label: "Tracker", icon: KanbanSquare },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`
              flex items-center gap-3 px-3 py-2 text-lg
              border-2 transition-all duration-100
              ${
                isActive
                  ? "bg-[#fff9c4] border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] -rotate-1"
                  : "border-transparent hover:border-[#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-white"
              }
            `}
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 border-b-[3px] border-[#2d2d2d] bg-[#fdfbf7]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="border-2 border-[#2d2d2d]"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <Menu size={22} strokeWidth={2.5} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-[#fdfbf7] p-4"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            <SheetTitle className="text-2xl font-bold text-[#2d2d2d] -rotate-2 mb-6 px-2">
              Job Hunter
            </SheetTitle>
            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold text-[#2d2d2d] -rotate-1">
          Job Hunter
        </h1>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 border-r-[3px] border-[#2d2d2d] bg-[#fdfbf7] p-4 gap-2"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        <div className="mb-6 px-2">
          <h1 className="text-2xl font-bold text-[#2d2d2d] -rotate-2">
            Job Hunter
          </h1>
          <p
            className="text-sm text-[#6b6560] mt-1"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            AI-powered assistant
          </p>
        </div>

        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}
