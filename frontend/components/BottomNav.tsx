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

export default function BottomNav() {
  const pathname = usePathname();
  const { dark, toggleDark } = useTheme();

  // Lesson and Legendary screens are full-focus; hide the nav there.
  if (pathname.startsWith("/lesson") || pathname.startsWith("/legendary")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 border-t-2 border-gray-100 dark:border-gray-700 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between px-2 py-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-0.5 py-1 rounded-xl transition-colors
                ${active ? "text-[#58CC02]" : "text-gray-400 dark:text-gray-500"}`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wide">
                {tab.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="flex flex-1 flex-col items-center gap-0.5 px-0.5 py-1 text-gray-400 dark:text-gray-500"
        >
          <span className="text-xl">{dark ? "🌙" : "☀️"}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-wide">
            Theme
          </span>
        </button>
      </div>
    </div>
  );
}
