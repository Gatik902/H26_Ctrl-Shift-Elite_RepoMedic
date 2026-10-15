import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code2, ShieldCheck } from 'lucide-react';
import type { CapsuleData } from '../types';

interface CapsuleViewerModalProps {
  capsuleData: CapsuleData;
  onClose: () => void;
}

export const CapsuleViewerModal: React.FC<CapsuleViewerModalProps> = ({
  capsuleData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'json'>('json');
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(capsuleData.json_capsule, null, 2);

  const handleCopy = () => {
    const textToCopy = activeTab === 'json' ? jsonString : capsuleData.markdown_report;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = activeTab === 'json';
    const blob = new Blob([isJson ? jsonString : capsuleData.markdown_report], {
      type: isJson ? 'application/json' : 'text/markdown'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isJson ? 'dependency-exit-capsule.json' : 'dependency-exit-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/95 border border-white rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dependency Exit Capsule</h3>
              <p className="text-[11px] text-slate-500 font-mono">Schema v1.0.0 Canonical Export</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'json' ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="h-3 w-3" />
                <span>JSON Payload</span>
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'markdown' ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Markdown Report</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'json' ? (
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed shadow-inner">
              {jsonString}
            </pre>
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono shadow-sm">
              {capsuleData.markdown_report}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
