
import React, { useState, useMemo, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, RefreshCwIcon, FileTextIcon, LoaderIcon, AlertTriangleIcon } from './icons';
import { generateQuizQuestions } from '../services/geminiService';
import { QuizQuestion } from '../types';

type QuizStatus = 'idle' | 'generating' | 'active' | 'submitted' | 'error';

const Quiz: React.FC = () => {
    const [status, setStatus] = useState<QuizStatus>('idle');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    const handleGenerateQuiz = useCallback(async () => {
        setStatus('generating');
        setError(null);
        try {
            const newQuestions = await generateQuizQuestions(8);
            setQuestions(newQuestions);
            setUserAnswers({});
            setStatus('active');
        } catch (e) {
            const err = e as Error;
            setError(err.message || 'En ukendt fejl opstod.');
            setStatus('error');
        }
    }, []);

    const handleAnswerChange = (id: number, value: any) => {
        setUserAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        window.scrollTo(0, 0);
        setStatus('submitted');
    };

    const handleReset = () => {
        setStatus('idle');
        setQuestions([]);
        setUserAnswers({});
        setError(null);
    };

    const score = useMemo(() => {
        if (status !== 'submitted') return 0;
        return questions.reduce((acc, q) => {
            const answer = userAnswers[q.id] || [];
            
            // Sorter begge arrays for at sikre, at rækkefølgen ikke påvirker resultatet
            const sortedAnswer = [...answer].sort();
            const sortedCorrectAnswers = [...q.correctAnswers].sort();

            const isCorrect = sortedAnswer.length === sortedCorrectAnswers.length && 
                              sortedAnswer.every((val, index) => val === sortedCorrectAnswers[index]);
            
            return acc + (isCorrect ? 1 : 0);
        }, 0);
    }, [status, userAnswers, questions]);


    const renderQuestion = (q: QuizQuestion, index: number) => {
        const isSubmitted = status === 'submitted';
        const userAnswer = userAnswers[q.id] || [];

        return (
            <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{index + 1}. {q.question}</p>
                <div className="space-y-2">
                    {q.options?.map(opt => {
                        const isChecked = userAnswer.includes(opt);
                        let feedbackClass = '';
                        if (isSubmitted) {
                            if (q.correctAnswers.includes(opt)) {
                                feedbackClass = 'bg-green-100 dark:bg-green-900/30';
                            } else if (isChecked) {
                                feedbackClass = 'bg-red-100 dark:bg-red-900/30';
                            }
                        }

                        return (
                            <label key={opt} className={`flex items-center p-2 rounded-md transition-colors ${feedbackClass}`}>
                                <input 
                                    type={q.type === 'multiple-choice' ? 'radio' : 'checkbox'}
                                    name={`q${q.id}`} 
                                    value={opt} 
                                    onChange={(e) => {
                                        if (q.type === 'multiple-choice') {
                                            handleAnswerChange(q.id, [e.target.value]);
                                        } else {
                                            const current = userAnswers[q.id] || []; 
                                            const newAnswers = e.target.checked ? [...current, opt] : current.filter((a:string) => a !== opt); 
                                            handleAnswerChange(q.id, newAnswers);
                                        }
                                    }} 
                                    disabled={isSubmitted} 
                                    checked={isChecked} 
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                                />
                                <span>{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    const IdleView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <FileTextIcon className="h-16 w-16 mb-4 text-blue-400"/>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Klar til en ny videnstest?</h3>
            <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
                Klik på knappen for at lade vores AI-underviser generere et unikt sæt spørgsmål om akut kommunikation til dig.
            </p>
            <button onClick={handleGenerateQuiz} className="mt-8 inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                Generér Ny Quiz
            </button>
        </div>
    );
    
    const GeneratingView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
            <LoaderIcon className="h-12 w-12 animate-spin text-blue-500"/>
            <p className="mt-4 font-semibold">AI'en forbereder din quiz...</p>
            <p className="text-sm">Et øjeblik, der laves nye, spændende spørgsmål.</p>
        </div>
    );

    const ErrorView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertTriangleIcon className="h-12 w-12 text-red-500"/>
            <h3 className="mt-4 text-xl font-bold text-red-800 dark:text-red-200">Der opstod en fejl</h3>
            <p className="mt-1 text-red-600 dark:text-red-300">{error}</p>
            <button onClick={handleReset} className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Prøv Igen
            </button>
        </div>
    );

    const QuizView = () => (
        <>
            {status === 'submitted' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500 rounded-r-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Resultat</h3>
                    <p className="text-blue-700 dark:text-blue-300/90 mt-1">Du fik {score} ud af {questions.length} korrekte svar. Gennemgå dine svar nedenfor.</p>
                </div>
            )}
            {questions.map(renderQuestion)}
        </>
    );
    
    let content;
    switch (status) {
        case 'idle':
            content = <IdleView />;
            break;
        case 'generating':
            content = <GeneratingView />;
            break;
        case 'active':
        case 'submitted':
            content = <QuizView />;
            break;
        case 'error':
            content = <ErrorView />;
            break;
        default:
            content = <IdleView />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2 flex items-center">
                <FileTextIcon className="h-6 w-6 mr-3 text-blue-500"/>
                AI-Genereret Videnstest
            </h2>
            
            <div className="flex-grow space-y-8 overflow-y-auto pr-4 -mr-4 min-h-[400px]">
                {content}
            </div>

            <div className="pt-4 mt-auto">
                {status === 'active' && (
                    <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Tjek Svar
                    </button>
                )}
                {status === 'submitted' && (
                    <button onClick={handleGenerateQuiz} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                        <RefreshCwIcon className="h-5 w-5 mr-2" />
                        Generér Ny Quiz
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;
