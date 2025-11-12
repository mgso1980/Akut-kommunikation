import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { BotIcon, UserIcon, AlertTriangleIcon, LoaderIcon, MicrophoneIcon, RefreshCwIcon, StopCircleIcon } from './icons';
import { getClosedLoopFeedback } from '../services/geminiService';
import { Message, StructuredFeedback } from '../types';
import Feedback from './Feedback';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils';

interface ClosedLoopVoiceSimulatorProps {
  scenario: string;
}

type Status = 'idle' | 'requesting_mic' | 'connecting' | 'active' | 'processing_feedback' | 'feedback' | 'error';
type TranscriptionTurn = { userInput: string, modelOutput: string };

const ClosedLoopVoiceSimulator: React.FC<ClosedLoopVoiceSimulatorProps> = ({ scenario }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionTurn[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanupAudio = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    
    mediaStreamSourceRef.current?.disconnect();
    mediaStreamSourceRef.current = null;
    
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    inputAudioContextRef.current = null;

    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    outputAudioContextRef.current = null;

    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const handleReset = useCallback(() => {
    cleanupAudio();
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
    }
    setTranscriptionHistory([]);
    setCurrentInput('');
    setCurrentOutput('');
    setFeedback(null);
    setError('');
    setStatus('idle');
  }, [cleanupAudio]);

  const handleFeedbackGeneration = useCallback(async () => {
    if (transcriptionHistory.length === 0 && !currentInput && !currentOutput) {
        handleReset();
        return;
    }
    setStatus('processing_feedback');
    
    // Ensure the last turn is included
    const finalHistory = [...transcriptionHistory];
    if (currentInput || currentOutput) {
        finalHistory.push({ userInput: currentInput, modelOutput: currentOutput });
    }

    const formattedMessages: Message[] = finalHistory.flatMap(turn => [
        { role: 'user', text: turn.userInput },
        { role: 'model', text: turn.modelOutput }
    ]);
    
    try {
        const feedbackObject = await getClosedLoopFeedback(scenario, formattedMessages);
        setFeedback(feedbackObject);
        setStatus('feedback');
    } catch (e) {
        const err = e as Error;
        setError(err.message || 'Der opstod en fejl under generering af feedback.');
        setStatus('error');
    }
  }, [scenario, transcriptionHistory, currentInput, currentOutput, handleReset]);

  const handleStop = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close()).catch(console.error);
      sessionPromiseRef.current = null;
    }
    cleanupAudio();
    handleFeedbackGeneration();
  }, [cleanupAudio, handleFeedbackGeneration]);

  const handleStart = useCallback(async () => {
    handleReset();
    setStatus('requesting_mic');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setStatus('connecting');

        // FIX: Add a fallback for webkitAudioContext and cast to any to support older browsers and satisfy TypeScript.
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const systemInstruction = `
Du er en erfaren overlæge, Dr. Jørgensen, i en akut medicinsk simulation. Patienten, Hr. Svendsen, udvikler akutte brystsmerter. Du er under pres, og din kommunikation kan være kortfattet og upræcis. Din opgave er at give en række ordinationer og sikre, at den sundhedsprofessionelle (brugeren) forstår dem korrekt via closed-loop kommunikation.
**Vigtig Rolleinstruks:** Du er *altid* lægen, der giver ordinationer. Du udfører *aldrig* selv handlingerne. Gentag ikke brugerens handlinger som dine egne (f.eks. hvis brugeren siger "Jeg giver X", skal du IKKE svare "Okay, jeg giver X"). Din rolle er at ordinere, vurdere svar og gå videre.
**Dine Regler:** Følg den samme logik som i den tekstbaserede simulator for at guide brugeren gennem tjeklisten. Vær tålmodig, giv hints ved fejl, og afslut kun med den præcise sætning "Jeg afventer dit opkald."
**Tjekliste:** 1. Ilt (5L på maske), 2. EKG & Smerter (2 pust Nitro), 3. Væske (1L NaCl over 30 min), 4. Blodprøver (Troponin & akutpakke), 5. Afslutning.
Start samtalen ved at give den første ordination om ilt.
`;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction,
            },
            callbacks: {
                onopen: () => {
                    if (!inputAudioContextRef.current) return;
                    const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;
                    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current.destination);
                    setStatus('active');
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscriptionHistory(prev => [...prev, { userInput: currentInput, modelOutput: currentOutput }]);
                        setCurrentInput('');
                        setCurrentOutput('');
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const outCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                    
                    const finalPhrase = "jeg afventer dit opkald";
                    const normalizedModelText = (currentOutput + (message.serverContent?.outputTranscription?.text || "")).toLowerCase().replace(/[.,!?]/g, "").trim();
                    if (normalizedModelText.endsWith(finalPhrase)) {
                       setTimeout(() => handleStop(), 1500);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    setError('Der opstod en forbindelsesfejl. Prøv venligst igen.');
                    setStatus('error');
                    cleanupAudio();
                },
                onclose: (e: CloseEvent) => {
                    // This can be triggered by handleStop, so we only set error if status is still active
                    if (status === 'active') {
                        setError('Forbindelsen blev uventet afbrudt.');
                        setStatus('error');
                    }
                    cleanupAudio();
                },
            },
        });
    } catch (err) {
        setError('Kunne ikke få adgang til mikrofonen. Tjek dine browser-tilladelser.');
        setStatus('error');
    }
  }, [handleReset, cleanupAudio, handleStop, status, scenario, currentInput, currentOutput]);
  
  useEffect(() => {
      return () => {
          cleanupAudio();
          if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
          }
      }
  }, [cleanupAudio]);

  const ChatBubble: React.FC<{ role: 'user' | 'model'; text: string }> = ({ role, text }) => (
    <div className={`flex items-start space-x-3 my-2 ${role === 'model' ? '' : 'flex-row-reverse space-x-reverse'}`}>
        <div className={`flex-shrink-0 p-2 rounded-full ${role === 'model' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
            {role === 'model' ? <BotIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" /> : <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        </div>
        <div className={`p-3 rounded-lg max-w-sm ${role === 'model' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-blue-600 text-white'}`}>
            <p className="text-sm whitespace-pre-wrap">{text || "..."}</p>
        </div>
    </div>
  );

  const renderContent = () => {
    if (status === 'feedback' || (status === 'error' && feedback)) {
        return <Feedback feedback={feedback} error={error} onReset={handleReset} />;
    }
    
    let centralMessage = null;
    if (status === 'idle') {
      centralMessage = <div className="text-center"><MicrophoneIcon className="h-10 w-10 mb-3" /><p className="font-semibold">Klar til Stemmesimulation</p><p className="text-sm mt-1">Klik "Start" for at tale med AI-lægen.</p></div>;
    } else if (status === 'requesting_mic') {
      centralMessage = <div className="text-center"><LoaderIcon className="h-10 w-10 mb-3 animate-spin" /><p className="font-semibold">Anmoder om mikrofon...</p></div>;
    } else if (status === 'connecting') {
      centralMessage = <div className="text-center"><LoaderIcon className="h-10 w-10 mb-3 animate-spin" /><p className="font-semibold">Opretter forbindelse...</p></div>;
    } else if (status === 'error' && !feedback) {
      centralMessage = <div className="text-center"><AlertTriangleIcon className="h-10 w-10 mb-3 text-red-500" /><p className="font-semibold">Der opstod en fejl</p><p className="text-sm mt-1">{error}</p></div>;
    }
    
    return (
      <div className="space-y-4 h-full flex flex-col">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2">
          Closed Loop Simulator (Talebaseret)
        </h2>
        <div className="flex-grow p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-y-auto min-h-[300px] flex flex-col">
          {transcriptionHistory.length === 0 && !currentInput && !currentOutput && centralMessage ? (
              <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400">{centralMessage}</div>
          ) : (
            <>
              {transcriptionHistory.map((turn, index) => (
                <React.Fragment key={index}>
                  {turn.userInput && <ChatBubble role="user" text={turn.userInput} />}
                  {turn.modelOutput && <ChatBubble role="model" text={turn.modelOutput} />}
                </React.Fragment>
              ))}
              {currentInput && <ChatBubble role="user" text={currentInput} />}
              {currentOutput && <ChatBubble role="model" text={currentOutput} />}
            </>
          )}
        </div>
        <div className="pt-2 mt-auto">
          {status === 'idle' && (
              <button onClick={handleStart} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                <MicrophoneIcon className="h-5 w-5 mr-2" /> Start Stemmesimulation
              </button>
          )}
          {status === 'active' && (
               <button onClick={handleStop} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                <StopCircleIcon className="h-5 w-5 mr-2" /> Stop Simulation
              </button>
          )}
          {['connecting', 'requesting_mic', 'processing_feedback'].includes(status) && (
              <button disabled className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-400 dark:bg-slate-600 cursor-not-allowed">
                <LoaderIcon className="h-5 w-5 mr-2 animate-spin" /> 
                {status === 'processing_feedback' ? 'Analyserer samtale...' : 'Forbereder...'}
              </button>
          )}
          {status === 'error' && !feedback && (
              <button onClick={handleReset} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                <RefreshCwIcon className="h-5 w-5 mr-2"/> Prøv Igen
              </button>
          )}
        </div>
      </div>
    );
  };
  
  return renderContent();
};

export default ClosedLoopVoiceSimulator;
