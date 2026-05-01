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
            职业锚测评
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            发现你的职业驱动力——基于 Schein 职业锚理论的 10 题快速测评
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mb-8 animate-slide-up">
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="flex items-center space-x-2 text-purple-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">10 道题</span>
            </div>
            <div className="flex items-center space-x-2 text-pink-600">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">3 分钟</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">8 种职业锚</span>
            </div>
          </div>

          {showConfig && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                后端 API 地址（ngrok / local）
              </label>
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBaseInput(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-yellow-300 focus:border-yellow-500 focus:outline-none transition-colors text-center mb-2"
                placeholder="https://abc123.ngrok.io"
              />
              <p className="text-xs text-yellow-600 mb-3">
                输入后端地址。本地开发使用 /api。
              </p>
              <button
                onClick={handleSaveApiBase}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                保存
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
                怎么称呼你？
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors text-lg text-center"
                placeholder="输入昵称"
                maxLength={20}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!hasApiBase()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>开始测评</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="text-sm text-gray-500 animate-fade-in-delay">
          <p>职业锚（Career Anchor）是 Edgar Schein 提出的概念，指一个人在职业选择中最不愿放弃的核心要素。本测评基于 8 种经典职业锚模型设计。</p>
        </div>
      </div>
    </div>
  );
};