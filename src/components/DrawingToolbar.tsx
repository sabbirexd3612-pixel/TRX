import React from 'react';
import { DrawingToolType } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  MousePointer,
  Minus,
  Maximize2,
  Square,
  TrendingUp,
  Percent,
  Ruler,
  Trash2,
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  onClearDrawings: () => void;
  drawingsCount: number;
  language: Language;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearDrawings,
  drawingsCount,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const tools: { id: DrawingToolType; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'cursor',
      label: language === 'bn' ? 'কার্সার' : 'Cursor',
      icon: <MousePointer className="w-4 h-4" />,
      tooltip: language === 'bn' ? 'সাধারণ কার্সার' : 'Crosshair / Pointer',
    },
    {
      id: 'trendline',
      label: language === 'bn' ? 'ট্রেন্ড লাইন' : 'Trend Line',
      icon: <Minus className="w-4 h-4 rotate-45" />,
      tooltip: t.trendline,
    },
    {
      id: 'horizontal',
      label: language === 'bn' ? 'হরিজন্টাল লাইন' : 'Horizontal Line',
      icon: <Minus className="w-4 h-4" />,
      tooltip: t.horizontalLine,
    },
    {
      id: 'fibonacci',
      label: language === 'bn' ? 'ফিবোনাচ্চি' : 'Fib Retracement',
      icon: <Percent className="w-4 h-4" />,
      tooltip: t.fibonacci,
    },
    {
      id: 'rectangle',
      label: language === 'bn' ? 'রেকটেঙ্গেল' : 'Rectangle',
      icon: <Square className="w-4 h-4" />,
      tooltip: t.rectangle,
    },
    {
      id: 'position',
      label: language === 'bn' ? 'লং/শর্ট ক্যালকুলেটর' : 'Long/Short Tool',
      icon: <TrendingUp className="w-4 h-4" />,
      tooltip: t.riskReward,
    },
    {
      id: 'measure',
      label: language === 'bn' ? 'রুলার / পরিমাপক' : 'Measure Ruler',
      icon: <Ruler className="w-4 h-4" />,
      tooltip: t.measure,
    },
  ];

  return (
    <div
      id="tradingview-left-toolbar"
      className="w-12 bg-[#171b26] border-r border-[#2a2e39] flex flex-col items-center py-3 gap-1 shrink-0 select-none z-20"
    >
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            id={`drawing-tool-${tool.id}`}
            onClick={() => onSelectTool(tool.id)}
            title={`${tool.label} (${tool.tooltip})`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group ${
              isActive
                ? 'bg-[#2962ff] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#202534]'
            }`}
          >
            {tool.icon}
            {/* Tooltip on hover */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#1e222d] border border-[#2a2e39] text-xs text-white px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
                {tool.label}
              </div>
            </div>
          </button>
        );
      })}

      <div className="w-6 h-[1px] bg-[#2a2e39] my-2" />

      {/* Clear drawings */}
      <button
        id="clear-all-drawings-btn"
        onClick={onClearDrawings}
        disabled={drawingsCount === 0}
        title={t.clearAll}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group ${
          drawingsCount > 0
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            : 'text-gray-600 cursor-not-allowed'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        {drawingsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {drawingsCount}
          </span>
        )}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#1e222d] border border-[#2a2e39] text-xs text-red-400 px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
            {t.clearAll} ({drawingsCount})
          </div>
        </div>
      </button>
    </div>
  );
};
