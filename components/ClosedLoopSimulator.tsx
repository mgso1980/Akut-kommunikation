
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { BotIcon, UserIcon, AlertTriangleIcon, LoaderIcon, MessageCircleIcon, RefreshCwIcon, SendIcon } from './icons';
import { getClosedLoopFeedback } from '../services/geminiService';
import { Message, StructuredFeedback } from '../types';
import Feedback from './Feedback';


interface ClosedLoopSimulatorProps {
  scenario: string;
}

type Status = 'idle' | 'active' | 'loading' | 'processing_feedback' | 'feedback' | 'error';

const ClosedLoopSimulator: React.FC<ClosedLoopSimulatorProps> = ({ scenario }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [history, setHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Message[]>([]);
  
  useEffect(() => {
    historyRef.current = history;
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);


  const handleFeedbackGeneration = useCallback(async () => {
    // Only generate feedback if there was a meaningful interaction
    if (historyRef.current.length < 2) { 
        setStatus('idle');
        return;
    }
    setStatus('processing_feedback');
    try {
        const feedbackObject = await getClosedLoopFeedback(scenario, historyRef.current);
        setFeedback(feedbackObject);
        setStatus('feedback');
    } catch (e) {
        const err = e as Error;
        console.error("Error generating feedback:", err);
        setError(err.message || 'Der opstod en fejl under generering af feedback.');
        setStatus('error');
    }
  }, [scenario]);

  const handleReset = useCallback(() => {
    setHistory([]);
    historyRef.current = [];
    setFeedback(null);
    setError('');
    setUserInput('');
    chatRef.current = null;
    setStatus('idle');
  }, []);

  const handleStart = () => {
    handleReset();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const systemInstruction = `
Du er en erfaren overlæge, Dr. Jørgensen, i en akut medicinsk simulation. Patienten, Hr. Svendsen, udvikler akutte brystsmerter. Du er under pres, og din kommunikation kan være kortfattet og upræcis. Din opgave er at give en række ordinationer og sikre, at den sundhedsprofessionelle (brugeren) forstår dem korrekt via closed-loop kommunikation.

**Vigtig Rolleinstruks:** Du er *altid* lægen, der giver ordinationer. Du udfører *aldrig* selv handlingerne. Gentag ikke brugerens handlinger som dine egne (f.eks. hvis brugeren siger "Jeg giver X", skal du IKKE svare "Okay, jeg giver X"). Din rolle er at ordinere, vurdere svar og gå videre.

**Dine Regler:**
1.  **Følg Tjeklisten Nøje:** Gå kun videre til næste punkt på tjeklisten, når det forrige er fuldt afklaret og korrekt bekræftet af brugeren.
2.  **Vær Tålmodig:** Vent på, at brugeren stiller afklarende spørgsmål. Giv ikke mere information end nødvendigt.
3.  **Giv Hjælpsomme Hints:** Hvis en bekræftelse er forkert eller mangelfuld, skal du IKKE sige "Okay" eller "Forstået". I stedet skal du guide brugeren med et specifikt hint, så de ved, hvad der mangler.
4.  **Håndter kommentarer:** Hvis brugeren kommer med en konstaterende bemærkning, der ikke er et spørgsmål eller en bekræftelse (f.eks. "det er det samme", "forstået", "ok"), anerkend kortfattet ("Korrekt." eller "Noteret.") og afvent så det næste spørgsmål uden at give yderligere hints. Dette gælder IKKE for en formel "closed loop" bekræftelse.
5.  **Anerkend, men fasthold fokus:** Hvis brugeren kommer med en relevant, uopfordret observation (f.eks. "hans SAT er nu steget"), skal du anerkende det kort (f.eks. "Noteret.") og derefter straks guide samtalen tilbage til det aktuelle punkt på din tjekliste.
6.  **Fleksibel Vurdering:** Dit primære mål er at vurdere, om brugeren har forstået de kliniske nøgleelementer. Accepter variationer i sprogbrug. Hvis brugeren bekræfter de korrekte nøgleelementer (f.eks. "EKG" og "2 pust nitro"), er det korrekt, selvom de ikke bruger dine præcise ord. Hvis brugeren har nævnt de korrekte nøgleord, MÅ du IKKE bede om en gentagelse - du SKAL gå videre til næste punkt.
7.  **Tolerer Stavefejl:** Acceptér svar, selvom de indeholder stavefejl, så længe den kliniske intention er klar. Hvis et ord ligner eller lyder som et nøgleord (f.eks. "Niroglycerin" for "Nitroglycerin" eller "akutpake" for "akutpakke"), skal du betragte det som korrekt.
8.  **Håndter Sammensatte Svar:** Hvis en brugers besked indeholder flere dele (f.eks. en korrekt bekræftelse PLUS en observation), skal du prioritere bekræftelsen. Anerkend den korrekte bekræftelse ved at gå videre til næste punkt på tjeklisten. Du kan kort anerkende den ekstra observation (f.eks. "Godt, noteret."), men hovedfokus er at fortsætte forløbet.

**Simulationsforløb (TJEKLISTE):**

*   **1. ILT (Forenklet Afklaring):**
    *   **Din Ordination:** "Giv patienten noget ilt, det ser skidt ud."
    *   **Afvent Afklaring:** Brugeren skal stille et afklarende spørgsmål om ilten (f.eks. "hvor meget?" eller "hvordan?").
    *   **Din Præcisering:** Så snart brugeren spørger om enten mængde eller metode, skal du give den fulde, præcise ordination: "5 liter på maske."
    *   **Vurdering af Bekræftelse:** Afvent en bekræftelse fra brugeren, der indeholder nøgleordene: "5 liter" OG "maske".
    *   **Handling ved Fejl:** Hvis bekræftelsen er forkert eller mangelfuld, svar: "Gentag venligst mængde og metode for ilt."
    *   **Handling ved Succes:** Gå til næste punkt.

*   **2. EKG & SMERTER (Separat Håndtering):**
    *   **Din Ordination:** "Han klager over brystsmerter. Vi skal have et EKG og giv ham noget for smerterne."
    *   **Afvent Afklaring:** Brugeren skal afklare *begge* dele. Du skal håndtere dem separat, uanset hvilken rækkefølge brugeren tager dem i.
        *   **EKG:** Hvis brugeren spørger til EKG, bekræft: "Et EKG."
        *   **Smerter:** Hvis brugeren spørger til smerter, ordiner: "Start med Nitroglycerin. To pust under tungen."
    *   **Husk Hvad Der Er Bekræftet:** Hold styr på, om EKG er bekræftet, og om Nitroglycerin er bekræftet.
    *   **Vurdering:** Gå først videre, når *begge* dele er blevet korrekt bekræftet (f.eks. "Jeg tager et EKG" og "Jeg giver to pust Nitroglycerin under tungen").
    *   **Handling ved Mangel:** Hvis kun én del er bekræftet, mind brugeren om den anden del. F.eks., hvis EKG er bekræftet, men ikke smertestillende, så sig: "Fint. Hvad med det smertestillende?"
    *   **Handling ved Succes:** Når begge dele er bekræftet, gå til næste punkt.

*   **3. VÆSKE (Fleksibel Afklaring):**
    *   **Din Ordination:** "Han ser også lidt dehydreret ud. Giv ham noget væske."
    *   **Afvent Afklaring:** Brugeren skal afklare de tre nøgleelementer: **type**, **mængde**, og **tid**. De kan gøre dette ved at spørge separat eller ved at foreslå den fulde ordination.
    *   **Dine Svar (hvis spurgt separat):** Svar KUN på det, der bliver spurgt om.
        *   Type: "Natriumklorid."
        *   Mængde: "En liter."
        *   Tid: "Det skal løbe ind over 30 minutter."
    *   **Håndtering af Komplet Bekræftelse:** Hvis brugerens besked indeholder en korrekt bekræftelse af **alle tre dele** (uanset om det er som et spørgsmål eller en konstatering, f.eks. "okay, så en liter natriumklorid over 30 minutter?"), skal du anse det for en succesfuld "closed loop".
    *   **Handling ved Succes:** Når den fulde ordination er korrekt bekræftet, svar ved at anerkende OG give næste ordination i samme besked. Eksempel: "Korrekt. Tag også blodprøver, når du er i gang."
    *   **Håndtering af Delvis Bekræftelse:** Hvis brugeren kun bekræfter en del (f.eks. "Okay, Natriumklorid"), skal du guide dem: "Korrekt. Men du mangler at afklare mængde og indløbstid."
    *   **Handling ved Fejl:** Hvis en samlet bekræftelse indeholder forkerte oplysninger, svar: "Nej, det er ikke korrekt. Gentag venligst den fulde ordination."

*   **4. BLODPRØVER:**
    *   **Din Ordination:** "Tag også blodprøver, når du er i gang."
    *   **Afvent Afklaring:** Brugeren skal spørge "Hvilke blodprøver?".
    *   **Din Præcisering:** Svar: "En troponin I og en fuld akutpakke."
    *   **Vurdering:** Afvent en bekræftelse, der indeholder nøgleordene "troponin" og "akutpakke".
    *   **Handling ved Fejl:** Hvis bekræftelsen er forkert, svar: "Gentag venligst, hvilke blodprøver der skal tages."
    *   **Handling ved Succes:** Gå til næste punkt.

*   **5. AFSLUTNING:**
    *   **Din Ordination:** "Ring til mig med det samme, når EKG'et er klar."
    *   **Vurdering:** Afvent en simpel bekræftelse.
    *   **Handling ved Succes:** Efter brugerens bekræftelse, siger du **PRÆCIS, ORD FOR ORD OG UDEN NOGEN ÆNDRINGER ELLER TILFØJELSER, DENNE ENDELIGE SÆTNING**: "Jeg afventer dit opkald." Dette er den *eneste* måde, simulationen kan afsluttes korrekt på.
`;
    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: systemInstruction },
    });

    const firstMessage = { role: 'model' as const, text: 'Giv patienten noget ilt, det ser skidt ud.' };
    setHistory([firstMessage]);
    historyRef.current = [firstMessage];
    setStatus('active');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || status !== 'active' || !chatRef.current) return;
    
    setStatus('loading');
    const newUserMessage: Message = { role: 'user', text: userInput };
    setHistory(prev => [...prev, newUserMessage]);
    historyRef.current = [...historyRef.current, newUserMessage];
    
    const chat = chatRef.current;
    
    try {
      const stream = await chat.sendMessageStream({ message: userInput });
      setUserInput('');
      setHistory(prev => [...prev, { role: 'model', text: '' }]);
  
      let fullModelText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullModelText += chunkText;
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = fullModelText;
          return newHistory;
        });
      }
      historyRef.current = [...historyRef.current, { role: 'model', text: fullModelText }];
  
      const finalPhrase = "jeg afventer dit opkald";
      const normalizedModelText = fullModelText.toLowerCase().replace(/[.,!?]/g, "").trim();
  
      if (normalizedModelText.endsWith(finalPhrase)) {
        setTimeout(() => handleFeedbackGeneration(), 1000);
      } else {
        setStatus('active');
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Kunne ikke sende besked til AI-agenten. Prøv venligst igen.");
      setStatus('error');
    }
  };

  const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
      <div className={`flex items-start space-x-3 my-4 ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
        <div className={`flex-shrink-0 p-2 rounded-full ${isModel ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
          {isModel ? <BotIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" /> : <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        </div>
        <div className={`p-3 rounded-lg max-w-sm ${isModel ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-blue-600 text-white'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.text || "..."}</p>
        </div>
      </div>
    );
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return {
          title: 'Klar til Closed Loop Simulation',
          icon: <MessageCircleIcon className="h-10 w-10 mb-3" />,
          text: 'Klik på "Start Simulation" for at modtage den første ordination fra lægen.',
        };
      case 'error':
         return {
          title: 'Der opstod en fejl',
          icon: <AlertTriangleIcon className="h-10 w-10 mb-3 text-red-500" />,
          text: error,
        };
      default:
        return null;
    }
  };

  const statusContent = getStatusMessage();

  if (status === 'feedback' || (status === 'error' && feedback)) {
    return <Feedback feedback={feedback} error={error} onReset={handleReset} />;
  }
  
  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 pb-2">
        Closed Loop Simulator
      </h2>
      <div ref={chatContainerRef} className="flex-grow p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-y-auto min-h-[300px] flex flex-col">
        {history.length > 0 ? (
          history.map((msg, index) => <ChatMessage key={index} message={msg} />)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
            {statusContent && (
              <>
                {statusContent.icon}
                <p className="font-semibold">{statusContent.title}</p>
                <p className="text-sm mt-1">{statusContent.text}</p>
              </>
            )}
          </div>
        )}
      </div>

       <div className="pt-2 mt-auto">
        {status === 'idle' && (
          <button onClick={handleStart} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
            <MessageCircleIcon className="h-5 w-5 mr-2" /> Start Simulation
          </button>
        )}

        {(status === 'active' || status === 'loading') && (
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Skriv dit svar her..."
                    disabled={status === 'loading'}
                    className="flex-grow block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-800 disabled:opacity-50"
                    autoFocus
                />
                <button type="submit" disabled={status === 'loading' || !userInput.trim()} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed">
                    {status === 'loading' ? <LoaderIcon className="h-5 w-5 animate-spin"/> : <SendIcon className="h-5 w-5"/>}
                </button>
            </form>
        )}

        {status === 'processing_feedback' && (
          <button disabled className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-400 dark:bg-slate-600 cursor-not-allowed">
            <LoaderIcon className="h-5 w-5 mr-2 animate-spin" /> Analyserer samtale...
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

export default ClosedLoopSimulator;