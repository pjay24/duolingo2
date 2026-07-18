"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const TABS = [
  { href: "/", label: "Learn", emoji: "🏠" },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
  { href: "/profile", label: "Profile", emoji: "👤" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export default function SideNav() {
  const pathname = usePathname();
  const { dark, toggleDark } = useTheme();

  // Lesson screens are full-focus; hide the nav there (same rule as BottomNav).
  if (pathname.startsWith("/lesson") || pathname.startsWith("/legendary")) return null;

  return (
    <div
      className="hidden lg:flex fixed left-0 top-0 bottom-0 z-20 w-64 flex-col
        bg-white dark:bg-gray-800 border-r-2 border-gray-100 dark:border-gray-700 transition-colors"
    >
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦉</span>
          <span className="font-extrabold text-xl text-[#58CC02]">Duolingo</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-4">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-sm transition-colors
                ${active
                  ? "bg-[#DDF4FF] dark:bg-blue-900/30 text-[#1899D6] dark:text-blue-300"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
            >
              <span className="text-2xl leading-none">{tab.emoji}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6">
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-extrabold uppercase tracking-wide text-sm
            text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span className="text-2xl leading-none">{dark ? "🌙" : "☀️"}</span>
          {dark ? "Dark mode" : "Light mode"}
        </button>
      </div>
    </div>
  );
}
