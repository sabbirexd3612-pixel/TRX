import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  AreaSeries,
  BarSeries,
  Time,
} from 'lightweight-charts';
import { Candle, ChartType, DrawingItem, DrawingToolType, IndicatorConfig, Point, Timeframe } from '../types';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  calculateHeikinAshi,
} from '../utils/indicators';
import { Language, TRANSLATIONS } from '../utils/translations';
import { Eye, EyeOff, Layers, Trash2, Clock, Hourglass } from 'lucide-react';
import { timeframeToSeconds } from '../services/marketData';

interface ChartContainerProps {
  candles: Candle[];
  chartType: ChartType;
  indicators: IndicatorConfig[];
  activeTool: DrawingToolType;
  drawings: DrawingItem[];
  onAddDrawing: (drawing: DrawingItem) => void;
  onRemoveDrawing: (id: string) => void;
  language: Language;
  precision: number;
  timeframe?: Timeframe;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  candles,
  chartType,
  indicators,
  activeTool,
  drawings,
  onAddDrawing,
  onRemoveDrawing,
  language,
  precision,
  timeframe = '1m',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentChartTypeRef = useRef<ChartType | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const lastCandlesCountRef = useRef<number>(0);

  // Drawing state
  const [drawingStartPoint, setDrawingStartPoint] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
  const [chartViewTrigger, setChartViewTrigger] = useState(0);

  // Real-time Candle Countdown Timer
  const tfSeconds = useMemo(() => timeframeToSeconds((timeframe || '1m') as Timeframe), [timeframe]);
  const [countdown, setCountdown] = useState<string>('');

  // Crosshair / Legend hover info
  const [legendInfo, setLegendInfo] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePct: number;
  } | null>(null);

  const t = TRANSLATIONS[language];

  // Active indicators config
  const enabledIndicators = useMemo(() => indicators.filter((i) => i.enabled), [indicators]);
  const isRsiEnabled = useMemo(() => enabledIndicators.some((i) => i.id === 'rsi'), [enabledIndicators]);
  const isMacdEnabled = useMemo(() => enabledIndicators.some((i) => i.id === 'macd'), [enabledIndicators]);

  // Transform candles if Heikin-Ashi
  const displayCandles = useMemo(() => {
    if (chartType === 'heikinAshi') {
      return calculateHeikinAshi(candles);
    }
    return candles;
  }, [candles, chartType]);

  // Live Candle Bar Close Countdown Timer Loop
  useEffect(() => {
    const updateCountdown = () => {
      if (displayCandles.length === 0) return;
      const last = displayCandles[displayCandles.length - 1];
      const nowSec = Math.floor(Date.now() / 1000);
      const nextCandleTime = last.time + tfSeconds;
      const rem = Math.max(0, nextCandleTime - nowSec);

      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [displayCandles, tfSeconds]);

  // Candle Time Formatter (UTC & local readable)
  const formatCandleTime = useCallback((timeInSec?: number) => {
    if (!timeInSec) return '--';
    const date = new Date(timeInSec * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }, []);

  // 1. Initialize Main Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#9b9eb5',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'IBM Plex Sans', monospace",
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2962ff',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#2a2e39',
        barSpacing: 10,
        minBarSpacing: 4,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave room for volume at bottom
        },
      },
    });

    mainChartRef.current = chart;

    // Listen to time range changes to re-project drawings
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      setChartViewTrigger((prev) => prev + 1);
    });

    // Crosshair move listener for Legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || !mainSeriesRef.current) {
        if (displayCandles.length > 0) {
          const last = displayCandles[displayCandles.length - 1];
          const chg = last.close - last.open;
          setLegendInfo({
            time: last.time,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume,
            change: chg,
            changePct: (chg / last.open) * 100,
          });
        }
        return;
      }

      const barData: any = param.seriesData.get(mainSeriesRef.current);
      if (barData) {
        const o = barData.open !== undefined ? barData.open : barData.value;
        const h = barData.high !== undefined ? barData.high : barData.value;
        const l = barData.low !== undefined ? barData.low : barData.value;
        const c = barData.close !== undefined ? barData.close : barData.value;
        const vol = barData.volume || 0;
        const chg = c - o;
        setLegendInfo({
          time: param.time as number,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: vol,
          change: chg,
          changePct: o !== 0 ? (chg / o) * 100 : 0,
        });
      }
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !containerRef.current) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      setChartViewTrigger((prev) => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mainChartRef.current) {
        try {
          mainChartRef.current.remove();
        } catch {}
        mainChartRef.current = null;
      }
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      currentChartTypeRef.current = null;
      indicatorSeriesRef.current.clear();
    };
  }, []);

  // 2. Add / Update Main Series (Candlestick, Line, Area, etc.)
  useEffect(() => {
    const chart = mainChartRef.current;
    if (!chart || displayCandles.length === 0) return;

    const validCandles = displayCandles.filter(
      (c) =>
        c &&
        c.time !== undefined &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );
    if (validCandles.length === 0) return;

    // Check if series type needs to be changed
    const needsNewSeries = !mainSeriesRef.current || currentChartTypeRef.current !== chartType;

    if (needsNewSeries) {
      if (mainSeriesRef.current) {
        try {
          chart.removeSeries(mainSeriesRef.current);
        } catch {}
        mainSeriesRef.current = null;
      }

      let series: ISeriesApi<any>;

      if (chartType === 'candlestick' || chartType === 'heikinAshi') {
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderUpColor: '#089981',
          borderDownColor: '#f23645',
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
        });
      } else if (chartType === 'bar') {
        series = chart.addSeries(BarSeries, {
          upColor: '#089981',
          downColor: '#f23645',
        });
      } else if (chartType === 'area') {
        series = chart.addSeries(AreaSeries, {
          topColor: 'rgba(41, 98, 255, 0.4)',
          bottomColor: 'rgba(41, 98, 255, 0.02)',
          lineColor: '#2962ff',
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(LineSeries, {
          color: '#2962ff',
          lineWidth: 2,
        });
      }

      mainSeriesRef.current = series;
      currentChartTypeRef.current = chartType;
    }

    const lastValidCandle = validCandles[validCandles.length - 1];
    const prevCount = lastCandlesCountRef.current;
    lastCandlesCountRef.current = validCandles.length;

    if (mainSeriesRef.current) {
      if (needsNewSeries || prevCount !== validCandles.length) {
        if (chartType === 'candlestick' || chartType === 'heikinAshi' || chartType === 'bar') {
          mainSeriesRef.current.setData(
            validCandles.map((c) => ({
              time: c.time as Time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
          );
        } else {
          mainSeriesRef.current.setData(
            validCandles.map((c) => ({
              time: c.time as Time,
              value: c.close,
            }))
          );
        }
      } else {
        // High frequency smooth O(1) in-place tick update
        try {
          if (chartType === 'candlestick' || chartType === 'heikinAshi' || chartType === 'bar') {
            mainSeriesRef.current.update({
              time: lastValidCandle.time as Time,
              open: lastValidCandle.open,
              high: lastValidCandle.high,
              low: lastValidCandle.low,
              close: lastValidCandle.close,
            });
          } else {
            mainSeriesRef.current.update({
              time: lastValidCandle.time as Time,
              value: lastValidCandle.close,
            });
          }
        } catch {
          // Fallback to setData if update throws
          mainSeriesRef.current.setData(
            validCandles.map((c) => ({
              time: c.time as Time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
          );
        }
      }
    }

    // Also manage Volume Series anchored at bottom
    if (!volumeSeriesRef.current) {
      try {
        const volSeries = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume_scale',
        });

        volSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8, // strictly at bottom 20%
            bottom: 0,
          },
        });

        volumeSeriesRef.current = volSeries;
      } catch {}
    }

    if (volumeSeriesRef.current) {
      try {
        if (needsNewSeries || prevCount !== validCandles.length) {
          volumeSeriesRef.current.setData(
            validCandles.map((c) => ({
              time: c.time as Time,
              value: Number.isFinite(c.volume) ? c.volume : 0,
              color: c.close >= c.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
            }))
          );
        } else {
          volumeSeriesRef.current.update({
            time: lastValidCandle.time as Time,
            value: Number.isFinite(lastValidCandle.volume) ? lastValidCandle.volume : 0,
            color: lastValidCandle.close >= lastValidCandle.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
          });
        }
      } catch {}
    }

    // Initial default legend
    if (validCandles.length > 0) {
      const last = validCandles[validCandles.length - 1];
      const chg = last.close - last.open;
      setLegendInfo({
        time: last.time,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: last.volume,
        change: chg,
        changePct: last.open !== 0 ? (chg / last.open) * 100 : 0,
      });
    }

    setChartViewTrigger((prev) => prev + 1);
  }, [displayCandles, chartType]);

  // 3. Update Overlay Indicators on Main Chart
  useEffect(() => {
    const chart = mainChartRef.current;
    if (!chart || displayCandles.length === 0) return;

    // Clear existing indicators from chart safely
    indicatorSeriesRef.current.forEach((series) => {
      try {
        chart.removeSeries(series);
      } catch {}
    });
    indicatorSeriesRef.current.clear();

    const validCandles = displayCandles.filter(
      (c) =>
        c &&
        c.time !== undefined &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );
    if (validCandles.length === 0) return;

    // 1. SMA 20
    const smaInd = enabledIndicators.find((i) => i.id === 'sma20');
    if (smaInd) {
      const smaData = calculateSMA(validCandles, 20);
      const validSma = smaData.filter((d) => d && d.time !== undefined && Number.isFinite(d.value));
      if (validSma.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: smaInd.color,
          lineWidth: 2,
          title: 'SMA 20',
        });
        smaSeries.setData(validSma.map((d) => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRef.current.set('sma20', smaSeries);
      }
    }

    // 2. EMA 50
    const ema50Ind = enabledIndicators.find((i) => i.id === 'ema50');
    if (ema50Ind) {
      const emaData = calculateEMA(validCandles, 50);
      const validEma = emaData.filter((d) => d && d.time !== undefined && Number.isFinite(d.value));
      if (validEma.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: ema50Ind.color,
          lineWidth: 2,
          title: 'EMA 50',
        });
        emaSeries.setData(validEma.map((d) => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRef.current.set('ema50', emaSeries);
      }
    }

    // 3. EMA 200
    const ema200Ind = enabledIndicators.find((i) => i.id === 'ema200');
    if (ema200Ind && validCandles.length > 10) {
      const ema200Data = calculateEMA(validCandles, Math.min(200, validCandles.length - 1));
      const validEma200 = ema200Data.filter((d) => d && d.time !== undefined && Number.isFinite(d.value));
      if (validEma200.length > 0) {
        const ema200Series = chart.addSeries(LineSeries, {
          color: ema200Ind.color,
          lineWidth: 2,
          title: 'EMA 200',
        });
        ema200Series.setData(validEma200.map((d) => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRef.current.set('ema200', ema200Series);
      }
    }

    // 4. Bollinger Bands
    const bbInd = enabledIndicators.find((i) => i.id === 'bb');
    if (bbInd && validCandles.length >= 20) {
      const bbData = calculateBollingerBands(validCandles, 20, 2);

      const upperSeries = chart.addSeries(LineSeries, {
        color: bbInd.color,
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperSeries.setData(
        bbData.upper
          .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
          .map((d) => ({ time: d.time as Time, value: d.value }))
      );

      const midSeries = chart.addSeries(LineSeries, {
        color: bbInd.color,
        lineWidth: 1,
        lineStyle: 2, // dashed
        title: 'BB Basis',
      });
      midSeries.setData(
        bbData.middle
          .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
          .map((d) => ({ time: d.time as Time, value: d.value }))
      );

      const lowerSeries = chart.addSeries(LineSeries, {
        color: bbInd.color,
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerSeries.setData(
        bbData.lower
          .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
          .map((d) => ({ time: d.time as Time, value: d.value }))
      );

      indicatorSeriesRef.current.set('bb_upper', upperSeries);
      indicatorSeriesRef.current.set('bb_mid', midSeries);
      indicatorSeriesRef.current.set('bb_lower', lowerSeries);
    }

    // 5. VWAP
    const vwapInd = enabledIndicators.find((i) => i.id === 'vwap');
    if (vwapInd) {
      const vwapData = calculateVWAP(validCandles);
      const validVwap = vwapData.filter((d) => d && d.time !== undefined && Number.isFinite(d.value));
      if (validVwap.length > 0) {
        const vwapSeries = chart.addSeries(LineSeries, {
          color: vwapInd.color,
          lineWidth: 2,
          title: 'VWAP',
        });
        vwapSeries.setData(validVwap.map((d) => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRef.current.set('vwap', vwapSeries);
      }
    }

    setChartViewTrigger((prev) => prev + 1);
  }, [enabledIndicators, displayCandles]);

  // 4. RSI Sub-Pane Chart
  useEffect(() => {
    if (!isRsiEnabled || !rsiContainerRef.current) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: rsiContainerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#9b9eb5',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      timeScale: {
        timeVisible: false,
        visible: false, // hide time scale, synced with main
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
    });

    rsiChartRef.current = rsiChart;

    const validCandles = displayCandles.filter(
      (c) =>
        c &&
        c.time !== undefined &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );

    const rsiData = calculateRSI(validCandles, 14);
    const validRsi = rsiData.filter((d) => d && d.time !== undefined && Number.isFinite(d.value));

    if (validRsi.length > 0) {
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        title: 'RSI 14',
      });
      rsiSeries.setData(validRsi.map((d) => ({ time: d.time as Time, value: d.value })));

      // Add 70 and 30 guide lines
      const line70 = rsiChart.addSeries(LineSeries, {
        color: 'rgba(239, 83, 80, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
      });
      line70.setData(validRsi.map((d) => ({ time: d.time as Time, value: 70 })));

      const line30 = rsiChart.addSeries(LineSeries, {
        color: 'rgba(38, 166, 154, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
      });
      line30.setData(validRsi.map((d) => ({ time: d.time as Time, value: 30 })));
    }

    // Sync with main chart time range
    if (mainChartRef.current) {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (logicalRange) rsiChart.timeScale().setVisibleLogicalRange(logicalRange);

      mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !rsiContainerRef.current) return;
      const { width, height } = entries[0].contentRect;
      rsiChart.applyOptions({ width, height });
    });
    resizeObserver.observe(rsiContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        rsiChart.remove();
      } catch {}
      rsiChartRef.current = null;
    };
  }, [isRsiEnabled, displayCandles]);

  // 5. MACD Sub-Pane Chart
  useEffect(() => {
    if (!isMacdEnabled || !macdContainerRef.current) {
      if (macdChartRef.current) {
        try {
          macdChartRef.current.remove();
        } catch {}
        macdChartRef.current = null;
      }
      return;
    }

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: macdContainerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#9b9eb5',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      timeScale: {
        timeVisible: true,
        borderColor: '#2a2e39',
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
    });

    macdChartRef.current = macdChart;

    const validCandles = displayCandles.filter(
      (c) =>
        c &&
        c.time !== undefined &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );

    const macdData = calculateMACD(validCandles, 12, 26, 9);

    const validHist = macdData.histogram
      .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
      .map((d) => ({ time: d.time as Time, value: d.value, color: d.color }));

    const validMacdLine = macdData.macdLine
      .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
      .map((d) => ({ time: d.time as Time, value: d.value }));

    const validSigLine = macdData.signalLine
      .filter((d) => d && d.time !== undefined && Number.isFinite(d.value))
      .map((d) => ({ time: d.time as Time, value: d.value }));

    if (validHist.length > 0) {
      const histSeries = macdChart.addSeries(HistogramSeries, {
        title: 'MACD Hist',
      });
      histSeries.setData(validHist);
    }

    if (validMacdLine.length > 0) {
      const macdLineSeries = macdChart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
        title: 'MACD',
      });
      macdLineSeries.setData(validMacdLine);
    }

    if (validSigLine.length > 0) {
      const sigLineSeries = macdChart.addSeries(LineSeries, {
        color: '#f97316',
        lineWidth: 2,
        title: 'Signal',
      });
      sigLineSeries.setData(validSigLine);
    }

    // Sync with main chart time range
    if (mainChartRef.current) {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (logicalRange) macdChart.timeScale().setVisibleLogicalRange(logicalRange);

      mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !macdContainerRef.current) return;
      const { width, height } = entries[0].contentRect;
      macdChart.applyOptions({ width, height });
    });
    resizeObserver.observe(macdContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        macdChart.remove();
      } catch {}
      macdChartRef.current = null;
    };
  }, [isMacdEnabled, displayCandles]);

  // Coordinate Conversion Helpers for SVG Overlay
  const getPixelCoord = useCallback(
    (point: Point): { x: number; y: number } | null => {
      const chart = mainChartRef.current;
      const series = mainSeriesRef.current;
      if (!chart || !series) return null;

      try {
        const x = chart.timeScale().timeToCoordinate(point.time as Time);
        const y = series.priceToCoordinate(point.price);
        if (x === null || y === null) return null;
        return { x, y };
      } catch {
        return null;
      }
    },
    [chartViewTrigger]
  );

  const getPointFromPixel = useCallback(
    (pixelX: number, pixelY: number): Point | null => {
      const chart = mainChartRef.current;
      const series = mainSeriesRef.current;
      if (!chart || !series) return null;

      try {
        const time = chart.timeScale().coordinateToTime(pixelX);
        const price = series.coordinateToPrice(pixelY);
        if (time === null || price === null) return null;
        return { time: time as number, price };
      } catch {
        return null;
      }
    },
    [chartViewTrigger]
  );

  // SVG Mouse Event Handlers for Drawing Tools
  const handleOverlayMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pt = getPointFromPixel(x, y);
    if (!pt) return;

    if (activeTool === 'horizontal') {
      // Single click places horizontal line
      const newDrawing: DrawingItem = {
        id: Math.random().toString(36).substring(7),
        type: 'horizontal',
        points: [pt],
        color: '#2962ff',
        lineWidth: 1.5,
      };
      onAddDrawing(newDrawing);
      return;
    }

    if (!drawingStartPoint) {
      // Start 2-point drawing
      setDrawingStartPoint(pt);
    } else {
      // Finish 2-point drawing
      const newDrawing: DrawingItem = {
        id: Math.random().toString(36).substring(7),
        type: activeTool,
        points: [drawingStartPoint, pt],
        color: activeTool === 'position' ? '#089981' : '#2962ff',
        lineWidth: 1.5,
      };
      onAddDrawing(newDrawing);
      setDrawingStartPoint(null);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentMousePos({ x, y });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131722] overflow-hidden relative select-none">
      {/* Chart Legend Bar at Top Left with Candle Time & Countdown */}
      <div className="absolute top-2 left-3 z-10 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono bg-[#131722]/85 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-[#2a2e39]/70 pointer-events-none shadow-lg">
        {/* Candle Exact Time Badge */}
        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold bg-[#1e222d]/90 px-2 py-0.5 rounded border border-[#2a2e39]">
          <Clock className="w-3 h-3 text-[#2962ff]" />
          <span>
            {formatCandleTime(legendInfo?.time || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : undefined))}
          </span>
        </div>

        {/* Live Candle Bar Close Countdown */}
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-[#1e222d]/90 px-2 py-0.5 rounded border border-[#2a2e39]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-gray-400 text-[10px]">{language === 'bn' ? 'ক্যান্ডেল বাকি' : 'Bar Close'}:</span>
          <span>{countdown || '00:00'}</span>
        </div>

        {legendInfo ? (
          <>
            <span className="text-gray-400">
              O: <span className="text-white font-medium">{legendInfo.open.toFixed(precision)}</span>
            </span>
            <span className="text-gray-400">
              H: <span className="text-white font-medium">{legendInfo.high.toFixed(precision)}</span>
            </span>
            <span className="text-gray-400">
              L: <span className="text-white font-medium">{legendInfo.low.toFixed(precision)}</span>
            </span>
            <span className="text-gray-400">
              C: <span className="text-white font-medium">{legendInfo.close.toFixed(precision)}</span>
            </span>
            <span
              className={`font-semibold ${
                legendInfo.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {legendInfo.change >= 0 ? '+' : ''}
              {legendInfo.change.toFixed(precision)} ({legendInfo.change >= 0 ? '+' : ''}
              {legendInfo.changePct.toFixed(2)}%)
            </span>
            <span className="text-gray-400">
              Vol: <span className="text-gray-200">{legendInfo.volume.toFixed(1)}</span>
            </span>
          </>
        ) : (
          <span className="text-gray-400">{language === 'bn' ? 'ক্যান্ডেল লোড হচ্ছে...' : 'Loading candles...'}</span>
        )}

        {/* Active Overlay Indicator Values in Legend */}
        {enabledIndicators
          .filter((i) => i.category === 'overlay')
          .map((ind) => (
            <span key={ind.id} className="text-xs font-sans flex items-center gap-1" style={{ color: ind.color }}>
              <span>●</span>
              <span>{ind.name}</span>
            </span>
          ))}
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 relative w-full h-full min-h-[300px]" ref={containerRef}>
        {/* SVG Drawing Layer Over Main Chart */}
        <svg
          id="chart-drawing-overlay"
          className={`absolute inset-0 w-full h-full z-10 ${
            activeTool !== 'cursor' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
        >
          {/* Render Committed Drawings */}
          {drawings.map((drw) => {
            if (drw.type === 'horizontal') {
              const p = getPixelCoord(drw.points[0]);
              if (!p) return null;
              return (
                <g
                  key={drw.id}
                  className="group cursor-pointer pointer-events-auto"
                  onMouseEnter={() => setHoveredDrawingId(drw.id)}
                  onMouseLeave={() => setHoveredDrawingId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'eraser' || hoveredDrawingId === drw.id) {
                      onRemoveDrawing(drw.id);
                    }
                  }}
                >
                  <line
                    x1="0"
                    y1={p.y}
                    x2="100%"
                    y2={p.y}
                    stroke={drw.color || '#2962ff'}
                    strokeWidth={drw.lineWidth || 1.5}
                    strokeDasharray="4 2"
                  />
                  <rect
                    x="8"
                    y={p.y - 10}
                    width="70"
                    height="20"
                    rx="4"
                    fill="#1e222d"
                    stroke={drw.color || '#2962ff'}
                    strokeWidth="1"
                  />
                  <text
                    x="43"
                    y={p.y + 4}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {drw.points[0].price.toFixed(precision)}
                  </text>
                </g>
              );
            }

            if (drw.points.length >= 2) {
              const p1 = getPixelCoord(drw.points[0]);
              const p2 = getPixelCoord(drw.points[1]);
              if (!p1 || !p2) return null;

              if (drw.type === 'trendline') {
                return (
                  <g
                    key={drw.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'eraser') onRemoveDrawing(drw.id);
                    }}
                  >
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={drw.color || '#2962ff'}
                      strokeWidth={drw.lineWidth || 2}
                    />
                    <circle cx={p1.x} cy={p1.y} r="4" fill={drw.color || '#2962ff'} />
                    <circle cx={p2.x} cy={p2.y} r="4" fill={drw.color || '#2962ff'} />
                  </g>
                );
              }

              if (drw.type === 'fibonacci') {
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                const diffY = maxY - minY;
                const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                const colors = ['#787b86', '#f23645', '#ff9800', '#4caf50', '#089981', '#2962ff', '#787b86'];

                return (
                  <g key={drw.id} className="pointer-events-auto">
                    {levels.map((lvl, idx) => {
                      const lvlY = p1.y < p2.y ? p1.y + diffY * lvl : p2.y + diffY * (1 - lvl);
                      return (
                        <g key={lvl}>
                          <line
                            x1={Math.min(p1.x, p2.x)}
                            y1={lvlY}
                            x2={Math.max(p1.x, p2.x) + 200}
                            y2={lvlY}
                            stroke={colors[idx]}
                            strokeWidth="1"
                            strokeDasharray={lvl === 0.5 ? 'none' : '2 2'}
                          />
                          <text
                            x={Math.max(p1.x, p2.x) + 205}
                            y={lvlY + 3}
                            fill={colors[idx]}
                            fontSize="9"
                            fontFamily="JetBrains Mono"
                          >
                            Fib {(lvl * 100).toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }

              if (drw.type === 'rectangle') {
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const width = Math.abs(p2.x - p1.x);
                const height = Math.abs(p2.y - p1.y);

                return (
                  <g key={drw.id} className="pointer-events-auto">
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill="rgba(41, 98, 255, 0.15)"
                      stroke="#2962ff"
                      strokeWidth="1.5"
                    />
                    <text x={x + 5} y={y + 14} fill="#2962ff" fontSize="10" fontFamily="IBM Plex Sans">
                      Zone
                    </text>
                  </g>
                );
              }

              if (drw.type === 'position') {
                // Long / Short Risk Reward Visualizer
                const entryY = p1.y;
                const tpY = Math.min(p1.y, p2.y);
                const slDist = Math.abs(p1.y - tpY) * 0.5; // default 1:2 ratio
                const slY = p1.y + slDist;
                const width = Math.max(120, Math.abs(p2.x - p1.x));
                const leftX = Math.min(p1.x, p2.x);

                const riskReward = (Math.abs(entryY - tpY) / slDist).toFixed(2);

                return (
                  <g key={drw.id} className="pointer-events-auto">
                    {/* Target (Profit) Box */}
                    <rect
                      x={leftX}
                      y={tpY}
                      width={width}
                      height={Math.abs(entryY - tpY)}
                      fill="rgba(8, 153, 129, 0.2)"
                      stroke="#089981"
                      strokeWidth="1"
                    />
                    {/* Stop Loss (Risk) Box */}
                    <rect
                      x={leftX}
                      y={entryY}
                      width={width}
                      height={slDist}
                      fill="rgba(242, 54, 69, 0.2)"
                      stroke="#f23645"
                      strokeWidth="1"
                    />
                    {/* Entry line */}
                    <line x1={leftX} y1={entryY} x2={leftX + width} y2={entryY} stroke="#ffffff" strokeWidth="1.5" />
                    {/* R:R Ratio Badge */}
                    <rect x={leftX + 4} y={entryY - 18} width="80" height="16" rx="3" fill="#1e222d" />
                    <text x={leftX + 8} y={entryY - 6} fill="#ffffff" fontSize="9" fontFamily="JetBrains Mono">
                      R:R {riskReward}
                    </text>
                  </g>
                );
              }

              if (drw.type === 'measure') {
                const width = Math.abs(p2.x - p1.x);
                const height = Math.abs(p2.y - p1.y);
                const priceDelta = drw.points[1].price - drw.points[0].price;
                const pctDelta = (priceDelta / drw.points[0].price) * 100;
                const isPos = priceDelta >= 0;

                return (
                  <g key={drw.id} className="pointer-events-auto">
                    <rect
                      x={Math.min(p1.x, p2.x)}
                      y={Math.min(p1.y, p2.y)}
                      width={width}
                      height={height}
                      fill={isPos ? 'rgba(8, 153, 129, 0.1)' : 'rgba(242, 54, 69, 0.1)'}
                      stroke={isPos ? '#089981' : '#f23645'}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={Math.min(p1.x, p2.x) + 4}
                      y={Math.min(p1.y, p2.y) + 4}
                      width="120"
                      height="20"
                      rx="4"
                      fill="#1e222d"
                    />
                    <text
                      x={Math.min(p1.x, p2.x) + 8}
                      y={Math.min(p1.y, p2.y) + 18}
                      fill={isPos ? '#089981' : '#f23645'}
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {isPos ? '+' : ''}
                      {priceDelta.toFixed(precision)} ({isPos ? '+' : ''}
                      {pctDelta.toFixed(2)}%)
                    </text>
                  </g>
                );
              }
            }

            return null;
          })}

          {/* Active drawing in-progress preview */}
          {drawingStartPoint && currentMousePos && (
            <g className="pointer-events-none opacity-80">
              {(() => {
                const p1 = getPixelCoord(drawingStartPoint);
                if (!p1) return null;
                const p2 = currentMousePos;

                if (activeTool === 'trendline') {
                  return (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#2962ff"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  );
                }

                if (activeTool === 'rectangle') {
                  return (
                    <rect
                      x={Math.min(p1.x, p2.x)}
                      y={Math.min(p1.y, p2.y)}
                      width={Math.abs(p2.x - p1.x)}
                      height={Math.abs(p2.y - p1.y)}
                      fill="rgba(41, 98, 255, 0.15)"
                      stroke="#2962ff"
                      strokeWidth="1.5"
                    />
                  );
                }

                if (activeTool === 'measure') {
                  return (
                    <rect
                      x={Math.min(p1.x, p2.x)}
                      y={Math.min(p1.y, p2.y)}
                      width={Math.abs(p2.x - p1.x)}
                      height={Math.abs(p2.y - p1.y)}
                      fill="rgba(41, 98, 255, 0.15)"
                      stroke="#2962ff"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  );
                }

                return (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#2962ff"
                    strokeWidth="1.5"
                  />
                );
              })()}
            </g>
          )}
          {/* Floating Real-Time Candle Time & Countdown Badge */}
          {displayCandles.length > 0 && (
            <div className="absolute right-14 bottom-8 z-10 pointer-events-none flex items-center gap-2 bg-[#171b26]/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#2a2e39] text-[11px] font-mono shadow-md">
              <span className="text-[#2962ff] font-bold">{timeframe}</span>
              <span className="text-gray-600">|</span>
              <span className="text-cyan-300">
                {formatCandleTime(displayCandles[displayCandles.length - 1]?.time).split(' ')[1] || '--:--:--'}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {countdown || '00:00'}
              </span>
            </div>
          )}
        </svg>
      </div>

      {/* RSI Sub-Pane */}
      {isRsiEnabled && (
        <div className="h-28 border-t border-[#2a2e39] relative shrink-0 bg-[#131722]">
          <div className="absolute top-1 left-3 z-10 text-[11px] font-mono text-purple-400 font-semibold flex items-center gap-2">
            <span>RSI (14)</span>
            <span className="text-gray-500 text-[10px]">70/30</span>
          </div>
          <div ref={rsiContainerRef} className="w-full h-full" />
        </div>
      )}

      {/* MACD Sub-Pane */}
      {isMacdEnabled && (
        <div className="h-32 border-t border-[#2a2e39] relative shrink-0 bg-[#131722]">
          <div className="absolute top-1 left-3 z-10 text-[11px] font-mono text-blue-400 font-semibold flex items-center gap-2">
            <span>MACD (12, 26, 9)</span>
          </div>
          <div ref={macdContainerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};
