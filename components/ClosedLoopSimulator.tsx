
import React, { useState } from 'react';
import { BotIcon, CheckCircleIcon, RefreshCwIcon, AlertTriangleIcon, StopCircleIcon, LightbulbIcon } from './icons';
import { SAFETY_GAME_LEVELS, GameLevel, ActionType } from '../constants';

interface ClosedLoopSimulatorProps {
  scenario: string;
}

type GameState = 'intro' | 'playing' | 'feedback' | 'won' | 'lost';

const ClosedLoopSimulator: React.FC<ClosedLoopSimulatorProps> = ({ scenario }) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [health, setHealth] = useState(100);
  const [lastActionCorrect, setLastActionCorrect] = useState(false);
  
  const currentLevel: GameLevel = SAFETY_GAME_LEVELS[currentLevelIndex];

  const startGame = () => {
    setGameState('playing');
    setCurrentLevelIndex(0);
    setHealth(100);
  };

  const handleAction = (action: ActionType) => {
    const isCorrect = action === currentLevel.correctAction;
    setLastActionCorrect(isCorrect);
    
    if (!isCorrect) {
      setHealth(prev => Math.max(0, prev - 25)); // Mist helbred ved fejl
    }
    
    setGameState('feedback');
  };

  const nextLevel = () => {
    if (health <= 0) {
      setGameState('lost');
      return;
    }

    if (currentLevelIndex + 1 >= SAFETY_GAME_LEVELS.length) {
      setGameState('won');
    } else {
      setCurrentLevelIndex(prev => prev + 1);
      setGameState('playing');
    }
  };

  // --- Views ---

  if (gameState === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-8">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-full">
            <AlertTriangleIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Patientsikkerheds-spillet</h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Du er patientens sidste sikkerhedsbarriere. Lægen (Dr. Jørgensen) er stresset og giver ordrer. Din opgave er at filtrere dem.
            </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-green-800 dark:text-green-300">Udfør</h3>
                <p className="text-xs text-green-700 dark:text-green-400">Kun hvis ordren er sikker og præcis.</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <LightbulbIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Afklar</h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">Hvis der mangler info (dosis, tid).</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <StopCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-bold text-red-800 dark:text-red-300">Stop</h3>
                <p className="text-xs text-red-700 dark:text-red-400">Hvis ordren er direkte forkert.</p>
            </div>
        </div>

        <button 
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105"
        >
            Start Vagten
        </button>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
            <CheckCircleIcon className="h-24 w-24 text-green-500 mb-6" />
            <h2 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">Fremragende Arbejde!</h2>
            <p className="text-green-700 dark:text-green-300 mb-8 max-w-md">
                Du holdt hovedet koldt og sikrede, at Hr. Svendsen fik den korrekte behandling uden fejl. Din Closed Loop kommunikation var skarp.
            </p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-4 mb-8">
                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${health}%` }}></div>
            </div>
            <button onClick={startGame} className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                <RefreshCwIcon className="h-5 w-5 mr-2" /> Spil Igen
            </button>
        </div>
    );
  }

  if (gameState === 'lost') {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200">
            <AlertTriangleIcon className="h-24 w-24 text-red-500 mb-6" />
            <h2 className="text-3xl font-bold text-red-800 dark:text-red-200 mb-2">Kritisk Fejl</h2>
            <p className="text-red-700 dark:text-red-300 mb-8 max-w-md">
                Der blev begået for mange fejl i kommunikationen, og patientsikkerheden var truet. Husk: Det er bedre at spørge en gang for meget end at gætte.
            </p>
            <button onClick={startGame} className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
                <RefreshCwIcon className="h-5 w-5 mr-2" /> Prøv Igen
            </button>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden relative">
      {/* Top Bar: Health & Progress */}
      <div className="bg-white dark:bg-slate-800 p-4 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-500 uppercase">Patientsikkerhed</span>
            <div className="w-32 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-600'}`} 
                    style={{ width: `${health}%` }}
                />
            </div>
        </div>
        <div className="text-sm font-bold text-slate-400">
            Niveau {currentLevelIndex + 1} / {SAFETY_GAME_LEVELS.length}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 space-y-8">
        
        {/* Doctor Bubble */}
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-l-8 border-blue-500 flex items-start space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full flex-shrink-0">
                <BotIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-1">Dr. Jørgensen siger:</h3>
                <p className="text-xl md:text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    "{currentLevel.doctorText}"
                </p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl transition-opacity duration-300 ${gameState === 'feedback' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <button 
                onClick={() => handleAction('execute')}
                className="flex flex-col items-center justify-center p-6 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 border-2 border-green-500 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg group"
            >
                <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-green-800 dark:text-green-300">Udfør & Bekræft</span>
                <span className="text-xs text-green-700 dark:text-green-400/70 mt-1">Ordren er sikker</span>
            </button>

            <button 
                onClick={() => handleAction('clarify')}
                className="flex flex-col items-center justify-center p-6 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border-2 border-yellow-500 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg group"
            >
                <LightbulbIcon className="h-8 w-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-yellow-800 dark:text-yellow-300">Spørg / Afklar</span>
                <span className="text-xs text-yellow-700 dark:text-yellow-400/70 mt-1">Mangler info</span>
            </button>

            <button 
                onClick={() => handleAction('stop')}
                className="flex flex-col items-center justify-center p-6 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border-2 border-red-500 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg group"
            >
                <StopCircleIcon className="h-8 w-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-red-800 dark:text-red-300">Stop & Korriger</span>
                <span className="text-xs text-red-700 dark:text-red-400/70 mt-1">Farlig ordre</span>
            </button>
        </div>
      </div>

      {/* Feedback Overlay */}
      {gameState === 'feedback' && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-t-8 ${lastActionCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className={`p-6 ${lastActionCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="flex items-center space-x-3 mb-2">
                        {lastActionCorrect ? (
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        ) : (
                            <AlertTriangleIcon className="h-8 w-8 text-red-600" />
                        )}
                        <h3 className={`text-2xl font-bold ${lastActionCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            {lastActionCorrect ? 'Korrekt!' : 'Ikke helt...'}
                        </h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                        {lastActionCorrect ? currentLevel.successFeedback : currentLevel.failureFeedback}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 flex justify-end">
                    <button 
                        onClick={nextLevel}
                        className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-colors ${lastActionCorrect ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}
                    >
                        {lastActionCorrect ? 'Næste Udfordring' : 'Prøv Igen / Videre'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClosedLoopSimulator;
