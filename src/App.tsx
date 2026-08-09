import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import OverviewPage from "@/routes/index";
import RoutesPage from "@/routes/routes";
import KeysPage from "@/routes/keys";
import RateLimitsPage from "@/routes/rate-limits";
import CircuitsPage from "@/routes/circuits";
import LogsPage from "@/routes/logs";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background text-foreground">
        <AppSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/keys" element={<KeysPage />} />
            <Route path="/rate-limits" element={<RateLimitsPage />} />
            <Route path="/circuits" element={<CircuitsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
