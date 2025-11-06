
import React from 'react';
import { IsbarInput } from '../types';

interface IsbarFormProps {
  isbarInput: IsbarInput;
  setIsbarInput: React.Dispatch<React.SetStateAction<IsbarInput>>;
}

const IsbarForm: React.FC<IsbarFormProps> = ({ isbarInput, setIsbarInput }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIsbarInput(prev => ({ ...prev, [name]: value }));
  };

  const fields: { key: keyof IsbarInput; label: string; placeholder: string }[] = [
    { key: 'identification', label: 'I: Identifikation', placeholder: 'Hvem er du, hvor ringer du fra, og hvem er patienten?' },
    { key: 'situation', label: 'S: Situation', placeholder: 'Hvad er det akutte problem? Hvorfor ringer du?' },
    { key: 'background', label: 'B: Baggrund', placeholder: 'Hvad er den relevante baggrundsinformation om patienten?' },
    { key: 'analysis', label: 'A: Analyse', placeholder: 'Hvad er din vurdering af situationen? Hvad tror du, der er galt?' },
    { key: 'recommendation', label: 'R: Anbefaling', placeholder: 'Hvad foreslår du, der skal gøres? Hvad har du brug for?' },
  ];

  return (
    <form className="space-y-4">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
          </label>
          <textarea
            id={key}
            name={key}
            rows={3}
            value={isbarInput[key]}
            onChange={handleChange}
            placeholder={placeholder}
            className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-900/50"
          />
        </div>
      ))}
    </form>
  );
};

export default IsbarForm;
