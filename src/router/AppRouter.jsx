import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { AboutPage } from "../pages/AboutPage";
import { DocumentationPage } from "../pages/DocumentationPage";
import { ModulesPage } from "../pages/ModulesPage";
import { PublicModuleDetailsPage } from "../pages/PublicModuleDetailsPage";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DashboardHome } from "../pages/dashboard/DashboardHome";
import { ModuleListingPage } from "../pages/dashboard/ModuleListingPage";
import { ModuleDetailsPage } from "../pages/dashboard/ModuleDetailsPage";
import { TeamsPage } from "../pages/dashboard/TeamsPage";
import { PlaceholderPage } from "../pages/dashboard/PlaceholderPage";
import { AnalyticsPage } from "../pages/dashboard/AnalyticsPage";
import { PipelinesPage } from "../pages/dashboard/PipelinesPage";
import { SecurityPage } from "../pages/dashboard/SecurityPage";
import { PublishModulePage } from "../pages/dashboard/PublishModulePage";
import { ModuleReviewPage } from "../pages/dashboard/ModuleReviewPage";
import { UserProfilePage } from "../pages/dashboard/UserProfilePage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { SettingsPage } from "../pages/dashboard/SettingsPage";
import { useAuth } from "../hooks/useAuth";

// --- NEW RATAN IMPORTS ---
import { ComponentsPage } from "../pages/ComponentsPage";
import { ComponentDetailPage } from "../pages/ComponentDetailPage";
import { PublishComponentPage } from "../pages/dashboard/PublishComponentPage";

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Public Navigation routes */}
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/modules/:id" element={<PublicModuleDetailsPage />} />
        
        {/* --- RATAN'S NEW MARKETPLACE ROUTES --- */}
        <Route path="/components" element={<ComponentsPage />} />
        <Route path="/components/:id" element={<ComponentDetailPage />} />
        
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="overview" element={<DashboardHome />} />
          <Route path="modules" element={<ModuleListingPage />} />
          <Route path="modules/:id" element={<ModuleDetailsPage />} />
          
          {/* --- RATAN'S NEW PUBLISH ROUTE --- */}
          <Route path="publish-component" element={<PublishComponentPage />} />
          
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="pipelines" element={<PipelinesPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="publish" element={<PublishModulePage />} />
          <Route path="reviews" element={<ModuleReviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}