import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { MessageSquare, FolderOpen, Grid3x3, Database, Settings, Menu, X, FileText } from 'lucide-react';
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';
import DashboardPage from './pages/DashboardPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';
import FormsPage from './pages/FormsPage';
import FormBuilderPage from './pages/FormBuilderPage';
import PublicFormPage from './pages/PublicFormPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Grid3x3 },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Forms', href: '/forms', icon: FileText },
    { name: 'Files', href: '/files', icon: FolderOpen },
    { name: 'Data', href: '/data', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white rounded-md shadow-md"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <h1 className="text-xl font-bold text-gray-900">WorkflowHub</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
              <Route path="/form/:slug" element={<PublicFormPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;