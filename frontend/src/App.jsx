import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { ThreatRadarPage } from './pages/ThreatRadarPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataMode, setDataMode] = useState('DEMO');
  const [currentInvestigation, setCurrentInvestigation] = useState(null);

  const handleGlobalSearch = (query) => {
    setActiveTab('investigation');
    setCurrentInvestigation({
      id: `INV-${Date.now().toString().slice(-6)}`,
      target: query,
      chain: query.startsWith('0x') ? 'ETH' : 'BTC',
      depth: 5,
      dataMode
    });
  };

  const handleLaunchDemo = (demoCase) => {
    setActiveTab('investigation');
    setCurrentInvestigation({
      id: demoCase.id,
      target: demoCase.target,
      chain: demoCase.chain,
      depth: demoCase.depth,
      dataMode: 'DEMO',
      title: demoCase.title
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#3B2A22]">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataMode={dataMode}
        setDataMode={setDataMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          dataMode={dataMode}
          onSearch={handleGlobalSearch}
          currentInvestigation={currentInvestigation}
        />

        {/* Page Content Viewport */}
        <main className="ml-64 p-6 flex-1 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage
              dataMode={dataMode}
              onSelectTarget={handleGlobalSearch}
              onLaunchDemo={handleLaunchDemo}
            />
          )}

          {activeTab === 'investigation' && (
            <InvestigationPage
              dataMode={dataMode}
              activeInvestigation={currentInvestigation}
              onStartTrace={(traceParams) => {
                setCurrentInvestigation({
                  id: `INV-${Date.now().toString().slice(-6)}`,
                  ...traceParams
                });
              }}
            />
          )}

          {activeTab === 'threats' && <ThreatRadarPage />}

          {activeTab === 'audit' && <AuditLogPage />}

          {activeTab === 'reports' && <ReportsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
