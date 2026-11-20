"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BsPersonFill } from "react-icons/bs";
import {
  FaCalendarAlt,
  FaHistory,
  FaSignOutAlt,
  FaUserCircle,
  FaUserShield,
} from "react-icons/fa";
import { signOut } from "@/lib/supabase/auth";

const navItems = [
  { href: "/shifts", label: "Calendar", Icon: FaCalendarAlt },
  { href: "/volunteers", label: "Volunteers", Icon: BsPersonFill },
  { href: "/history", label: "History", Icon: FaHistory },
  { href: "/admins", label: "Invite admin", Icon: FaUserShield },
];

const itemClassName =
  "flex w-full items-center gap-3 rounded px-2 py-1 text-body2 text-navy-900 transition-colors hover:bg-sandstone-300";

export default function Sidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert("Unable to sign out right now. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col justify-between overflow-hidden border-r border-sandstone-300 bg-sandstone-200 px-4 pt-10 pb-4 transition-[width] duration-200 ${
        collapsed ? "w-17" : "w-67"
      }`}
    >
      <div className="flex flex-col gap-10">
        <Link href="/" aria-label="The Refugee Centre home" className="w-fit">
          <Image
            src="/trc-emblem.svg"
            alt=""
            width={37}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-col gap-4">
            {navItems.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`${itemClassName} ${active ? "bg-sandstone-300" : ""}`}
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span
                      className={`whitespace-nowrap ${collapsed ? "sr-only" : ""}`}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <hr className="border-sandstone-400" />
        {email && (
          <p
            title={email}
            className="flex w-full items-center gap-3 px-2 py-1 text-body2 text-navy-700"
          >
            <FaUserCircle aria-hidden className="size-5 shrink-0" />
            <span className={`truncate ${collapsed ? "sr-only" : ""}`}>
              {email}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand" : undefined}
          className={`${itemClassName} cursor-pointer`}
        >
          <span aria-hidden className="relative size-5 shrink-0">
            <span className="absolute inset-0.5 rounded-xs border-[1.5px] border-navy-900" />
            <span className="absolute inset-y-0.5 left-0.5 w-1.25 rounded-l-xs bg-navy-900" />
          </span>
          <span className={`whitespace-nowrap ${collapsed ? "sr-only" : ""}`}>
            {collapsed ? "Expand" : "Collapse"}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title={collapsed ? "Sign out" : undefined}
          className={`${itemClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <FaSignOutAlt aria-hidden className="size-5 shrink-0" />
          <span className={`whitespace-nowrap ${collapsed ? "sr-only" : ""}`}>
            {isSigningOut ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
