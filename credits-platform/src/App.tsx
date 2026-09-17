import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import CompaniesPage from "@/pages/Companies";
import UsersPage from "@/pages/Users";
import AdminsPage from "@/pages/Admins";
import NotFound from "@/pages/not-found";
import { loginRequest } from "@/lib/auth";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "credits-platform-authenticated";
const AUTH_TOKEN_KEY = "credits-platform-access-token";
const AUTH_USER_KEY = "credits-platform-auth-user";
const HOME_ROUTE = "/home";

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
  onLogin: (username: string, password: string) => Promise<string | null>;
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
        <Route path="/configuracoes/empresas" component={CompaniesPage} />
        <Route path="/configuracoes/users" component={UsersPage} />
        <Route path="/configuracoes/admins" component={AdminsPage} />
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

  const handleLogin = async (username: string, password: string) => {
    try {
      const session = await loginRequest(username.trim(), password.trim());

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.admin));
      setIsAuthenticated(true);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Não foi possível autenticar.";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
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
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
