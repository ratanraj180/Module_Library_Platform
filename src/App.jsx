import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { ModulesPage } from "./pages/dashboard/ModulesPage";
import { ModuleDetailPage } from "./pages/dashboard/ModuleDetailPage";
import { ReviewsPage } from "./pages/dashboard/ReviewsPage";
import { ProfilePage } from "./pages/dashboard/ProfilePage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import { PublishModulePage } from "./pages/dashboard/PublishModulePage";
import { AnalyticsPage } from "./pages/dashboard/AnalyticsPage";

// Documentation Pages
import { ApiReferencePage } from "./pages/docs/ApiReferencePage";
import { PublishingGuidePage } from "./pages/docs/PublishingGuidePage";
import { WorkflowManualPage } from "./pages/docs/WorkflowManualPage";
import { DeveloperGuidePage } from "./pages/docs/DeveloperGuidePage";

// Marketplace Pages
import { ComponentsPage } from "./pages/ComponentsPage";
import { ComponentDetailPage } from "./pages/ComponentDetailPage";
import { ComponentReviewsPage } from "./pages/dashboard/ComponentReviewsPage";
import { DashboardComponentsPage } from "./pages/dashboard/DashboardComponentsPage";
import { PublishComponentPage } from "./pages/dashboard/PublishComponentPage";
import { ModuleAIAssistantPage } from "./pages/dashboard/ModuleAIAssistantPage";
import { FeaturesPage } from "./pages/FeaturesPage";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}

          <Route path="/"       element={<LandingPage />} />
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Marketplace Routes */}
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/components/:id" element={<ComponentDetailPage />} />
          <Route path="/module-ai" element={<ModuleAIAssistantPage />} />
          <Route path="/features" element={<FeaturesPage />} />

          {/* Dedicated Documentation Routes */}
          <Route path="/docs/api-reference" element={<ApiReferencePage />} />
          <Route path="/docs/publishing-guide" element={<PublishingGuidePage />} />
          <Route path="/docs/workflow-manual" element={<WorkflowManualPage />} />
          <Route path="/docs/developer-guide" element={<DeveloperGuidePage />} />

          {/* Protected dashboard routes — DashboardLayout handles auth guard */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['developer', 'admin']}><DashboardLayout /></ProtectedRoute>}>
            {/* /dashboard → /dashboard/overview */}
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardHome />} />
            <Route path="modules"  element={<ModulesPage />} />
            <Route path="modules/:id" element={<ModuleDetailPage />} />
            <Route path="reviews"  element={<ReviewsPage />} />
            <Route path="components" element={<DashboardComponentsPage />} />
            <Route path="publish-component" element={<PublishComponentPage />} />
            <Route path="component-reviews" element={<ComponentReviewsPage />} />
            <Route path="module-ai" element={<ModuleAIAssistantPage />} />
            <Route path="profile"  element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="publish"  element={<PublishModulePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            {/* Catch-all inside dashboard */}
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>

          {/* Global catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

