import { Candle, MarketSymbol, OrderBookEntry, Timeframe } from '../types';

export const POPULAR_SYMBOLS: MarketSymbol[] = [
  {
    id: 'BTCUSDT',
    name: 'Bitcoin / Tether US',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    category: 'crypto',
    price: 89450.25,
    change24h: 3.42,
    high24h: 91200.0,
    low24h: 86500.0,
    volume24h: 245120.5,
    binanceSymbol: 'btcusdt',
    precision: 2,
  },
  {
    id: 'ETHUSDT',
    name: 'Ethereum / Tether US',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    category: 'crypto',
    price: 3340.8,
    change24h: -1.15,
    high24h: 3450.0,
    low24h: 3280.0,
    volume24h: 532010.8,
    binanceSymbol: 'ethusdt',
    precision: 2,
  },
  {
    id: 'SOLUSDT',
    name: 'Solana / Tether US',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    category: 'crypto',
    price: 184.65,
    change24h: 6.78,
    high24h: 191.5,
    low24h: 172.1,
    volume24h: 1892040.0,
    binanceSymbol: 'solusdt',
    precision: 2,
  },
  {
    id: 'BNBUSDT',
    name: 'BNB / Tether US',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    category: 'crypto',
    price: 642.3,
    change24h: 0.85,
    high24h: 655.0,
    low24h: 635.0,
    volume24h: 142050.2,
    binanceSymbol: 'bnbusdt',
    precision: 2,
  },
  {
    id: 'XRPUSDT',
    name: 'Ripple / Tether US',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    category: 'crypto',
    price: 2.385,
    change24h: 8.92,
    high24h: 2.55,
    low24h: 2.15,
    volume24h: 14502300.0,
    binanceSymbol: 'xrpusdt',
    precision: 4,
  },
  {
    id: 'XAUUSD',
    name: 'Gold / US Dollar',
    baseAsset: 'XAU',
    quoteAsset: 'USD',
    category: 'commodities',
    price: 2912.4,
    change24h: 0.74,
    high24h: 2928.0,
    low24h: 2895.5,
    volume24h: 89400.0,
    precision: 2,
  },
  {
    id: 'EURUSD',
    name: 'Euro / US Dollar',
    baseAsset: 'EUR',
    quoteAsset: 'USD',
    category: 'forex',
    price: 1.0825,
    change24h: -0.22,
    high24h: 1.087,
    low24h: 1.0805,
    volume24h: 4200000.0,
    precision: 4,
  },
  {
    id: 'NDX',
    name: 'Nasdaq 100 Index',
    baseAsset: 'NDX',
    quoteAsset: 'USD',
    category: 'indices',
    price: 20840.15,
    change24h: 1.35,
    high24h: 20950.0,
    low24h: 20680.0,
    volume24h: 310500.0,
    precision: 2,
  },
  {
    id: 'NVDA',
    name: 'NVIDIA Corporation',
    baseAsset: 'NVDA',
    quoteAsset: 'USD',
    category: 'indices',
    price: 138.25,
    change24h: 2.45,
    high24h: 141.2,
    low24h: 135.5,
    volume24h: 42100000.0,
    precision: 2,
  },
  {
    id: 'TSLA',
    name: 'Tesla, Inc.',
    baseAsset: 'TSLA',
    quoteAsset: 'USD',
    category: 'indices',
    price: 265.4,
    change24h: 4.12,
    high24h: 271.0,
    low24h: 258.0,
    volume24h: 28900000.0,
    precision: 2,
  },
];

export function timeframeToSeconds(tf: Timeframe): number {
  switch (tf) {
    case '1s': return 1;
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '1h': return 3600;
    case '4h': return 14400;
    case '1D': return 86400;
    case '1W': return 604800;
    default: return 60;
  }
}

export function timeframeToBinanceInterval(tf: Timeframe): string {
  switch (tf) {
    case '1s': return '1s';
    case '1m': return '1m';
    case '5m': return '5m';
    case '15m': return '15m';
    case '1h': return '1h';
    case '4h': return '4h';
    case '1D': return '1d';
    case '1W': return '1w';
    default: return '1m';
  }
}

// Generate realistic starting historical candles
export function generateInitialCandles(
  basePrice: number,
  count: number = 200,
  timeframe: Timeframe = '1m'
): Candle[] {
  const candles: Candle[] = [];
  const intervalSeconds = timeframeToSeconds(timeframe);
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * intervalSeconds;

  let currentPrice = basePrice * 0.95; // start slightly offset
  const volatility = basePrice * 0.003;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalSeconds;
    const randomWalk = (Math.random() - 0.49) * volatility;
    const open = currentPrice;
    const close = Math.max(open * 0.5, open + randomWalk);
    const high = Math.max(open, close) + Math.random() * volatility * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * 0.8;
    const volume = Math.floor(Math.random() * 50 + 10) * (basePrice > 1000 ? 0.5 : 50);

    candles.push({
      time,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: Number(volume.toFixed(2)),
    });

    currentPrice = close;
  }

  return candles;
}

// Order book generator
export function generateOrderBook(currentPrice: number, precision: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  const step = Math.pow(10, -precision) * 10;

  let bidTotal = 0;
  for (let i = 1; i <= 8; i++) {
    const price = currentPrice - i * step;
    const amount = Number((Math.random() * 2 + 0.1).toFixed(3));
    bidTotal += amount;
    bids.push({
      price: Number(price.toFixed(precision)),
      amount,
      total: Number(bidTotal.toFixed(3)),
    });
  }

  let askTotal = 0;
  for (let i = 1; i <= 8; i++) {
    const price = currentPrice + i * step;
    const amount = Number((Math.random() * 2 + 0.1).toFixed(3));
    askTotal += amount;
    asks.push({
      price: Number(price.toFixed(precision)),
      amount,
      total: Number(askTotal.toFixed(3)),
    });
  }

  return { bids, asks };
}
