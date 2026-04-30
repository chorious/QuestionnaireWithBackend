import React, { useState } from 'react';
import { ChevronRight, Sparkles, Brain, Heart, Settings } from 'lucide-react';
import { getApiBase, setApiBase, hasApiBase } from '../api/client';

interface WelcomeScreenProps {
  onStart: (nickname: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [nickname, setNickname] = useState('');
  const [apiBase, setApiBaseInput] = useState(getApiBase());
  const [showConfig, setShowConfig] = useState(!hasApiBase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onStart(nickname.trim());
    }
  };

  const handleSaveApiBase = () => {
    const trimmed = apiBase.trim();
    if (trimmed) {
      setApiBase(trimmed);
      setShowConfig(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Personality Discover
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            Unlock the secrets of your personality with our comprehensive
            Myers-Briggs Type Indicator assessment
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mb-8 animate-slide-up">
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="flex items-center space-x-2 text-purple-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">32 Questions</span>
            </div>
            <div className="flex items-center space-x-2 text-pink-600">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">5 Minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">16 Types</span>
            </div>
          </div>

          {showConfig && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                Backend API URL (ngrok / local)
              </label>
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBaseInput(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-yellow-300 focus:border-yellow-500 focus:outline-none transition-colors text-center mb-2"
                placeholder="https://abc123.ngrok.io"
              />
              <p className="text-xs text-yellow-600 mb-3">
                Enter your backend address. Use /api for local dev.
              </p>
              <button
                onClick={handleSaveApiBase}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Save
              </button>
            </div>
          )}

          {!showConfig && (
            <button
              onClick={() => setShowConfig(true)}
              className="mb-4 flex items-center justify-center space-x-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto"
            >
              <Settings className="w-4 h-4" />
              <span>API: {getApiBase() || 'not set'}</span>
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors text-lg text-center"
                placeholder="Enter your nickname"
                maxLength={20}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!hasApiBase()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Begin Your Journey</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="text-sm text-gray-500 animate-fade-in-delay">
          <p>This assessment will help you understand your personality preferences and how you interact with the world. <a href="https://github.com/Spandan-Bhattarai/Personality-Traits-Tester">Click here for the source code by Spandan</a></p>
        </div>
      </div>
    </div>
  );
};