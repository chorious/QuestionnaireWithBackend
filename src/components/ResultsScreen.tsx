import React, { useState } from 'react';
import { Share2, Download, RefreshCw, Twitter, Facebook, Linkedin } from 'lucide-react';
import { PersonalityResult } from '../types/personality';

interface ResultsScreenProps {
  result: PersonalityResult;
  nickname: string;
  onRestart: () => void;
  submitStatus?: 'idle' | 'submitting' | 'success' | 'error';
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  nickname,
  onRestart,
  submitStatus = 'idle',
}) => {
  const [showSharing, setShowSharing] = useState(false);

  const shareText = `I just discovered I'm ${result.type.name} (${result.type.code})! Find out your personality type too.`;
  const shareUrl = window.location.href;

  const handleShare = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Result Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Congratulations, {nickname}! 🎉
          </h2>
          <p className="text-gray-600">
            Your personality type has been revealed
          </p>
          {submitStatus === 'submitting' && (
            <p className="mt-2 text-sm text-blue-500">⏳ Saving result...</p>
          )}
          {submitStatus === 'success' && (
            <p className="mt-2 text-sm text-green-500">✅ Result saved!</p>
          )}
          {submitStatus === 'error' && (
            <p className="mt-2 text-sm text-red-500">❌ Save failed, please try again</p>
          )}
        </div>

        {/* Main Result Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mb-8 animate-slide-up">
          <div className="text-center mb-8">
            <div 
              className="inline-block p-6 rounded-full mb-4 text-6xl"
              style={{ backgroundColor: `${result.type.color}20` }}
            >
              {result.type.emoji}
            </div>
            <h3 className="text-4xl font-bold mb-2" style={{ color: result.type.color }}>
              {result.type.name}
            </h3>
            <div className="text-2xl font-mono font-bold text-gray-600 mb-4">
              {result.type.code}
            </div>
            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {result.type.description}
            </p>
          </div>

          {/* Traits Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-4">Key Traits</h4>
              <div className="space-y-2">
                {result.type.traits.map((trait, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 text-gray-700"
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: result.type.color }}
                    />
                    <span>{trait}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-4">Strengths</h4>
              <div className="space-y-2">
                {result.type.strengths.map((strength, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 text-gray-700"
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: result.type.color }}
                    />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Career Suggestions */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Career Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {result.type.careers.map((career, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: result.type.color }}
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          {/* Personality Dimensions */}
          <div className="border-t pt-8">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Your Personality Dimensions</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Energy</span>
                  <span className="text-sm text-gray-600">
                    {result.scores.EI >= 0 ? 'Extraverted' : 'Introverted'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.abs(result.scores.EI) * 10 + 50}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Information</span>
                  <span className="text-sm text-gray-600">
                    {result.scores.SN >= 0 ? 'Sensing' : 'Intuitive'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.abs(result.scores.SN) * 10 + 50}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Decisions</span>
                  <span className="text-sm text-gray-600">
                    {result.scores.TF >= 0 ? 'Thinking' : 'Feeling'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.abs(result.scores.TF) * 10 + 50}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Structure</span>
                  <span className="text-sm text-gray-600">
                    {result.scores.JP >= 0 ? 'Judging' : 'Perceiving'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.abs(result.scores.JP) * 10 + 50}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowSharing(!showSharing)}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Share2 className="w-5 h-5" />
            <span>Share Results</span>
          </button>
          
          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Take Again</span>
          </button>
        </div>

        {/* Sharing Options */}
        {showSharing && (
          <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl animate-slide-up">
            <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Share Your Results
            </h4>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-400 text-white rounded-xl hover:bg-blue-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span>Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-800 text-white rounded-xl hover:bg-blue-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};