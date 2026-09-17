import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Building2,
  ChevronLeft,
  ChevronDown,
  FileSearch,
  ChevronRight as ChevronRightSm,
  FileText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  ScrollText,
} from "lucide-react";

const SIDEBAR_BG = "#0f1d32";
const SIDEBAR_BORDER = "#1d3557";
const SIDEBAR_HOVER = "#172d4b";
const SIDEBAR_SUB_HOVER = "#13263f";
const ACTIVE_ORANGE = "#EE8D4C";

interface SubItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: SubItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Sparkles,
    subItems: [
      {
        label: "Empresas",
        path: "/configuracoes/empresas",
        icon: Building2,
      },
      {
        label: "Usuários",
        path: "/configuracoes/users",
        icon: Users,
      },
      {
        label: "Administradores",
        path: "/configuracoes/admins",
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    icon: FileSearch,
    subItems: [
      {
        label: "Consultas",
        path: "/operacoes/list",
        icon: FileSearch,
      },
      {
        label: "Logs",
        path: "/operacoes/list",
        icon: ScrollText,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  headerHeight?: number;
}

export default function Sidebar({
  collapsed,
  onToggle,
  headerHeight = 68,
}: SidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const allItems = menuItems;

  useEffect(() => {
    const parentWithActiveChild = allItems.find((item) =>
      item.subItems?.some((sub) => sub.path === location),
    );
    if (parentWithActiveChild) {
      setExpandedItems({ [parentWithActiveChild.id]: true });
    }
  }, [location]);

  const toggleExpand = (id: string) => {
    if (collapsed) return;
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isDirectlyActive = (item: MenuItem): boolean => {
    return !!item.path && location === item.path;
  };

  const hasActiveChild = (item: MenuItem): boolean => {
    return !!item.subItems?.some((sub) => sub.path === location);
  };

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.id];
    const active = isDirectlyActive(item);
    const childActive = hasActiveChild(item);

    return (
      <div key={item.id} className="mb-0.5">
        {item.path && !hasSubItems ? (
          <a
            href={item.path}
            title={collapsed ? item.label : undefined}
            className="w-full flex items-center rounded-md"
            style={{
              height: "40px",
              padding: collapsed ? "0 0 0 14px" : "0 10px",
              color: "rgba(255,255,255,0.85)",
              backgroundColor: active ? ACTIVE_ORANGE : "transparent",
              fontWeight: active ? 600 : 400,
              textDecoration: "none",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  SIDEBAR_HOVER;
                (e.currentTarget as HTMLAnchorElement).style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.85)";
              }
            }}
          >
            <Icon
              size={17}
              className="flex-shrink-0"
              style={{ minWidth: "17px" }}
            />
            {!collapsed && (
              <span className="ml-3 text-sm whitespace-nowrap flex-1 overflow-hidden text-ellipsis">
                {item.label}
              </span>
            )}
          </a>
        ) : (
          <button
            onClick={() => (hasSubItems ? toggleExpand(item.id) : undefined)}
            title={collapsed ? item.label : undefined}
            className="w-full flex items-center text-left relative rounded-md"
            style={{
              height: "40px",
              padding: collapsed ? "0 0 0 14px" : "0 10px",
              color: "rgba(255,255,255,0.85)",
              backgroundColor: active ? ACTIVE_ORANGE : "transparent",
              fontWeight: active || childActive ? 600 : 400,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  SIDEBAR_HOVER;
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.85)";
              }
            }}
          >
            <Icon
              size={17}
              className="flex-shrink-0"
              style={{ minWidth: "17px" }}
            />
            {!collapsed && (
              <>
                <span className="ml-3 text-sm whitespace-nowrap flex-1 overflow-hidden text-ellipsis">
                  {item.label}
                </span>
                {hasSubItems && (
                  <span className="ml-auto flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRightSm size={14} />
                    )}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        {hasSubItems && !collapsed && isExpanded && (
          <div
            className="px-1 pb-1"
            style={{
              backgroundColor: SIDEBAR_BG,
              borderRadius: "0 0 6px 6px",
              marginTop: "1px",
            }}
          >
            {item.subItems!.map((sub) => {
              const subActive = location === sub.path;
              const SubIcon = sub.icon;

              return (
                <a
                  key={sub.path}
                  href={sub.path}
                  className="flex items-center rounded-md mx-1"
                  style={{
                    height: "36px",
                    padding: "4px 10px 4px 32px",
                    color: subActive ? "white" : "rgba(255,255,255,0.65)",
                    fontSize: "13px",
                    fontWeight: subActive ? 600 : 400,
                    textDecoration: "none",
                    backgroundColor: subActive ? ACTIVE_ORANGE : "transparent",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!subActive) {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor = SIDEBAR_SUB_HOVER;
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(255,255,255,0.95)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!subActive) {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(255,255,255,0.65)";
                    }
                  }}
                >
                  <SubIcon
                    size={13}
                    className="flex-shrink-0 mr-2"
                    style={{ opacity: subActive ? 1 : 0.7 }}
                  />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {sub.label}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="fixed top-0 left-0 z-40 flex flex-col"
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        backgroundColor: SIDEBAR_BG,
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo area + toggle */}
      <div
        className="flex items-center border-b overflow-hidden"
        style={{
          height: `${headerHeight}px`,
          borderColor: SIDEBAR_BORDER,
          padding: collapsed ? "0 12px" : "0 12px 0 20px",
          transition: "padding 0.3s ease",
          flexShrink: 0,
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Expandir menu"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="/credits-icon.png"
              alt="Credits"
              style={{
                height: "36px",
                width: "36px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </button>
        ) : (
          <>
            <img
              src="/credits-logo.png"
              alt="Credits"
              style={{
                height: "22px",
                width: "auto",
                filter: "brightness(0) invert(1)",
                objectFit: "contain",
              }}
            />
            <button
              onClick={onToggle}
              title="Recolher menu"
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: "28px",
                height: "28px",
                color: "rgba(255,255,255,0.6)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  SIDEBAR_HOVER;
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.6)";
              }}
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {menuItems.map((item) => renderItem(item))}
      </nav>
    </aside>
  );
}
