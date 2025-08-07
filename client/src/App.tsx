import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { isAuthenticated } from "@/lib/auth";

function Router() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      if (authStatus !== authenticated) {
        setAuthenticated(authStatus);
      }
      setLoading(false);
    };

    // Check initially
    checkAuth();

    // Listen for storage changes (when login/logout happens)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Custom event for same-tab logout
    const handleLogout = () => {
      setAuthenticated(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionClear', handleLogout);
    
    // Also check periodically in case sessionStorage changed in same tab
    const interval = setInterval(checkAuth, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionClear', handleLogout);
      clearInterval(interval);
    };
  }, [authenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-700">Loading WISSEN ChatBot...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
