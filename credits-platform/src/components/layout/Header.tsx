import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import CompanySelector from "./CompanySelector";

const HEADER_HEIGHT = 68;

interface HeaderProps {
  sidebarCollapsed: boolean;
  onLogout: () => void;
}

export default function Header({ sidebarCollapsed, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm px-6"
      style={{
        left: sidebarCollapsed ? "64px" : "240px",
        height: `${HEADER_HEIGHT}px`,
        transition: "left 0.3s ease",
      }}
    >
      <div className="flex items-center gap-4">
        <CompanySelector />
        <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
        <img
          src="/partner-logos.png"
          alt="CDL São Paulo / SPC Brasil"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        <div ref={menuRef} className="relative pl-3 border-l border-gray-200">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-[#243871] flex items-center justify-center text-white text-sm font-semibold">
              <User size={17} />
            </div>

            <div className="flex flex-col leading-tight text-left">
              <span className="text-sm font-semibold text-gray-800">Usuário</span>
              <span className="text-xs text-gray-500">usuario@credits.com</span>
            </div>
            <ChevronDown
              size={14}
              className="text-gray-400 group-hover:text-gray-600 transition-colors ml-1"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
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
