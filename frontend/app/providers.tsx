"use client";
/**
 * React Query + Toast + Theme Provider
 * Wraps the entire app with necessary context providers.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeApplicator() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.className = theme;
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplicator />
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1E1E2A",
            color: "#F0F0F8",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
          success: {
            iconTheme: { primary: "#22C55E", secondary: "#1E1E2A" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#1E1E2A" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
