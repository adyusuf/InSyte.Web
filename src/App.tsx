import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SchoolsPage from "./pages/SchoolsPage";
import SchoolDetailPage from "./pages/SchoolDetailPage";
import TeachersPage from "./pages/TeachersPage";
import VideosPage from "./pages/VideosPage";
import VideoUploadPage from "./pages/VideoUploadPage";
import VideoDetailPage from "./pages/VideoDetailPage";
import ReportsPage from "./pages/ReportsPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import AISettingsPage from "./pages/AISettingsPage";
import CriteriaPage from "./pages/CriteriaPage";
import QuestionsPage from "./pages/QuestionsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Yukleniyor...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Yukleniyor...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/schools" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="schools/:id" element={<SchoolDetailPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="videos/upload" element={<VideoUploadPage />} />
        <Route path="videos/:id" element={<VideoDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="team"
          element={
            <ProtectedRoute requiredRole="Admin">
              <TeamPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="Admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/ai"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AISettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/criteria"
          element={
            <ProtectedRoute requiredRole="Admin">
              <CriteriaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/questions"
          element={
            <ProtectedRoute requiredRole="Admin">
              <QuestionsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
