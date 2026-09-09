import { Candle, TechnicalAnalysisSummary } from '../types';

export function calculateSMA(candles: Candle[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  result.push({ time: candles[period - 1].time, value: sum / period });

  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close;
    result.push({ time: candles[i].time, value: sum / period });
  }

  return result;
}

export function calculateEMA(candles: Candle[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (candles.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEMA = sum / period;
  result.push({ time: candles[period - 1].time, value: prevEMA });

  for (let i = period; i < candles.length; i++) {
    const currentEMA = (candles[i].close - prevEMA) * multiplier + prevEMA;
    result.push({ time: candles[i].time, value: currentEMA });
    prevEMA = currentEMA;
  }

  return result;
}

export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: { time: number; value: number }[];
  middle: { time: number; value: number }[];
  lower: { time: number; value: number }[];
} {
  const upper: { time: number; value: number }[] = [];
  const middle: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;
    const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = candles[i].time;
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + stdDevMultiplier * stdDev });
    lower.push({ time, value: mean - stdDevMultiplier * stdDev });
  }

  return { upper, middle, lower };
}

export function calculateRSI(candles: Candle[], period: number = 14): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: candles[period].time, value: rsi });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time, value: rsi });
  }

  return result;
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: { time: number; value: number }[];
  signalLine: { time: number; value: number }[];
  histogram: { time: number; value: number; color?: string }[];
} {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const macdLine: { time: number; value: number }[] = [];
  const slowMap = new Map(slowEMA.map(item => [item.time, item.value]));

  for (const fast of fastEMA) {
    if (slowMap.has(fast.time)) {
      macdLine.push({
        time: fast.time,
        value: fast.value - slowMap.get(fast.time)!,
      });
    }
  }

  if (macdLine.length < signalPeriod) {
    return { macdLine: [], signalLine: [], histogram: [] };
  }

  // Signal line is EMA of MACD Line
  const multiplier = 2 / (signalPeriod + 1);
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdLine[i].value;
  }
  let prevSignal = sum / signalPeriod;

  const signalLine: { time: number; value: number }[] = [
    { time: macdLine[signalPeriod - 1].time, value: prevSignal }
  ];

  for (let i = signalPeriod; i < macdLine.length; i++) {
    const currSignal = (macdLine[i].value - prevSignal) * multiplier + prevSignal;
    signalLine.push({ time: macdLine[i].time, value: currSignal });
    prevSignal = currSignal;
  }

  const signalMap = new Map(signalLine.map(s => [s.time, s.value]));
  const histogram: { time: number; value: number; color: string }[] = [];

  for (const m of macdLine) {
    if (signalMap.has(m.time)) {
      const sigVal = signalMap.get(m.time)!;
      const histVal = m.value - sigVal;
      histogram.push({
        time: m.time,
        value: histVal,
        color: histVal >= 0 ? '#26a69a' : '#ef5350',
      });
    }
  }

  return { macdLine, signalLine, histogram };
}

export function calculateVWAP(candles: Candle[]): { time: number; value: number }[] {
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  return candles.map(candle => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
    const vwap = cumulativeVolume > 0 ? cumulativeTypicalPriceVolume / cumulativeVolume : candle.close;
    return { time: candle.time, value: vwap };
  });
}

export function calculateHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const haCandles: Candle[] = [];

  let prevHAOpen = candles[0].open;
  let prevHAClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  haCandles.push({
    time: candles[0].time,
    open: prevHAOpen,
    high: candles[0].high,
    low: candles[0].low,
    close: prevHAClose,
    volume: candles[0].volume,
  });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = (prevHAOpen + prevHAClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });

    prevHAOpen = haOpen;
    prevHAClose = haClose;
  }

  return haCandles;
}

export function computeTechnicalSummary(candles: Candle[]): TechnicalAnalysisSummary {
  if (candles.length < 50) {
    return {
      oscillators: {
        rsi: { value: 50, action: 'neutral' },
        macd: { value: 0, action: 'neutral' },
        stochastic: { value: 50, action: 'neutral' },
      },
      movingAverages: {
        sma20: { value: 0, action: 'neutral' },
        ema50: { value: 0, action: 'neutral' },
        ema200: { value: 0, action: 'neutral' },
      },
      overallAction: 'Neutral',
      buyCount: 3,
      sellCount: 3,
      neutralCount: 6,
    };
  }

  const currentPrice = candles[candles.length - 1].close;

  // RSI
  const rsiData = calculateRSI(candles, 14);
  const rsiVal = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : 50;
  let rsiAction: 'buy' | 'sell' | 'neutral' = 'neutral';
  if (rsiVal < 30) rsiAction = 'buy';
  else if (rsiVal > 70) rsiAction = 'sell';

  // MACD
  const macdData = calculateMACD(candles);
  let macdAction: 'buy' | 'sell' | 'neutral' = 'neutral';
  let macdVal = 0;
  if (macdData.histogram.length > 0) {
    macdVal = macdData.histogram[macdData.histogram.length - 1].value;
    if (macdVal > 0) macdAction = 'buy';
    else if (macdVal < 0) macdAction = 'sell';
  }

  // Stochastic (Fast %K)
  const last14 = candles.slice(-14);
  const highestHigh = Math.max(...last14.map(c => c.high));
  const lowestLow = Math.min(...last14.map(c => c.low));
  const stochVal = highestHigh !== lowestLow ? ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100 : 50;
  let stochAction: 'buy' | 'sell' | 'neutral' = 'neutral';
  if (stochVal < 20) stochAction = 'buy';
  else if (stochVal > 80) stochAction = 'sell';

  // SMA 20
  const sma20Data = calculateSMA(candles, 20);
  const sma20Val = sma20Data.length > 0 ? sma20Data[sma20Data.length - 1].value : currentPrice;
  const sma20Action: 'buy' | 'sell' | 'neutral' = currentPrice > sma20Val ? 'buy' : 'sell';

  // EMA 50
  const ema50Data = calculateEMA(candles, Math.min(50, candles.length - 1));
  const ema50Val = ema50Data.length > 0 ? ema50Data[ema50Data.length - 1].value : currentPrice;
  const ema50Action: 'buy' | 'sell' | 'neutral' = currentPrice > ema50Val ? 'buy' : 'sell';

  // EMA 200 (or SMA 100 if candles < 200)
  const periodForLong = Math.min(100, candles.length - 1);
  const ema200Data = calculateEMA(candles, periodForLong);
  const ema200Val = ema200Data.length > 0 ? ema200Data[ema200Data.length - 1].value : currentPrice;
  const ema200Action: 'buy' | 'sell' | 'neutral' = currentPrice > ema200Val ? 'buy' : 'sell';

  const actions = [rsiAction, macdAction, stochAction, sma20Action, ema50Action, ema200Action];
  const buyCount = actions.filter(a => a === 'buy').length;
  const sellCount = actions.filter(a => a === 'sell').length;
  const neutralCount = actions.filter(a => a === 'neutral').length;

  let overallAction: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' = 'Neutral';
  if (buyCount >= 5) overallAction = 'Strong Buy';
  else if (buyCount >= 3 && buyCount > sellCount) overallAction = 'Buy';
  else if (sellCount >= 5) overallAction = 'Strong Sell';
  else if (sellCount >= 3 && sellCount > buyCount) overallAction = 'Sell';

  return {
    oscillators: {
      rsi: { value: rsiVal, action: rsiAction },
      macd: { value: macdVal, action: macdAction },
      stochastic: { value: stochVal, action: stochAction },
    },
    movingAverages: {
      sma20: { value: sma20Val, action: sma20Action },
      ema50: { value: ema50Val, action: ema50Action },
      ema200: { value: ema200Val, action: ema200Action },
    },
    overallAction,
    buyCount,
    sellCount,
    neutralCount,
  };
}
