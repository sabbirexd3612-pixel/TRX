import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Globe,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../utils/translations';

interface WebSocketConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  customWsUrl: string;
  isCustomWsActive: boolean;
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  wsMessagesCount: number;
  lastWsMessage: any;
  onSaveAndConnect: (url: string) => void;
  onResetToDefault: () => void;
  language: Language;
}

const PRESET_URLS = [
  {
    name: 'Binance BTC/USDT (1m Kline)',
    nameBn: 'বাইনান্স BTC/USDT (১ মিনিট ক্যান্ডেল)',
    url: 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m',
  },
  {
    name: 'Binance ETH/USDT (1m Kline)',
    nameBn: 'বাইনান্স ETH/USDT (১ মিনিট ক্যান্ডেল)',
    url: 'wss://stream.binance.com:9443/ws/ethusdt@kline_1m',
  },
  {
    name: 'Binance SOL/USDT (1m Kline)',
    nameBn: 'বাইনান্স SOL/USDT (১ মিনিট ক্যান্ডেল)',
    url: 'wss://stream.binance.com:9443/ws/solusdt@kline_1m',
  },
  {
    name: 'Binance BTC/USDT (Live AggTrade)',
    nameBn: 'বাইনান্স BTC/USDT (রিয়েল-টাইম ট্রেড টিক)',
    url: 'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
  },
];

export const WebSocketConfigModal: React.FC<WebSocketConfigModalProps> = ({
  isOpen,
  onClose,
  customWsUrl,
  isCustomWsActive,
  wsStatus,
  wsMessagesCount,
  lastWsMessage,
  onSaveAndConnect,
  onResetToDefault,
  language,
}) => {
  const [inputUrl, setInputUrl] = useState(customWsUrl);
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onSaveAndConnect(inputUrl.trim());
  };

  const handleApplyPreset = (url: string) => {
    setInputUrl(url);
    onSaveAndConnect(url);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPreset(url);
    setTimeout(() => setCopiedPreset(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        id="websocket-config-modal-container"
        className="w-full max-w-xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#2962ff]/10 text-[#2962ff] border border-[#2962ff]/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {language === 'bn' ? 'কাস্টম ওয়েবসকেট API (WebSocket)' : 'Custom WebSocket API'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {language === 'bn'
                  ? 'আপনার API দিলেই সাথে সাথে চালু হবে এবং ব্রাউজারে সেভ থাকবে'
                  : 'Connect your real-time feed once, saved permanently in your browser'}
              </p>
            </div>
          </div>
          <button
            id="close-ws-modal-btn"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#252a37] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Live Status Card */}
          <div className="p-3.5 bg-[#131722] rounded-lg border border-[#2a2e39] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                    : wsStatus === 'connecting'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>
                    {wsStatus === 'connected'
                      ? language === 'bn'
                        ? 'সফলভাবে সংযুক্ত (Connected)'
                        : 'Active & Connected'
                      : wsStatus === 'connecting'
                      ? language === 'bn'
                        ? 'সংযুক্ত হচ্ছে... (Connecting)'
                        : 'Connecting...'
                      : language === 'bn'
                      ? 'সংযোগ নেই (Disconnected)'
                      : 'Disconnected'}
                  </span>
                  {isCustomWsActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/30 font-bold">
                      CUSTOM API
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {wsMessagesCount > 0
                    ? `${wsMessagesCount.toLocaleString()} ${
                        language === 'bn' ? 'টি মেসেজ প্রাপ্ত হয়েছে' : 'messages received'
                      }`
                    : language === 'bn'
                    ? 'মেসেজের জন্য অপেক্ষা করা হচ্ছে...'
                    : 'Awaiting data packets...'}
                </div>
              </div>
            </div>

            {isCustomWsActive && (
              <button
                id="reset-default-feed-btn"
                onClick={onResetToDefault}
                title={language === 'bn' ? 'ডিফল্ট ফিডে ফিরে যান' : 'Reset to default feed'}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ডিফল্ট ফিড' : 'Reset Default'}</span>
              </button>
            )}
          </div>

          {/* Form to Enter Custom WebSocket API */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label
                htmlFor="custom-ws-input"
                className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#2962ff]" />
                  <span>{language === 'bn' ? 'ওয়েবসকেট URL দিন (WebSocket Endpoint):' : 'WebSocket URL:'}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {language === 'bn' ? '✓ লোকাল স্টোরেজে সেভ থাকবে' : '✓ Auto-saved in browser'}
                </span>
              </label>
              <div className="relative">
                <input
                  id="custom-ws-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="wss://stream.binance.com:9443/ws/btcusdt@kline_1m অথবা আপনার API URL"
                  className="w-full bg-[#131722] border border-[#2a2e39] focus:border-[#2962ff] focus:ring-1 focus:ring-[#2962ff] text-white px-3.5 py-2.5 rounded-lg text-xs font-mono placeholder:text-gray-600 outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-gray-500 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'Binance Kline, Tick, Trade, Standard OHLCV JSON অথবা যে কোনো কাস্টম WebSocket ফর্ম্যাট সাপোর্টেড।'
                    : 'Supports Binance Kline, Trade ticks, standard OHLCV, or custom JSON streams.'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                id="save-and-connect-ws-btn"
                className="flex-1 flex items-center justify-center gap-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md active:scale-98 text-xs font-semibold"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {language === 'bn' ? 'সেভ করুন ও সাথে সাথে চালু করুন' : 'Save & Connect Immediately'}
                </span>
              </button>
            </div>
          </form>

          {/* Presets List */}
          <div className="space-y-2 pt-2 border-t border-[#2a2e39]">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {language === 'bn' ? 'এক ক্লিকে টেস্ট করার প্রিসেট (Presets):' : 'Quick Presets:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_URLS.map((preset) => (
                <div
                  key={preset.url}
                  className="p-2.5 bg-[#131722] hover:bg-[#171b26] border border-[#2a2e39] rounded-lg transition-colors flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200 text-[11px]">
                      {language === 'bn' ? preset.nameBn : preset.name}
                    </span>
                    <button
                      onClick={() => handleCopy(preset.url)}
                      title="Copy URL"
                      className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                    >
                      {copiedPreset === preset.url ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 truncate" title={preset.url}>
                    {preset.url}
                  </div>
                  <button
                    onClick={() => handleApplyPreset(preset.url)}
                    className="mt-1 w-full py-1 px-2 rounded bg-[#252a37] hover:bg-[#2962ff] text-gray-300 hover:text-white text-[10px] font-medium transition-colors text-center"
                  >
                    {language === 'bn' ? 'এটি কানেক্ট করুন' : 'Use this Preset'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Last Received Live Message Preview */}
          {lastWsMessage && (
            <div className="space-y-1.5 pt-2 border-t border-[#2a2e39]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bn' ? 'সর্বশেষ প্রাপ্ত ডেটা (Live JSON Feed):' : 'Latest Live WebSocket Message:'}
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <pre className="p-2.5 bg-[#0d1017] border border-[#2a2e39] rounded-lg text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-24">
                {typeof lastWsMessage === 'object'
                  ? JSON.stringify(lastWsMessage, null, 2)
                  : String(lastWsMessage)}
              </pre>
            </div>
          )}

          {/* Helpful Information Box */}
          <div className="p-3 bg-[#2962ff]/10 border border-[#2962ff]/30 rounded-lg text-[11px] text-gray-300 space-y-1">
            <div className="font-semibold text-[#2962ff] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'স্বয়ংক্রিয় সংরক্ষণ ব্যবস্থা' : 'Permanent Local Storage'}</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {language === 'bn'
                ? 'আপনার ওয়েবসকেট API একবার প্রবেশ করালে তা ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত থাকে। ভবিষ্যতে কোনো রিলোড বা নতুন সেশনে বারবার দেওয়া লাগবে না।'
                : 'Your WebSocket API is stored locally and will reconnect automatically upon subsequent visits without re-entry.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a2e39] bg-[#171b26] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#252a37] hover:bg-[#2a2e39] text-gray-300 text-xs font-medium transition-colors"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
