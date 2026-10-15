import React, { useState } from 'react';
import { Columns, AlignJustify, Copy, Check } from 'lucide-react';

interface DiffViewerProps {
  diffText: string;
  filePath: string;
  beforeContent?: string;
  afterContent?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffText,
  filePath,
  beforeContent,
  afterContent
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffLines = diffText.split('\n');

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs">
      {/* Diff Bar */}
      <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Target File:</span>
          <span className="text-cyan-300 font-semibold">{filePath}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'unified' ? 'split' : 'unified')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {viewMode === 'unified' ? <Columns className="h-3 w-3" /> : <AlignJustify className="h-3 w-3" />}
            <span>{viewMode === 'unified' ? 'Split View' : 'Unified View'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy Diff'}</span>
          </button>
        </div>
      </div>

      {/* Unified View */}
      {viewMode === 'unified' ? (
        <div className="overflow-x-auto max-h-96 p-2">
          <table className="w-full border-collapse">
            <tbody>
              {diffLines.map((line, idx) => {
                let rowBg = 'hover:bg-slate-900/40 text-slate-300';
                let signColor = 'text-slate-600';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  rowBg = 'bg-emerald-950/40 text-emerald-300';
                  signColor = 'text-emerald-500 font-bold';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  rowBg = 'bg-rose-950/40 text-rose-300';
                  signColor = 'text-rose-500 font-bold';
                } else if (line.startsWith('@@')) {
                  rowBg = 'bg-indigo-950/30 text-indigo-400';
                  signColor = 'text-indigo-400';
                }

                return (
                  <tr key={idx} className={`${rowBg} transition-colors leading-relaxed`}>
                    <td className="w-10 text-right pr-3 select-none text-slate-600 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className={`w-4 text-center select-none ${signColor}`}>
                      {line[0] || ' '}
                    </td>
                    <td className="whitespace-pre pl-1 font-mono">
                      {line.slice(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Split View (Before & After Side by Side) */
        <div className="grid grid-cols-2 divide-x divide-slate-800 max-h-96 overflow-y-auto">
          {/* Before */}
          <div className="p-3 bg-rose-950/10">
            <div className="text-[11px] font-semibold text-rose-400 mb-2 pb-1 border-b border-rose-900/40">
              Original Code (Baseline)
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {beforeContent || 'Original content unavailable'}
            </pre>
          </div>

          {/* After */}
          <div className="p-3 bg-emerald-950/10">
            <div className="text-[11px] font-semibold text-emerald-400 mb-2 pb-1 border-b border-emerald-900/40">
              Proposed Code (Patched)
            </div>
            <pre className="text-emerald-200 whitespace-pre-wrap leading-relaxed">
              {afterContent || 'Proposed content unavailable'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
