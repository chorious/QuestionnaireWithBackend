import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link2, RefreshCw, Download, Copy, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
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
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const shareCardRef = useRef<HTMLDivElement>(null);

  const shareUrl = window.location.href;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 100, margin: 1, color: { dark: '#1e40af', light: '#ffffff' } })
      .then(setQrCode)
      .catch(console.error);
  }, [shareUrl]);

  const copyToClipboard = async () => {
    const text = `我的职业锚测评结果：${result.type.name}！${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      alert('链接已复制到剪贴板！');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateShareImage = useCallback(async () => {
    if (!shareCardRef.current) return;
    if (!qrCode) {
      alert('二维码生成中，请稍后再试');
      return;
    }
    setGenerating(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error('生成分享图失败:', err);
      alert('生成图片失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [qrCode]);

  const downloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `职业锚测评_${nickname}_${result.type.name}.png`;
    link.href = previewUrl;
    link.click();
  };

  const copyImageToClipboard = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('图片已复制到剪贴板！');
    } catch (err) {
      console.error('复制图片失败:', err);
      alert('复制失败，请尝试保存后手动复制');
    }
  };

  const maxScore = Math.max(...ANCHOR_ORDER.map((c) => result.scores[c] ?? 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hidden Share Card for screenshot */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ShareCard ref={shareCardRef} result={result} nickname={nickname} maxScore={maxScore} qrCode={qrCode} />
        </div>

        {/* Image Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-card p-5 sm:p-6 w-[85vw] max-w-[300px] sm:max-w-[320px] shadow-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">分享图预览</h3>
                <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img src={previewUrl} alt="分享图" className="w-full rounded-card mb-3 sm:mb-4 border border-gray-100 max-h-[50vh] object-contain" />
              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-800 text-white rounded-control font-semibold hover:bg-blue-900 transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>保存本地</span>
                </button>
                <button
                  onClick={copyImageToClipboard}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white text-blue-800 border border-blue-200 rounded-control font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            恭喜，{nickname}！
          </h2>
          <p className="text-gray-600">你的职业锚已揭晓</p>
          {submitStatus === 'submitting' && (
            <p className="mt-3 inline-block text-sm text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-control">
              正在保存结果
            </p>
          )}
          {submitStatus === 'success' && (
            <p className="mt-3 inline-block text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-control">
              结果已保存
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="mt-3 inline-block text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-control">
              保存失败，请重试
            </p>
          )}
        </div>

        {/* Main Result Card */}
        <div className="bg-white rounded-card p-8 shadow-lg border border-gray-100 mb-8 animate-slide-up">
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
          {result.secondaryType !== null && result.secondaryType && (
            <div className="border-t pt-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  你是「双锚型」，同时具有两种核心驱动力：
                </p>
                <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-card px-6 py-4">
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
            onClick={generateShareImage}
            disabled={generating}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-800 text-white rounded-control font-semibold hover:bg-blue-900 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{generating ? '生成中...' : '保存分享图'}</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-blue-800 border border-blue-200 rounded-control font-semibold hover:bg-blue-50 transition-colors"
          >
            <Link2 className="w-5 h-5" />
            <span>分享链接</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-8 py-4 text-gray-600 rounded-control font-semibold hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>再测一次</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hidden card used for html-to-image capture
const ShareCard = React.forwardRef<HTMLDivElement, {
  result: CareerAnchorResult;
  nickname: string;
  maxScore: number;
  qrCode: string;
}>(({ result, nickname, maxScore, qrCode }, ref) => {
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

      {/* QR Code */}
      {qrCode && (
        <div style={{ background: '#f8fafc', padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>扫码测测你的职业锚</div>
          <img src={qrCode} alt="二维码" style={{ width: '100px', height: '100px', margin: '0 auto', display: 'block' }} />
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{window.location.origin}</div>
        </div>
      )}
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
