
import React, { useState, useCallback } from 'react';
import IsbarForm from './IsbarForm';
import { IsbarInput } from '../types';
import { SendIcon, RefreshCwIcon, CheckCircleIcon, FileTextIcon } from './icons';
import { EXEMPLARY_ISBAR, ISBAR_CHECKLIST } from '../constants';

interface IsbarSimulatorProps {
  scenario: string;
}

type Status = 'editing' | 'review';

const initialIsbarInput: IsbarInput = {
  identifikation: '',
  situation: '',
  baggrund: '',
  analyse: '',
  anbefaling: '',
};

const labels: Record<keyof IsbarInput, string> = {
  identifikation: 'Identifikation',
  situation: 'Situation',
  baggrund: 'Baggrund',
  analyse: 'Analyse',
  anbefaling: 'Anbefaling'
};

const IsbarSimulator: React.FC<IsbarSimulatorProps> = ({ scenario }) => {
  const [status, setStatus] = useState<Status>('editing');
  const [isbarInput, setIsbarInput] = useState<IsbarInput>(initialIsbarInput);
  const [error, setError] = useState('');

  // Local checklist state
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(ISBAR_CHECKLIST.length).fill(false));

  const toggleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(isbarInput).some(field => (field as string).trim() === '')) {
      setError("Alle felter i ISBAR-rapporten skal udfyldes før sammenligning.");
      return;
    }
    setError('');
    setStatus('review');
    window.scrollTo(0, 0);
  };

  const handleReset = useCallback(() => {
    setIsbarInput(initialIsbarInput);
    setCheckedItems(new Array(ISBAR_CHECKLIST.length).fill(false));
    setError('');
    setStatus('editing');
  }, []);

  const handleEdit = () => {
    setStatus('editing');
  };

  if (status === 'review') {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-700 pb-4">
          <FileTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Sammenlign dit svar
          </h2>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
           Herunder kan du se dit eget svar sammenlignet med et eksempel på en "korrekt" ISBAR indberetning for denne case. Brug tjeklisten i bunden til at validere din indsats.
        </div>

        <div className="flex-grow space-y-6 overflow-y-auto">
          {(Object.keys(labels) as Array<keyof IsbarInput>).map((key) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Input */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Dit Svar: {labels[key]}
                </h3>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {isbarInput[key]}
                </p>
              </div>

              {/* Exemplary Input */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">
                  Eksempel
                </h3>
                <p className="text-slate-800 dark:text-slate-200 italic">
                  "{EXEMPLARY_ISBAR[key]}"
                </p>
              </div>
            </div>
          ))}

          {/* Checklist */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Selv-evaluering</h3>
            <div className="space-y-3">
              {ISBAR_CHECKLIST.map((item, index) => (
                <label key={index} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                  <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${checkedItems[index] ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {checkedItems[index] && <CheckCircleIcon className="h-4 w-4 text-white" />}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={checkedItems[index]} 
                      onChange={() => toggleCheck(index)}
                    />
                  </div>
                  <span className={`text-slate-700 dark:text-slate-300 ${checkedItems[index] ? 'line-through opacity-70' : ''}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Rediger mit svar
          </button>
          <button 
            onClick={handleReset}
            className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Nulstil og start forfra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
       <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2">
        Skriftlig ISBAR Rapport
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Udfyld felterne herunder. Når du er færdig, kan du sammenligne dit svar med et eksempel.
      </p>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
         <IsbarForm isbarInput={isbarInput} setIsbarInput={setIsbarInput} />
      </div>
      
       <div className="pt-2 mt-auto">
        {error && (
             <div className="flex items-center justify-center space-x-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                <p className="text-sm font-medium">{error}</p>
            </div>
        )}
        
        <button onClick={handleSubmit} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
          <SendIcon className="h-5 w-5 mr-2" /> Se Tjekliste & Eksempel
        </button>
       </div>
    </div>
  );
};

export default IsbarSimulator;
