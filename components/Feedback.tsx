
import React from 'react';
import { RefreshCwIcon, AlertTriangleIcon, LightbulbIcon, CheckCircleIcon, AlertCircleIcon, XCircleIcon } from './icons';
import { StructuredFeedback, FeedbackSection } from '../types';

interface FeedbackProps {
  feedback: StructuredFeedback | null;
  error: string;
  onReset: () => void;
}

const RatingIndicator: React.FC<{ rating: FeedbackSection['rating'] }> = ({ rating }) => {
    const ratingStyles = {
        'God': {
            icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
            bgColor: 'bg-green-50 dark:bg-green-900/40',
            textColor: 'text-green-800 dark:text-green-300',
            text: 'God'
        },
        'Tilstrækkelig': {
            icon: <AlertCircleIcon className="h-5 w-5 text-yellow-500" />,
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/40',
            textColor: 'text-yellow-800 dark:text-yellow-300',
            text: 'Tilstrækkelig'
        },
        'Kræver forbedring': {
            icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
            bgColor: 'bg-red-50 dark:bg-red-900/40',
            textColor: 'text-red-800 dark:text-red-300',
            text: 'Kræver forbedring'
        }
    };
    const styles = ratingStyles[rating];
    return (
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${styles.bgColor} ${styles.textColor}`}>
            {styles.icon}
            <span>{styles.text}</span>
        </div>
    );
};

const Feedback: React.FC<FeedbackProps> = ({ feedback, error, onReset }) => {
  return (
    <div className="space-y-6 h-full flex flex-col">
      {error && !feedback ? (
        <div className="flex-grow flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/40 p-6 rounded-lg">
          <AlertTriangleIcon className="h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-xl font-bold text-red-800 dark:text-red-200">Der opstod en fejl</h3>
          <p className="mt-1 text-red-600 dark:text-red-300 text-center">{error}</p>
        </div>
      ) : (
        <>
            <div className="flex items-center space-x-3">
                <LightbulbIcon className="h-6 w-6 text-amber-500"/>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Feedback fra Dr. Jørgensen
                </h2>
            </div>
            <div className="flex-grow p-1 overflow-y-auto max-h-[60vh] space-y-4">
              {feedback ? (
                <>
                  <p className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-600 dark:text-slate-300">{feedback.opening}</p>
                  
                  {feedback.sections.map((section, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-slate-300 dark:border-slate-600">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
                        <RatingIndicator rating={section.rating} />
                      </div>
                      <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
                        {section.points.map((point, pIndex) => (
                            <li key={pIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500 rounded-r-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Samlet Vurdering</h4>
                    <p className="text-blue-700 dark:text-blue-300/90 mt-1">{feedback.conclusion}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                  <p>Indlæser feedback...</p>
                </div>
              )}
            </div>
        </>
      )}
      <div className="pt-4 mt-auto">
        <button
          onClick={onReset}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform transform hover:scale-105"
        >
          <RefreshCwIcon className="h-5 w-5 mr-2" />
          Prøv Igen
        </button>
      </div>
    </div>
  );
};

export default Feedback;
