
import React, { useState, useMemo, useCallback } from 'react';
import { CheckCircleIcon, RefreshCwIcon, FileTextIcon, LoaderIcon, AlertTriangleIcon } from './icons';
import { QuizQuestion } from '../types';
import { QUIZ_POOL } from '../constants';

type QuizStatus = 'idle' | 'generating' | 'active' | 'submitted' | 'error';

const Quiz: React.FC = () => {
    const [status, setStatus] = useState<QuizStatus>('idle');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    const handleStartQuiz = useCallback(() => {
        setStatus('generating');
        setError(null);
        
        // Simuler en kort "load" for bedre UX, selvom det er lokalt
        setTimeout(() => {
            try {
                // Bland spørgsmålene og vælg 5 tilfældige
                const shuffled = [...QUIZ_POOL].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 5);
                
                setQuestions(selected);
                setUserAnswers({});
                setStatus('active');
            } catch (e) {
                const err = e as Error;
                setError(err.message || 'En ukendt fejl opstod.');
                setStatus('error');
            }
        }, 600);
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
                                feedbackClass = 'bg-green-100 dark:bg-green-900/30 border border-green-500';
                            } else if (isChecked) {
                                feedbackClass = 'bg-red-100 dark:bg-red-900/30 border border-red-500';
                            }
                        }

                        return (
                            <label key={opt} className={`flex items-center p-3 rounded-md transition-all ${feedbackClass} ${!isSubmitted ? 'hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer' : ''}`}>
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
                                    className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                                <span className="text-slate-700 dark:text-slate-200">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    const IdleView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-full mb-6">
                <FileTextIcon className="h-16 w-16 text-blue-600 dark:text-blue-400"/>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Videnstest</h3>
            <p className="max-w-md text-slate-600 dark:text-slate-300 mb-8">
                Test din viden om ISBAR, Closed Loop og sikker kommunikation. Du får 5 tilfældige spørgsmål fra vores spørgsmålsbank.
            </p>
            <button onClick={handleStartQuiz} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105">
                Start Videnstest
            </button>
        </div>
    );
    
    const GeneratingView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
            <LoaderIcon className="h-12 w-12 animate-spin text-blue-500"/>
            <p className="mt-4 font-semibold text-lg">Henter spørgsmål...</p>
        </div>
    );

    const ErrorView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertTriangleIcon className="h-16 w-16 text-red-500 mb-4"/>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Der opstod en fejl</h3>
            <p className="mt-2 text-red-600 dark:text-red-300 mb-6">{error}</p>
            <button onClick={handleReset} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold">
                <RefreshCwIcon className="h-5 w-5 mr-2 inline" />
                Prøv Igen
            </button>
        </div>
    );

    const QuizView = () => (
        <>
            {status === 'submitted' && (
                <div className={`p-6 rounded-lg mb-6 border-l-8 ${score === questions.length ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'}`}>
                    <h3 className={`text-xl font-bold ${score === questions.length ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                        {score === questions.length ? 'Perfekt Resultat!' : 'Resultat'}
                    </h3>
                    <p className="text-lg mt-2 text-slate-700 dark:text-slate-300">
                        Du fik <span className="font-bold">{score}</span> ud af <span className="font-bold">{questions.length}</span> rigtige.
                    </p>
                    {score < questions.length && (
                        <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Se rettelserne nedenfor.</p>
                    )}
                </div>
            )}
            <div className="space-y-6">
                {questions.map(renderQuestion)}
            </div>
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
            {status !== 'idle' && (
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2 flex items-center">
                    <FileTextIcon className="h-6 w-6 mr-3 text-blue-500"/>
                    Videnstest
                </h2>
            )}
            
            <div className="flex-grow overflow-y-auto pr-2">
                {content}
            </div>

            <div className="pt-4 mt-auto">
                {status === 'active' && (
                    <button onClick={handleSubmit} className="w-full flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-105">
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Tjek Svar
                    </button>
                )}
                {status === 'submitted' && (
                    <button onClick={handleStartQuiz} className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-105">
                        <RefreshCwIcon className="h-6 w-6 mr-2" />
                        Tag en ny test
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;
