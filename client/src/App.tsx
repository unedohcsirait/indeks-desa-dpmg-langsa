import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import VillageList from "@/pages/villages/index";
import AssessmentList from "@/pages/assessments/index";
import AssessmentDetail from "@/pages/assessments/detail";
import ProfilePage from "@/pages/profile";
import IndicatorManagement from "@/pages/indicators/index";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/villages">
        {() => (
          <ProtectedRoute>
            <VillageList />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/assessments">
        {() => (
          <ProtectedRoute>
            <AssessmentList />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/assessments/:id">
        {() => (
          <ProtectedRoute>
            <AssessmentDetail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/indicators">
        {() => (
          <ProtectedRoute>
            <IndicatorManagement />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
