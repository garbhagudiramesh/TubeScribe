
import React, { useState, useRef, useEffect } from 'react';
import { TranscriptSegment, VideoMetadata } from '../types';
import { refineTranscriptSegment } from '../services/geminiService';

interface Props {
  segments: TranscriptSegment[];
  video?: VideoMetadata;
  summary?: string;
  onUpdateSegment: (id: string, updated: Partial<TranscriptSegment>) => void;
  onNotify: (message: string) => void;
}

const TranscriptionEditor: React.FC<Props> = ({ segments, video, summary, onUpdateSegment, onNotify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const handleRefine = async (segment: TranscriptSegment) => {
    setIsRefining(segment.id);
    try {
      // Find surrounding segments for better AI context
      const currentIndex = segments.findIndex(s => s.id === segment.id);
      const prevSegment = currentIndex > 0 ? segments[currentIndex - 1] : undefined;
      const nextSegment = currentIndex < segments.length - 1 ? segments[currentIndex + 1] : undefined;

      const refined = await refineTranscriptSegment(
        segment.text, 
        summary || video?.title || '',
        prevSegment?.text,
        nextSegment?.text
      );

      if (refined) {
        onUpdateSegment(segment.id, { text: refined });
        onNotify("Refined successfully");
      }
    } catch (err) {
      console.error("Failed to refine", err);
      onNotify("Refining failed. Please try again.");
    } finally {
      setIsRefining(null);
    }
  };

  const handleCopy = async () => {
    const content = `# ${video?.title || 'Transcription'}\n\n` + 
                    `## Summary\n${summary || 'No summary available.'}\n\n` + 
                    `## Transcript\n` + 
                    segments.map(s => `[${s.startTime}] ${s.speaker}: ${s.text}`).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(content);
      onNotify("Copied to clipboard");
    } catch (err) {
      onNotify("Failed to copy content");
    }
  };

  const handleExport = (format: 'txt' | 'md') => {
    let content = '';
    if (format === 'md') {
      content = `# ${video?.title || 'Transcription'}\n\n## Summary\n${summary}\n\n## Transcript\n` + 
                segments.map(s => `**[${s.startTime}] ${s.speaker}**: ${s.text}`).join('\n\n');
    } else {
      content = segments.map(s => `[${s.startTime}] ${s.speaker}: ${s.text}`).join('\n\n');
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${video?.id || 'export'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Video Context & Tools */}
      <div className="xl:col-span-4 sticky top-24 space-y-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
          <div className="aspect-video relative group overflow-hidden">
            <img 
              src={video?.thumbnail || "https://picsum.photos/seed/yt/800/450"} 
              alt="Video Thumbnail" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute bottom-4 left-4 right-4">
               <span className="px-2 py-1 bg-black/60 backdrop-blur text-[10px] text-white font-bold rounded uppercase tracking-wider">
                 YouTube Source
               </span>
            </div>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
              {video?.title || "Video Transcription Job"}
            </h2>
            <p className="text-sm font-medium text-slate-400 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
              {video?.author || "Unknown Creator"}
            </p>
            
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-3">AI Deep Insights</h3>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {summary ? `"${summary}"` : "Processing conceptual analysis of the footage..."}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <button 
              onClick={() => handleExport('md')}
              className="flex-1 py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" /></svg>
              Markdown
            </button>
            <button 
              onClick={() => handleExport('txt')}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-50 active:scale-95"
            >
              Text File
            </button>
          </div>
          <button 
            onClick={handleCopy}
            className="w-full py-4 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-100 border border-indigo-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy Entire Transcript
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Editor */}
      <div className="xl:col-span-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Transcription Script</h2>
              <p className="text-xs text-slate-400 font-medium">Click any paragraph to refine or edit</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">S{i}</div>)}
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200 uppercase tracking-tighter">
                Gemini Corrected
              </span>
            </div>
          </div>

          <div className="p-8 space-y-10 editor-container overflow-y-auto">
            {segments.map((segment) => (
              <div 
                key={segment.id} 
                className={`group relative flex gap-6 transition-all ${activeSegmentId === segment.id ? 'opacity-100 translate-x-1' : 'opacity-80'}`}
                onMouseEnter={() => setActiveSegmentId(segment.id)}
                onMouseLeave={() => setActiveSegmentId(null)}
              >
                <div className="flex-shrink-0 w-16 pt-1">
                  <span className="mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {segment.startTime}
                  </span>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <input 
                      className="text-xs font-black text-indigo-600 uppercase tracking-[0.1em] bg-transparent border-none focus:ring-0 w-full hover:bg-slate-50 rounded px-1 transition-colors cursor-pointer"
                      value={segment.speaker}
                      onChange={(e) => onUpdateSegment(segment.id, { speaker: e.target.value })}
                    />
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleRefine(segment)}
                        disabled={!!isRefining}
                        className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg transition-all"
                      >
                        {isRefining === segment.id ? 'Thinking...' : 'AI Polishing'}
                      </button>
                    </div>
                  </div>

                  {editingId === segment.id ? (
                    <textarea
                      autoFocus
                      className="w-full p-4 text-slate-700 text-base leading-[1.8] bg-slate-50 border-2 border-indigo-500/20 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all shadow-inner"
                      value={segment.text}
                      rows={Math.ceil(segment.text.length / 80)}
                      onChange={(e) => onUpdateSegment(segment.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                    />
                  ) : (
                    <p 
                      onClick={() => setEditingId(segment.id)}
                      className="text-slate-700 text-base leading-[1.8] cursor-text p-1 hover:bg-slate-50/80 rounded-xl transition-all border border-transparent hover:border-slate-100"
                    >
                      {segment.text}
                    </p>
                  )}
                </div>
                
                {/* Active Indicator Line */}
                <div className={`absolute -left-8 top-0 bottom-0 w-1 bg-indigo-500 rounded-full transition-all duration-300 ${activeSegmentId === segment.id ? 'scale-y-100' : 'scale-y-0 opacity-0'}`} />
              </div>
            ))}
            
            {segments.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-400 font-medium">Draft script will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionEditor;
