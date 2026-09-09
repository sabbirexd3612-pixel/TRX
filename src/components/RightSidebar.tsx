import React, { useState } from 'react';
import { MarketSymbol, OrderBookEntry, TechnicalAnalysisSummary } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { POPULAR_SYMBOLS } from '../services/marketData';
import {
  List,
  BookOpen,
  Gauge,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  XCircle,
} from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  amount: number;
  timestamp: number;
}

interface RightSidebarProps {
  selectedSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
  technicalSummary: TechnicalAnalysisSummary;
  language: Language;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedSymbol,
  onSelectSymbol,
  orderBook,
  technicalSummary,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'orderbook' | 'technical' | 'trading'>('watchlist');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [balance, setBalance] = useState(10000); // $10,000 virtual USDT
  const [tradeAmount, setTradeAmount] = useState('0.1');
  const [positions, setPositions] = useState<Position[]>([]);

  const t = TRANSLATIONS[language];

  const handleOpenPosition = (type: 'long' | 'short') => {
    const amt = parseFloat(tradeAmount);
    if (isNaN(amt) || amt <= 0) return;
    const cost = amt * selectedSymbol.price;
    if (cost > balance) return;

    const newPos: Position = {
      id: Math.random().toString(36).substring(7),
      symbol: selectedSymbol.id,
      type,
      entryPrice: selectedSymbol.price,
      amount: amt,
      timestamp: Date.now(),
    };

    setPositions([newPos, ...positions]);
  };

  const handleClosePosition = (pos: Position) => {
    const diff = pos.type === 'long'
      ? (selectedSymbol.price - pos.entryPrice) * pos.amount
      : (pos.entryPrice - selectedSymbol.price) * pos.amount;

    setBalance(prev => prev + diff);
    setPositions(positions.filter(p => p.id !== pos.id));
  };

  if (isCollapsed) {
    return (
      <div className="w-10 bg-[#171b26] border-l border-[#2a2e39] flex flex-col items-center py-2 shrink-0 select-none z-20">
        <button
          id="expand-sidebar-btn"
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202534] transition-colors"
          title="Expand panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      id="tradingview-right-sidebar"
      className="w-80 bg-[#171b26] border-l border-[#2a2e39] flex flex-col shrink-0 select-none z-20 overflow-hidden"
    >
      {/* Sidebar Tabs */}
      <div className="flex items-center justify-between border-b border-[#2a2e39] px-2 py-1.5 bg-[#131722]">
        <div className="flex items-center gap-1">
          <button
            id="tab-watchlist-btn"
            onClick={() => setActiveTab('watchlist')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-[#2962ff] text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
            title={t.watchlist}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            id="tab-orderbook-btn"
            onClick={() => setActiveTab('orderbook')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'orderbook'
                ? 'bg-[#2962ff] text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
            title={t.orderBook}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            id="tab-technical-btn"
            onClick={() => setActiveTab('technical')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'technical'
                ? 'bg-[#2962ff] text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
            title={t.technicalSummary}
          >
            <Gauge className="w-4 h-4" />
          </button>
          <button
            id="tab-trading-btn"
            onClick={() => setActiveTab('trading')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'trading'
                ? 'bg-[#2962ff] text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
            title={t.paperTrading}
          >
            <Wallet className="w-4 h-4" />
          </button>
        </div>

        <button
          id="collapse-sidebar-btn"
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#1e222d] transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content Panels */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* 1. WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
              <span>{t.watchlist}</span>
              <span>{POPULAR_SYMBOLS.length}</span>
            </div>

            <div className="space-y-1">
              {POPULAR_SYMBOLS.map((sym) => {
                const isSel = sym.id === selectedSymbol.id;
                const isPos = sym.change24h >= 0;
                return (
                  <div
                    key={sym.id}
                    id={`watchlist-item-${sym.id}`}
                    onClick={() => onSelectSymbol(sym)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                      isSel
                        ? 'bg-[#2962ff]/15 border-[#2962ff]/40 text-white'
                        : 'bg-[#1e222d]/60 border-transparent text-gray-300 hover:bg-[#1e222d]'
                    }`}
                  >
                    <div>
                      <div className="font-bold font-mono text-xs text-white">
                        {sym.baseAsset}/{sym.quoteAsset}
                      </div>
                      <div className="text-[10px] text-gray-400">{sym.name}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-medium text-gray-100">
                        ${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.precision })}
                      </div>
                      <div
                        className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPos ? '+' : ''}{sym.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ORDER BOOK */}
        {activeTab === 'orderbook' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between pb-1 text-gray-400 font-semibold uppercase tracking-wider text-[11px] font-sans">
              <span>{t.orderBook}</span>
              <span className="text-[10px] text-emerald-400">● LIVE</span>
            </div>

            <div className="grid grid-cols-3 text-gray-500 text-[10px] pb-1 border-b border-[#2a2e39]">
              <span>{t.price}</span>
              <span className="text-right">{t.amount}</span>
              <span className="text-right">{t.total}</span>
            </div>

            {/* Asks (Sell) */}
            <div className="space-y-0.5">
              {orderBook.asks.slice(-5).reverse().map((ask, idx) => {
                const depthPct = Math.min(100, (ask.total / 15) * 100);
                return (
                  <div
                    key={`ask-${idx}`}
                    className="grid grid-cols-3 py-0.5 px-1 relative text-[11px] overflow-hidden"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-rose-400 font-medium relative z-10">
                      {ask.price.toFixed(selectedSymbol.precision)}
                    </span>
                    <span className="text-right text-gray-300 relative z-10">{ask.amount.toFixed(2)}</span>
                    <span className="text-right text-gray-400 relative z-10">{ask.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Spread / Mid Price */}
            <div className="py-1.5 px-2 bg-[#131722] rounded-md flex items-center justify-between text-xs border border-[#2a2e39]">
              <span className="font-bold text-white text-sm">
                ${selectedSymbol.price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol.precision })}
              </span>
              <span className="text-[10px] text-gray-400 font-sans">Spread: 0.01%</span>
            </div>

            {/* Bids (Buy) */}
            <div className="space-y-0.5">
              {orderBook.bids.slice(0, 5).map((bid, idx) => {
                const depthPct = Math.min(100, (bid.total / 15) * 100);
                return (
                  <div
                    key={`bid-${idx}`}
                    className="grid grid-cols-3 py-0.5 px-1 relative text-[11px] overflow-hidden"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-emerald-400 font-medium relative z-10">
                      {bid.price.toFixed(selectedSymbol.precision)}
                    </span>
                    <span className="text-right text-gray-300 relative z-10">{bid.amount.toFixed(2)}</span>
                    <span className="text-right text-gray-400 relative z-10">{bid.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. TECHNICAL SUMMARY GAUGE */}
        {activeTab === 'technical' && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-xl bg-[#1e222d] border border-[#2a2e39]">
              <div className="text-gray-400 text-[11px] uppercase font-semibold mb-1">
                {t.overallRating}
              </div>
              <div
                className={`text-base font-bold uppercase tracking-wider mb-2 ${
                  technicalSummary.overallAction.includes('Buy')
                    ? 'text-emerald-400'
                    : technicalSummary.overallAction.includes('Sell')
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {technicalSummary.overallAction}
              </div>

              {/* Gauge Meter Bar */}
              <div className="h-2 w-full bg-[#131722] rounded-full overflow-hidden flex">
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${(technicalSummary.sellCount / 6) * 100}%` }}
                  title={`Sell signals: ${technicalSummary.sellCount}`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${(technicalSummary.neutralCount / 6) * 100}%` }}
                  title={`Neutral: ${technicalSummary.neutralCount}`}
                />
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(technicalSummary.buyCount / 6) * 100}%` }}
                  title={`Buy signals: ${technicalSummary.buyCount}`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                <span className="text-rose-400 font-bold">{technicalSummary.sellCount} Sell</span>
                <span className="text-amber-400">{technicalSummary.neutralCount} Neutral</span>
                <span className="text-emerald-400 font-bold">{technicalSummary.buyCount} Buy</span>
              </div>
            </div>

            {/* Oscillators Breakdown */}
            <div className="space-y-2">
              <div className="font-semibold text-gray-300 text-xs flex items-center justify-between">
                <span>{t.oscillators}</span>
              </div>
              <div className="space-y-1 bg-[#1e222d] p-2.5 rounded-lg border border-[#2a2e39]">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">RSI (14)</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-gray-200">{technicalSummary.oscillators.rsi.value.toFixed(1)}</span>
                    <span
                      className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-sm ${
                        technicalSummary.oscillators.rsi.action === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : technicalSummary.oscillators.rsi.action === 'sell'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {technicalSummary.oscillators.rsi.action}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">MACD (12, 26)</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-gray-200">{technicalSummary.oscillators.macd.value.toFixed(2)}</span>
                    <span
                      className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-sm ${
                        technicalSummary.oscillators.macd.action === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : technicalSummary.oscillators.macd.action === 'sell'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {technicalSummary.oscillators.macd.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Moving Averages Breakdown */}
            <div className="space-y-2">
              <div className="font-semibold text-gray-300 text-xs flex items-center justify-between">
                <span>{t.movingAverages}</span>
              </div>
              <div className="space-y-1 bg-[#1e222d] p-2.5 rounded-lg border border-[#2a2e39]">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">SMA (20)</span>
                  <span
                    className={`font-mono font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-sm ${
                      technicalSummary.movingAverages.sma20.action === 'buy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {technicalSummary.movingAverages.sma20.action}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">EMA (50)</span>
                  <span
                    className={`font-mono font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-sm ${
                      technicalSummary.movingAverages.ema50.action === 'buy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {technicalSummary.movingAverages.ema50.action}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">EMA (200)</span>
                  <span
                    className={`font-mono font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-sm ${
                      technicalSummary.movingAverages.ema200.action === 'buy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {technicalSummary.movingAverages.ema200.action}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PAPER TRADING */}
        {activeTab === 'trading' && (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="p-3 bg-[#1e222d] rounded-xl border border-[#2a2e39] space-y-1">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">{t.balance}</div>
              <div className="text-lg font-bold font-mono text-white">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </div>
            </div>

            {/* Quick Buy / Sell */}
            <div className="space-y-2">
              <label className="text-gray-400 text-[11px] block">{t.amount} ({selectedSymbol.baseAsset})</label>
              <input
                id="trade-amount-input"
                type="number"
                step="0.01"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-[#2962ff]"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="trade-buy-btn"
                  onClick={() => handleOpenPosition('long')}
                  className="py-2.5 px-3 bg-[#089981] hover:bg-[#07836f] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  {t.buy} / Long
                </button>
                <button
                  id="trade-sell-btn"
                  onClick={() => handleOpenPosition('short')}
                  className="py-2.5 px-3 bg-[#f23645] hover:bg-[#d82a39] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <TrendingDown className="w-4 h-4" />
                  {t.sell} / Short
                </button>
              </div>
            </div>

            {/* Open Positions */}
            <div className="space-y-2 pt-2 border-t border-[#2a2e39]">
              <div className="flex justify-between items-center text-gray-400 font-semibold text-[11px]">
                <span>{t.openPositions}</span>
                <span>({positions.length})</span>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  {language === 'bn' ? 'কোন সক্রিয় পজিশন নেই' : 'No active positions'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {positions.map((pos) => {
                    const pnl = pos.type === 'long'
                      ? (selectedSymbol.price - pos.entryPrice) * pos.amount
                      : (pos.entryPrice - selectedSymbol.price) * pos.amount;
                    const pnlPct = (pnl / (pos.entryPrice * pos.amount)) * 100;
                    const isProfitable = pnl >= 0;

                    return (
                      <div
                        key={pos.id}
                        className="p-2 bg-[#1e222d] border border-[#2a2e39] rounded-lg space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                                pos.type === 'long'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {pos.type}
                            </span>
                            <span className="font-mono font-bold text-xs text-white">
                              {pos.amount} {selectedSymbol.baseAsset}
                            </span>
                          </div>
                          <button
                            onClick={() => handleClosePosition(pos)}
                            className="text-gray-400 hover:text-rose-400 p-0.5 transition-colors"
                            title={t.closePosition}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center font-mono text-[11px]">
                          <span className="text-gray-400">Entry: ${pos.entryPrice.toFixed(selectedSymbol.precision)}</span>
                          <span
                            className={`font-bold ${
                              isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfitable ? '+' : ''}${pnl.toFixed(2)} ({isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
