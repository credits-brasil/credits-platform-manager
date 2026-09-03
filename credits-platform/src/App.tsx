import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import SpcMaxiPage from "@/pages/SpcMaxi";
import SpcMaxiResultadoPage from "@/pages/SpcMaxiResultado";
import SpcPositivoIntermediarioPJPage from "@/pages/SpcPositivoIntermediarioPJ";
import SpcPositivoIntermediarioPJResultadoPage from "@/pages/SpcPositivoIntermediarioPJResultado";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "credits-platform-authenticated";
const HOME_ROUTE = "/verticais/credito-risco/spc-maxi";

function HomeRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(HOME_ROUTE);
  }, [setLocation]);

  return null;
}

function ProtectedLoginRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(HOME_ROUTE);
  }, [setLocation]);

  return null;
}

function LoginRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}

function Router({
  isAuthenticated,
  onLogin,
  onLogout,
}: {
  isAuthenticated: boolean;
  onLogin: (username: string, password: string) => boolean;
  onLogout: () => void;
}) {
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/">
          <LoginPage onLogin={onLogin} />
        </Route>
        <Route component={LoginRedirect} />
      </Switch>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Switch>
        <Route path="/login" component={ProtectedLoginRedirect} />
        <Route path="/" component={HomeRedirect} />
        <Route path="/home" component={HomePage} />
        <Route path="/verticais/credito-risco/spc-maxi" component={SpcMaxiPage} />
        <Route path="/verticais/credito-risco/spc-maxi/resultado" component={SpcMaxiResultadoPage} />
        <Route path="/verticais/credito-risco/spc-positivo-intermediario-pj" component={SpcPositivoIntermediarioPJPage} />
        <Route path="/verticais/credito-risco/spc-positivo-intermediario-pj/resultado" component={SpcPositivoIntermediarioPJResultadoPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
  });

  const handleLogin = (username: string, password: string) => {
    const hasValidCredentials =
      username.trim().toLowerCase() === "admin" && password === "123456";

    if (!hasValidCredentials) {
      return false;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </WouterRouter>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
