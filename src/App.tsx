import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuestionnaireScreen } from './components/QuestionnaireScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { VersionCheck } from './components/VersionCheck';
import { questions } from './data/questions';
import { calculatePersonalityType } from './utils/personalityCalculator';
import { UserResponse, PersonalityResult } from './types/personality';
import { submitSubmission } from './api/client';

type AppState = 'welcome' | 'questionnaire' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleStart = (userNickname: string) => {
    setNickname(userNickname);
    setAppState('questionnaire');
  };

  const handleQuestionnaireComplete = async (responses: UserResponse[]) => {
    const personalityResult = calculatePersonalityType(responses);
    setResult(personalityResult);
    setAppState('results');
    setSubmitStatus('submitting');

    try {
      await submitSubmission({
        answers: responses.map(r => String(r.value)),
        scores: personalityResult.scores,
        result: personalityResult.type.code,
      });
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      console.error('Submit failed:', err);
    }
  };

  const handleRestart = () => {
    setAppState('welcome');
    setNickname('');
    setResult(null);
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundAnimation />
      <VersionCheck />
      
      {appState === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}
      
      {appState === 'questionnaire' && (
        <QuestionnaireScreen 
          questions={questions}
          onComplete={handleQuestionnaireComplete}
          nickname={nickname}
        />
      )}
      
      {appState === 'results' && result && (
        <ResultsScreen
          result={result}
          nickname={nickname}
          onRestart={handleRestart}
          submitStatus={submitStatus}
        />
      )}
    </div>
  );
}

export default App;