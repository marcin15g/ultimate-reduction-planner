import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ThemeToggle } from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "Fit Kuchnia",
  description: "Planer posiłków i przygotowanie zakupów",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})();`
        }} />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <nav className="bg-white border-b border-gray-200 no-print dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
            <Link href="/" className="font-semibold text-green-700 text-lg tracking-tight dark:text-green-400">
              Fit Kuchnia
            </Link>
            <div className="flex items-center gap-1 ml-2">
              <NavLink href="/recipes">Przepisy</NavLink>
              <NavLink href="/planner">Planer</NavLink>
              <NavLink href="/people">Osoby</NavLink>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
    >
      {children}
    </Link>
  );
}
