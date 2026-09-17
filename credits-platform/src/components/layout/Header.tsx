import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";

const HEADER_HEIGHT = 68;
const AUTH_USER_KEY = "credits-platform-auth-user";

interface AuthUser {
  name: string;
  email: string;
}

interface HeaderProps {
  sidebarCollapsed: boolean;
  onLogout: () => void;
}

export default function Header({ sidebarCollapsed, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between border-b px-6 shadow-[0_10px_30px_rgba(2,6,23,0.25)]"
      style={{
        left: sidebarCollapsed ? "64px" : "240px",
        height: `${HEADER_HEIGHT}px`,
        transition: "left 0.3s ease",
        background: "rgba(9, 18, 33, 0.92)",
        borderColor: "rgba(148, 163, 184, 0.18)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src="/partner-logos.png"
          alt="CDL São Paulo / SPC Brasil"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full transition-colors text-slate-300 hover:text-white hover:bg-white/5">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full"></span>
        </button>

        <div ref={menuRef} className="relative pl-3 border-l border-slate-700/80">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 transition-colors group hover:bg-white/5"
          >
            <div className="w-9 h-9 rounded-full bg-[#243871] flex items-center justify-center text-white text-sm font-semibold ring-1 ring-white/10">
              <User size={17} />
            </div>

            <div className="flex flex-col leading-tight text-left">
              <span className="text-sm font-semibold text-slate-100">{user?.name || "Usuário"}</span>
              <span className="text-xs text-slate-400">{user?.email || "usuario@credits.com"}</span>
            </div>
            <ChevronDown
              size={14}
              className="text-slate-400 group-hover:text-slate-200 transition-colors ml-1"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-2 transition-colors"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
