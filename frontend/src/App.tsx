import { useState } from 'react';
import Creator from './pages/Creator';
import Reviewer from './pages/Reviewer';

type Tab = 'create' | 'review';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('create');

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

            <nav className="flex space-x-1">
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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keep both components mounted, just hide the inactive one */}
        <div style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
          <Creator />
        </div>
        <div style={{ display: activeTab === 'review' ? 'block' : 'none' }}>
          <Reviewer />
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

export default App;
