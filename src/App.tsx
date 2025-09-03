import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { FormsPage } from '@/pages/Forms';
import { FilesPage } from '@/pages/Files';
import { DatabasePage } from '@/pages/Database';
import { ChatPage } from '@/pages/Chat';
import { ActionsPage } from '@/pages/Actions';
import { SettingsPage } from '@/pages/Settings';
import AgentsPage from '@/pages/Agents';
import { PublicFormPage } from '@/pages/PublicForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Public form route - no authentication required */}
          <Route path="/forms/:id" element={<PublicFormPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/database" element={<DatabasePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;