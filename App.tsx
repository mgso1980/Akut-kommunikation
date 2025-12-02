
import React, { useState, useCallback } from 'react';
import { SCENARIO } from './constants';
import Header from './components/Header';
import Scenario from './components/Scenario';
import IsbarSimulator from './components/IsbarSimulator';
import ClosedLoopSimulator from './components/ClosedLoopSimulator';
import Quiz from './components/Quiz';
import { StethoscopeIcon, MessageCircleIcon, FileTextIcon, AlertTriangleIcon } from './components/icons';

type Mode = 'isbar' | 'closedLoop' | 'quiz';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('isbar');

  const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ease-in-out flex items-center space-x-2 ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                        <StethoscopeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Kommunikationstræner</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Øv dine kommunikationsevner gennem interaktive cases og spil.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 p-1 bg-slate-200/70 dark:bg-slate-900/50 rounded-lg self-start sm:self-center">
                    <TabButton active={mode === 'isbar'} onClick={() => setMode('isbar')}>
                      <StethoscopeIcon className="h-4 w-4" /> <span>ISBAR</span>
                    </TabButton>
                    <TabButton active={mode === 'closedLoop'} onClick={() => setMode('closedLoop')}>
                      <AlertTriangleIcon className="h-4 w-4" /> <span>Sikkerhedsspil (Closed Loop)</span>
                    </TabButton>
                    <TabButton active={mode === 'quiz'} onClick={() => setMode('quiz')}>
                      <FileTextIcon className="h-4 w-4" /> <span>Videnstest</span>
                    </TabButton>
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-700">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8">
              <Scenario title={SCENARIO.title} description={SCENARIO.description} mode={mode} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8">
              {mode === 'isbar' && (
                <IsbarSimulator scenario={SCENARIO.description} />
              )}
              {mode === 'closedLoop' && (
                <ClosedLoopSimulator scenario={SCENARIO.description} />
              )}
              {mode === 'quiz' && (
                <Quiz />
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 dark:text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Klinisk Kommunikationstræner.</p>
      </footer>
    </div>
  );
};

export default App;
