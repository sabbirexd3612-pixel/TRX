export type Timeframe = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar' | 'heikinAshi';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSymbol {
  id: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  category: 'crypto' | 'forex' | 'indices' | 'commodities';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  binanceSymbol?: string;
  precision: number;
}

export type DrawingToolType = 
  | 'cursor' 
  | 'trendline' 
  | 'horizontal' 
  | 'fibonacci' 
  | 'rectangle' 
  | 'position' 
  | 'measure' 
  | 'eraser';

export interface Point {
  time: number;
  price: number;
  x?: number;
  y?: number;
}

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  points: Point[];
  color?: string;
  lineWidth?: number;
  extra?: {
    stopLoss?: number;
    takeProfit?: number;
    entryPrice?: number;
    direction?: 'long' | 'short';
    label?: string;
  };
}

export interface IndicatorConfig {
  id: string;
  name: string;
  nameBn: string;
  enabled: boolean;
  color: string;
  period?: number;
  period2?: number;
  signalPeriod?: number;
  stdDev?: number;
  category: 'overlay' | 'oscillator';
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface TechnicalAnalysisSummary {
  oscillators: {
    rsi: { value: number; action: 'buy' | 'sell' | 'neutral' };
    macd: { value: number; action: 'buy' | 'sell' | 'neutral' };
    stochastic: { value: number; action: 'buy' | 'sell' | 'neutral' };
  };
  movingAverages: {
    sma20: { value: number; action: 'buy' | 'sell' | 'neutral' };
    ema50: { value: number; action: 'buy' | 'sell' | 'neutral' };
    ema200: { value: number; action: 'buy' | 'sell' | 'neutral' };
  };
  overallAction: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  buyCount: number;
  sellCount: number;
  neutralCount: number;
}
