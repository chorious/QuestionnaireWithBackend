import React, { useState, useRef, useCallback } from 'react';
import { Share2, RefreshCw, Download, Link2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CareerAnchorResult, CareerAnchor } from '../types/personality';
import { careerAnchors } from '../data/personalityTypes';

interface ResultsScreenProps {
  result: CareerAnchorResult;
  nickname: string;
  onRestart: () => void;
  submitStatus?: 'idle' | 'submitting' | 'success' | 'error';
}

const ANCHOR_ORDER = ['TF', 'GM', 'AU', 'SE', 'EC', 'SV', 'CH', 'LS'];

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  nickname,
  onRestart,
  submitStatus = 'idle',
}) => {
  const [showSharing, setShowSharing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const isDual = result.secondaryType !== null;
  const shareText = isDual
    ? `我的职业锚是「${result.type.name} + ${result.secondaryType!.name}」！来测测你的职业锚是什么？`
    : `我的职业锚是「${result.type.name}」！来测测你的职业锚是什么？`;
  const shareUrl = window.location.href;

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '职业锚测评',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('已复制到剪贴板！');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToWechat = () => {
    alert('请长按保存分享图，发送给微信好友或分享到朋友圈');
  };

  const shareToQQ = () => {
    const url = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const shareToQZone = () => {
    const url = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&otype=share`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const shareToXiaohongshu = () => {
    alert('请保存分享图，打开小红书 APP 发布笔记');
  };

  const generateShareImage = useCallback(async () => {
    if (!shareCardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `职业锚测评_${nickname}_${result.type.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('生成分享图失败:', err);
      alert('生成图片失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [nickname, result.type.name]);

  const maxScore = Math.max(...ANCHOR_ORDER.map((c) => result.scores[c] ?? 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hidden Share Card for screenshot */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ShareCard ref={shareCardRef} result={result} nickname={nickname} maxScore={maxScore} />
        </div>

        {/* Result Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            恭喜，{nickname}！
          </h2>
          <p className="text-gray-600">你的职业锚已揭晓</p>
          {submitStatus === 'submitting' && (
            <p className="mt-2 text-sm text-blue-500">⏳ 正在保存结果...</p>
          )}
          {submitStatus === 'success' && (
            <p className="mt-2 text-sm text-green-500">✅ 结果已保存！</p>
          )}
          {submitStatus === 'error' && (
            <p className="mt-2 text-sm text-red-500">❌ 保存失败，请重试</p>
          )}
        </div>

        {/* Main Result Card */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 mb-8 animate-slide-up">
          {/* Primary Type */}
          <div className="text-center mb-8">
            <div
              className="inline-block p-6 rounded-full mb-4 text-6xl"
              style={{ backgroundColor: `${result.type.color}20` }}
            >
              {result.type.emoji}
            </div>
            <h3
              className="text-4xl font-bold mb-2"
              style={{ color: result.type.color }}
            >
              {result.type.name}
            </h3>
            <p className="text-lg text-gray-500 mb-2">
              {result.type.englishName}
            </p>
            <div className="text-2xl font-mono font-bold text-gray-600 mb-4">
              {result.primary}
            </div>
            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {result.type.description}
            </p>
          </div>

          {/* Secondary Type (if dual) */}
          {isDual && result.secondaryType && (
            <div className="border-t pt-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  你是「双锚型」，同时具有两种核心驱动力：
                </p>
                <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-2xl px-6 py-4">
                  <AnchorBadge anchor={result.type} />
                  <span className="text-2xl text-gray-400">+</span>
                  <AnchorBadge anchor={result.secondaryType} />
                </div>
              </div>
            </div>
          )}

          {/* Traits */}
          <div className="border-t pt-8 mb-8">
            <h4 className="text-xl font-bold text-gray-800 mb-4">核心特征</h4>
            <div className="flex flex-wrap gap-2">
              {result.type.traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: result.type.color }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Career Suggestions */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-800 mb-4">适合的职业方向</h4>
            <div className="flex flex-wrap gap-2">
              {result.type.careers.map((career, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          {/* Score Distribution */}
          <div className="border-t pt-8">
            <h4 className="text-xl font-bold text-gray-800 mb-4">
              8 种职业锚得分分布
            </h4>
            <div className="space-y-3">
              {ANCHOR_ORDER.map((code) => {
                const anchor = careerAnchors.find((a) => a.code === code)!;
                const score = result.scores[code] ?? 0;
                const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                const isTop = score === maxScore && maxScore > 0;
                return (
                  <ScoreBar
                    key={code}
                    anchor={anchor}
                    score={score}
                    pct={pct}
                    isTop={isTop}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowSharing(!showSharing)}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            <span>分享结果</span>
          </button>

          <button
            onClick={generateShareImage}
            disabled={generating}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{generating ? '生成中...' : '保存分享图'}</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5" />
            <span>再测一次</span>
          </button>
        </div>

        {/* Sharing Options */}
        {showSharing && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-slide-up">
            <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
              分享你的职业锚
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={shareToWechat}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-[#07C160] text-white rounded-xl hover:bg-[#06a050] transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.016 18.115 24 16.405 24 14.479c0-3.197-3.098-5.621-7.062-5.621zm-2.36 2.63c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.72 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>
                <span>微信好友</span>
              </button>

              <button
                onClick={shareToWechat}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-[#07C160] text-white rounded-xl hover:bg-[#06a050] transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/></svg>
                <span>朋友圈</span>
              </button>

              <button
                onClick={shareToQQ}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-[#12B7F5] text-white rounded-xl hover:bg-[#0e9ad1] transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5h-7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm0-4h-7c-.83 0-1.5-.67-1.5-1.5S7.67 9.5 8.5 9.5h7c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                <span>QQ好友</span>
              </button>

              <button
                onClick={shareToQZone}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-[#FFC300] text-gray-900 rounded-xl hover:bg-[#e6b000] transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>QQ空间</span>
              </button>

              <button
                onClick={shareToXiaohongshu}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-[#FF2442] text-white rounded-xl hover:bg-[#e01f3a] transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14h-9a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5z"/></svg>
                <span>小红书</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                <Link2 className="w-5 h-5" />
                <span>复制链接</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hidden card used for html-to-image capture
const ShareCard = React.forwardRef<HTMLDivElement, {
  result: CareerAnchorResult;
  nickname: string;
  maxScore: number;
}>(({ result, nickname, maxScore }, ref) => {
  const isDual = result.secondaryType !== null;

  return (
    <div
      ref={ref}
      style={{
        width: '375px',
        background: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1e293b',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', letterSpacing: '2px', marginBottom: '4px' }}>CAREER ANCHOR</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>职业锚测评</div>
      </div>

      {/* User & Result */}
      <div style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
          {nickname} 的测评结果
        </div>
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>{result.type.emoji}</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: result.type.color, marginBottom: '4px' }}>
          {result.type.name}
        </div>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
          {result.type.englishName}
        </div>
        {isDual && result.secondaryType && (
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
            双锚型：{result.type.name} + {result.secondaryType.name}
          </div>
        )}
        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
          {result.type.description}
        </div>
      </div>

      {/* Score Distribution */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>8 种职业锚得分</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ANCHOR_ORDER.map((code) => {
            const anchor = careerAnchors.find((a) => a.code === code)!;
            const score = result.scores[code] ?? 0;
            const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const isTop = score === maxScore && maxScore > 0;
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{anchor.emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', width: '28px', color: anchor.color }}>{code}</span>
                <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: anchor.color, borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', width: '16px', textAlign: 'right', color: isTop ? anchor.color : '#64748b' }}>{score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Careers */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>适合的职业方向</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {result.type.careers.slice(0, 6).map((career, i) => (
            <span key={i} style={{ fontSize: '12px', padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              {career}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#f8fafc', padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>扫码测测你的职业锚</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{window.location.origin}</div>
      </div>
    </div>
  );
});

function AnchorBadge({ anchor }: { anchor: CareerAnchor }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-2xl">{anchor.emoji}</span>
      <div>
        <div className="font-bold" style={{ color: anchor.color }}>
          {anchor.name}
        </div>
        <div className="text-xs text-gray-500">{anchor.englishName}</div>
      </div>
    </div>
  );
}

function ScoreBar({
  anchor,
  score,
  pct,
  isTop,
}: {
  anchor: CareerAnchor;
  score: number;
  pct: number;
  isTop: boolean;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 text-center text-lg">{anchor.emoji}</div>
      <div className="w-16 font-bold text-sm" style={{ color: anchor.color }}>
        {anchor.code}
      </div>
      <div className="flex-1">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(pct, 5)}%`,
              backgroundColor: anchor.color,
            }}
          />
        </div>
      </div>
      <div className="w-8 text-right font-bold text-sm text-gray-700">
        {score}
      </div>
      {isTop && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          TOP
        </span>
      )}
    </div>
  );
}
