import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HEADER_HEIGHT = 68;

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const isSearchPage =
    location === "/verticais/credito-risco/spc-maxi" ||
    location === "/verticais/credito-risco/spc-positivo-intermediario-pj";
  const isResultPage =
    location === "/verticais/credito-risco/spc-maxi/resultado" ||
    location === "/verticais/credito-risco/spc-positivo-intermediario-pj/resultado";

  useEffect(() => {
    if (isResultPage) {
      setCollapsed(true);
    }
  }, [isResultPage]);

  useEffect(() => {
    if (!isSearchPage) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isSearchPage]);

  return (
    <div className="h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        headerHeight={HEADER_HEIGHT}
      />
      <Header sidebarCollapsed={collapsed} onLogout={onLogout} />
      <main
        className={isSearchPage ? "overflow-hidden px-6 py-6 lg:px-10" : "px-6 py-6 lg:px-10"}
        style={
          isSearchPage
            ? {
                marginLeft: collapsed ? "64px" : "240px",
                marginTop: `${HEADER_HEIGHT}px`,
                transition: "margin-left 0.3s ease",
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
                overflow: "hidden",
              }
            : {
                marginLeft: collapsed ? "64px" : "240px",
                marginTop: `${HEADER_HEIGHT}px`,
                transition: "margin-left 0.3s ease",
              }
        }
      >
        <div className={isSearchPage ? "mx-auto h-full w-full overflow-hidden" : "mx-auto w-full"}>
          {children}
        </div>
      </main>
    </div>
  );
}
