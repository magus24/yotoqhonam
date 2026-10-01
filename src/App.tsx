import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AppBoundary } from './components/ui/AppBoundary';
import { Toaster } from './components/ui/Toast';
import { initAuth, useAuthStore } from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const FloorPage = lazy(() => import('./pages/FloorPage'));
const RoomPage = lazy(() => import('./pages/RoomPage'));
const DutyPage = lazy(() => import('./pages/DutyPage'));
const DutyReportPage = lazy(() => import('./pages/DutyReportPage'));
const Admin = lazy(() => import('./pages/Admin'));

/**
 * HashRouter, deliberately.
 *
 * GitHub Pages serves static files with no SPA rewrite. History-based routes
 * would 404 on any refresh of /floor or /room/205. `/#/floor` survives a hard
 * reload because the server only ever sees `/`.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const location = useLocation();

  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  if (!ready) return <BootScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function BootScreen() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex items-center gap-3 text-sm text-text-mist">
        <span className="size-2 animate-ping rounded-full bg-brass-400" />
        Yotoqhonam
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-graphite-950/[0.06]" />
      <div className="h-64 animate-pulse rounded-3xl bg-graphite-950/[0.05]" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    initAuth();
  }, []);

  return (
    <AppBoundary>
      <HashRouter>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/floor" element={<FloorPage />} />
              <Route path="/room/:id" element={<RoomPage />} />
              <Route path="/duty" element={<DutyPage />} />
              <Route path="/duty/report" element={<DutyReportPage />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </HashRouter>
    </AppBoundary>
  );
}
