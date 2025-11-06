
import React from 'react';

interface ScenarioProps {
  title: string;
  description: string;
  mode: 'isbar' | 'closedLoop' | 'quiz';
}

const Scenario: React.FC<ScenarioProps> = ({ title, description, mode }) => {
  const taskDescription = {
    isbar: "Gennemgå casen og udfyld ISBAR-formularen for at informere den vagthavende læge om patientens forværrede tilstand. Vær klar, koncis og grundig.",
    closedLoop: "Du er i en akut situation. Overlægen er presset og kan give upræcise ordinationer. Din opgave er at lytte, bede om afklaring på enhver tvivl (f.eks. dosis, præparat, metode) og derefter bekræfte den præcise ordination med closed loop-kommunikation. Bemærk: Simulationen afsluttes, når lægen siger 'Jeg afventer dit opkald'.",
    quiz: "Test din viden om akut kommunikation. Besvar spørgsmålene nedenfor og tjek dine svar for at se, hvordan du klarede dig."
  };
  
  const displayTitle = mode === 'quiz' ? 'Videnstest i Akut Kommunikation' : title;

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
            Dette arbejdsark hjælper dig med at teste din viden om akut kommunikation i sygepleje. Besvar alle spørgsmål så grundigt som muligt. Brug dine egne ord, hvor det er relevant, og tænk på praktiske situationer fra din kliniske erfaring.
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