import { useEffect, useState } from 'react';
import { APP_VERSION, VERSION_CHECK_INTERVAL } from '../config/version';
import { checkVersion as apiCheckVersion } from '../api/client';

export function VersionCheck() {
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    const doCheck = async () => {
      try {
        const version = await apiCheckVersion();
        if (version && version !== APP_VERSION) {
          setOutdated(true);
        }
      } catch {
        // ignore network errors
      }
    };

    doCheck();
    const timer = setInterval(doCheck, VERSION_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  if (!outdated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">新版本可用</h2>
        <p className="text-gray-600 mb-6">
          系统已更新，请刷新页面以获取最新版本。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          立即刷新
        </button>
      </div>
    </div>
  );
}
