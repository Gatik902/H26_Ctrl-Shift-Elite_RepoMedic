import React, { useState } from 'react';
import { X, Download, Copy, Check, FileJson, FileText, ShieldCheck } from 'lucide-react';
import type { CapsuleExportResponse } from '../types';

interface CapsuleViewerModalProps {
  capsuleData: CapsuleExportResponse;
  onClose: () => void;
}

export const CapsuleViewerModal: React.FC<CapsuleViewerModalProps> = ({
  capsuleData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(capsuleData.json_capsule, null, 2);
  const markdownText = capsuleData.markdown_report;

  const currentContent = activeTab === 'markdown' ? markdownText : jsonString;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeTab === 'markdown' ? 'md' : 'json';
    const type = activeTab === 'markdown' ? 'text/markdown' : 'application/json';
    const blob = new Blob([currentContent], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependency-exit-capsule-${capsuleData.json_capsule?.capsule_id || 'repomedic'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Dependency Exit Capsule</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Schema v{capsuleData.json_capsule?.schema_version || '1.0.0'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {capsuleData.json_capsule?.capsule_id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-600/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .{activeTab === 'markdown' ? 'md' : 'json'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Maintainer Markdown Report</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-emerald-400" />
            <span>Validated JSON Payload</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs">
          <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {currentContent}
          </pre>
        </div>
      </div>
    </div>
  );
};