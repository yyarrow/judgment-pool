import { Link, Outlet } from "react-router-dom";
import { User } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-gray-200">
      <header className="border-b border-gray-800 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-medium tracking-tight hover:text-white transition-colors">
            Judgment Pool
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-amber-500 font-semibold text-lg">86</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Credits</span>
            </div>
            <Link to="/me" className="text-gray-400 hover:text-white transition-colors">
              <User size={18} />
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}