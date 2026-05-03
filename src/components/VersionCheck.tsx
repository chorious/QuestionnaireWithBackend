import { useEffect, useState, useCallback } from 'react';
import { APP_VERSION, VERSION_CHECK_INTERVAL } from '../config/version';
import { checkVersion as apiCheckVersion } from '../api/client';

type CheckStage = 'outdated' | 'retrying' | 'retry_wait' | null;

const REFRESHED_KEY = 'version_check_refreshed';

export function VersionCheck() {
  const [stage, setStage] = useState<CheckStage>(null);
  const [countdown, setCountdown] = useState(10);

  const doCheck = useCallback(async () => {
    try {
      const backendVersion = await apiCheckVersion();
      if (!backendVersion || backendVersion === APP_VERSION) {
        setStage(null);
        return;
      }
      // Backend version differs from frontend
      const justRefreshed = sessionStorage.getItem(REFRESHED_KEY);
      if (justRefreshed) {
        sessionStorage.removeItem(REFRESHED_KEY);
        setStage('retrying');
        setCountdown(10);
      } else {
        setStage('outdated');
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    doCheck();
    const timer = setInterval(doCheck, VERSION_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [doCheck]);

  // Countdown for retrying state
  useEffect(() => {
    if (stage !== 'retrying') return;
    if (countdown <= 0) {
      setStage('outdated');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  const handleRefresh = () => {
    sessionStorage.setItem(REFRESHED_KEY, '1');
    window.location.reload();
  };

  if (!stage) return null;

  // Gray overlay: refresh failed, please retry later
  if (stage === 'retrying') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">刷新失败，请稍后再试</h2>
          <p className="text-gray-600 mb-6">
            新版本正在部署中，{countdown} 秒后将自动提示刷新。
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-800 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Outdated: prompt refresh
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">新版本可用</h2>
        <p className="text-gray-600 mb-6">
          系统已更新，请刷新页面以获取最新版本。
        </p>
        <button
          onClick={handleRefresh}
          className="w-full py-3 px-6 rounded-xl bg-blue-800 text-white font-bold text-lg hover:bg-blue-900 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          立即刷新
        </button>
      </div>
    </div>
  );
}
