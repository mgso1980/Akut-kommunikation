
import React from 'react';

interface ScenarioProps {
  title: string;
  description: string;
  mode: 'isbar' | 'closedLoop' | 'quiz';
}

const Scenario: React.FC<ScenarioProps> = ({ title, description, mode }) => {
  const taskDescription = {
    isbar: "Læs casen grundigt. Udfyld derefter ISBAR-skemaet som forberedelse til opkaldet til lægen. Når du er færdig, får du vist et eksemplarisk svar og en tjekliste, så du kan sammenligne og vurdere din egen præstation.",
    closedLoop: "Du spiller nu rollen som 'Safety Guard' (Sikkerhedsbarriere) i dette Closed Loop spil. Dr. Jørgensen er stresset og giver dig en række ordinationer. Din opgave er at vurdere hver ordre: Skal du UDFØRE den (hvis den er sikker), AFKLARE den (hvis den er upræcis), eller STOPPE den (hvis den er farlig)? Pas på din patientsikkerheds-score!",
    quiz: "Test din viden om sikker kommunikation, ISBAR og Closed Loop. Svar på spørgsmålene og få umiddelbar feedback på din teoretiske viden."
  };
  
  const displayTitle = mode === 'quiz' ? 'Videnstest' : title;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2">
        {mode === 'quiz' ? 'Teori & Viden' : 'Klinisk Scenarie'}
      </h2>
      <div className="flex-grow p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg prose prose-slate dark:prose-invert max-w-none">
        <h3 className="text-lg font-semibold">{displayTitle}</h3>
        {mode !== 'quiz' ? (
          <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : (
           <p className="text-slate-600 dark:text-slate-300">
            Dette modul tester din forståelse af de kommunikationsværktøjer, vi bruger til at sikre patientsikkerheden i akutte situationer.
          </p>
        )}
      </div>
       <div className="mt-auto p-4 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500 rounded-r-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300">Din Opgave</h4>
        <p className="text-blue-700 dark:text-blue-300/90 mt-1">
          {taskDescription[mode]}
        </p>
      </div>
    </div>
  );
};

export default Scenario;
