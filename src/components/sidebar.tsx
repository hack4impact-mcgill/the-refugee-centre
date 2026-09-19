"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BsPersonFill } from "react-icons/bs";
import { FaCalendarAlt, FaHistory } from "react-icons/fa";

const navItems = [
  { href: "/shifts", label: "Shift Management", Icon: FaCalendarAlt },
  { href: "/volunteers", label: "Volunteers", Icon: BsPersonFill },
  { href: "/history", label: "History", Icon: FaHistory },
];

const itemClassName =
  "flex w-full items-center gap-3 rounded px-2 py-0.5 text-body2 text-navy-900 transition-colors hover:bg-sandstone-300";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col justify-between overflow-hidden border-r border-sandstone-300 bg-sandstone-200 px-2 py-4 transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-67"
      }`}
    >
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
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

      <div className="flex flex-col gap-4">
        <hr className="border-sandstone-400" />
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
      </div>
    </aside>
  );
}
