import React, { useState, useEffect } from 'react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { Clock, ShieldCheck, Zap } from 'lucide-react';

interface BottomBarProps {
  language: Language;
}

export const BottomBar: React.FC<BottomBarProps> = ({ language }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const ranges = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

  return (
    <footer
      id="tradingview-bottombar"
      className="h-8 bg-[#171b26] border-t border-[#2a2e39] flex items-center justify-between px-3 text-[11px] text-gray-400 font-mono select-none z-20 shrink-0"
    >
      {/* Time ranges */}
      <div className="flex items-center gap-1">
        {ranges.map((r, i) => (
          <button
            key={r}
            id={`range-preset-${r}`}
            className={`px-2 py-0.5 rounded-sm hover:text-white hover:bg-[#1e222d] transition-colors ${
              i === 2 ? 'text-[#2962ff] font-semibold bg-[#2962ff]/10' : ''
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Center info */}
      <div className="hidden md:flex items-center gap-4 text-gray-500 font-sans text-[11px]">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {language === 'bn' ? 'মার্কেট রিয়েল-টাইম চালু' : 'Market Real-time 24/7'}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#2962ff]" />
          {language === 'bn' ? 'পাবলিক লাইভ স্ট্রিমিং ও টেকনিক্যাল ইঞ্জিন' : 'Public Live Stream & Technical Engine'}
        </span>
      </div>

      {/* Clock & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-gray-300">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>{currentTime || '00:00:00 UTC'}</span>
        </div>
      </div>
    </footer>
  );
};
