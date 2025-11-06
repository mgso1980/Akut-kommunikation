import React, { useState, useCallback } from 'react';
import { getIsbarFeedback } from '../services/geminiService';
import Feedback from './Feedback';
import IsbarForm from './IsbarForm';
import { IsbarInput, StructuredFeedback } from '../types';
import { LoaderIcon, SendIcon, AlertTriangleIcon } from './icons';

interface IsbarSimulatorProps {
  scenario: string;
}

type Status = 'idle' | 'processing' | 'feedback' | 'error';

const initialIsbarInput: IsbarInput = {
  identification: '',
  situation: '',
  background: '',
  analysis: '',
  recommendation: '',
};

const IsbarSimulator: React.FC<IsbarSimulatorProps> = ({ scenario }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [isbarInput, setIsbarInput] = useState<IsbarInput>(initialIsbarInput);
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Cast field to string to resolve TypeScript error. All values in IsbarInput are strings.
    if (Object.values(isbarInput).some(field => (field as string).trim() === '')) {
      setError("Alle felter i ISBAR-rapporten skal udfyldes.");
      // Sæt ikke status her for at holde knappen aktiv, men vis fejlen
      return;
    }
    
    setStatus('processing');
    setError('');

    const fullReport = `
      Identifikation: ${isbarInput.identification}
      Situation: ${isbarInput.situation}
      Baggrund: ${isbarInput.background}
      Analyse: ${isbarInput.analysis}
      Anbefaling: ${isbarInput.recommendation}
    `.trim();

    try {
      const response = await getIsbarFeedback(scenario, fullReport);
      setFeedback(response);
      setStatus('feedback');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Der opstod en fejl under hentning af feedback.');
      setStatus('error');
    }
  };

  const handleReset = useCallback(() => {
    setIsbarInput(initialIsbarInput);
    setFeedback(null);
    setError('');
    setStatus('idle');
  }, []);

  if (status === 'feedback' || (status === 'error' && feedback)) {
    return <Feedback feedback={feedback} error={error} onReset={handleReset} />;
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
       <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2">
        Skriftlig ISBAR Rapport
      </h2>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
         <IsbarForm isbarInput={isbarInput} setIsbarInput={setIsbarInput} />
      </div>
      
       <div className="pt-2 mt-auto">
        {error && !feedback && (
             <div className="flex items-center justify-center space-x-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                <AlertTriangleIcon className="h-5 w-5 flex-shrink-0"/>
                <p className="text-sm">{error}</p>
            </div>
        )}
        
        {status === 'idle' || status === 'error' ? (
           <button onClick={handleSubmit} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
             <SendIcon className="h-5 w-5 mr-2" /> Indsend til Feedback
           </button>
         ) : (
           <button disabled className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-400 dark:bg-slate-600 cursor-not-allowed">
             <LoaderIcon className="h-5 w-5 mr-2 animate-spin" /> Analyserer rapport...
           </button>
         )}
       </div>
    </div>
  );
};

export default IsbarSimulator;