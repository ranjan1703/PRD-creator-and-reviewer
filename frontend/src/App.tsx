import { useState } from 'react';
import Creator from './pages/Creator';
import Reviewer from './pages/Reviewer';
import ResearchPlanner from './pages/ResearchPlanner';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

type Tab = 'create' | 'review' | 'research' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const { isAuthenticated, loading, logout } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // User is authenticated, show main app
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">📝</div>
              <h1 className="text-xl font-bold text-gray-900">PRD Creator & Reviewer</h1>
            </div>

            <nav className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'review'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Review
              </button>
              <button
                onClick={() => setActiveTab('research')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'research'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🔬 Research
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keep all components mounted, just hide the inactive ones */}
        <div style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
          <Creator />
        </div>
        <div style={{ display: activeTab === 'review' ? 'block' : 'none' }}>
          <Reviewer />
        </div>
        <div style={{ display: activeTab === 'research' ? 'block' : 'none' }}>
          <ResearchPlanner />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <Settings />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          By Ranjan Singh
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
