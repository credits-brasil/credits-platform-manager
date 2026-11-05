import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HEADER_HEIGHT = 68;

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        headerHeight={HEADER_HEIGHT}
      />
      <Header sidebarCollapsed={collapsed} onLogout={onLogout} />
      <main
        className="px-6 py-6 lg:px-10"
        style={{
          marginLeft: collapsed ? "64px" : "240px",
          marginTop: `${HEADER_HEIGHT}px`,
          transition: "margin-left 0.3s ease",
        }}
      >
        <div className="mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

