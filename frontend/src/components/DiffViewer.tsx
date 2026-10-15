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
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white font-mono text-xs shadow-sm">
      {/* Diff Bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-slate-500">File:</span>
          <span className="text-slate-900 font-bold">{filePath}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'unified' ? 'split' : 'unified')}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shadow-sm"
          >
            {viewMode === 'unified' ? <Columns className="h-3 w-3" /> : <AlignJustify className="h-3 w-3" />}
            <span>{viewMode === 'unified' ? 'Split View' : 'Unified'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shadow-sm"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy Diff'}</span>
          </button>
        </div>
      </div>

      {/* Unified View */}
      {viewMode === 'unified' ? (
        <div className="overflow-x-auto max-h-80 p-3 bg-white">
          <table className="w-full border-collapse">
            <tbody>
              {diffLines.map((line, idx) => {
                let rowBg = 'hover:bg-slate-50 text-slate-800';
                let signColor = 'text-slate-400';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  rowBg = 'bg-emerald-50/80 text-emerald-900 border-l-2 border-emerald-500 font-medium';
                  signColor = 'text-emerald-600 font-bold';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  rowBg = 'bg-rose-50/80 text-rose-900 border-l-2 border-rose-500 font-medium';
                  signColor = 'text-rose-600 font-bold';
                } else if (line.startsWith('@@')) {
                  rowBg = 'bg-indigo-50/70 text-indigo-900';
                  signColor = 'text-indigo-600';
                }

                return (
                  <tr key={idx} className={`${rowBg} transition-colors leading-relaxed`}>
                    <td className="w-9 text-right pr-2.5 select-none text-slate-400 text-[10px]">
                      {idx + 1}
                    </td>
                    <td className={`w-4 text-center select-none ${signColor} text-[11px]`}>
                      {line[0] || ' '}
                    </td>
                    <td className="whitespace-pre pl-1.5 font-mono text-[11px]">
                      {line.slice(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Split View */
        <div className="grid grid-cols-2 divide-x divide-slate-200 max-h-80 overflow-y-auto">
          <div className="p-3 bg-rose-50/30">
            <div className="text-[10px] font-bold text-rose-700 mb-2 pb-1 border-b border-rose-200 uppercase tracking-wider">
              Original Code (Baseline)
            </div>
            <pre className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px]">
              {beforeContent || 'Original content unavailable'}
            </pre>
          </div>

          <div className="p-3 bg-emerald-50/30">
            <div className="text-[10px] font-bold text-emerald-700 mb-2 pb-1 border-b border-emerald-200 uppercase tracking-wider">
              Proposed Code (Patched)
            </div>
            <pre className="text-emerald-900 whitespace-pre-wrap leading-relaxed text-[11px]">
              {afterContent || 'Proposed content unavailable'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
