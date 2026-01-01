
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import TranscriptionEditor from './components/TranscriptionEditor';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { TranscriptionJob, TranscriptSegment, VideoMetadata, User } from './types';
import { getTranscriptionFromUrl } from './services/geminiService';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [job, setJob] = useState<TranscriptionJob | null>(null);
  const [isError, setIsError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth & Dashboard State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [history, setHistory] = useState<TranscriptionJob[]>([]);

  // Load persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('ts_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedHistory = localStorage.getItem('ts_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save history updates
  useEffect(() => {
    localStorage.setItem('ts_history', JSON.stringify(history));
  }, [history]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleTranscribe = async () => {
    if (!url || isSubmitting) return;
    
    const videoId = getYoutubeId(url);
    if (!videoId) {
      setIsError(true);
      showToast("Please provide a valid YouTube URL.");
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    setIsError(false);
    setIsSubmitting(true);
    setView('editor');
    
    const placeholderVideo: VideoMetadata = {
      id: videoId,
      title: "Indexing video contents...",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author: "YouTube Creator",
      url: url
    };

    const newJob: TranscriptionJob = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'processing',
      video: placeholderVideo,
      segments: [],
      createdAt: Date.now()
    };
    
    setJob(newJob);

    try {
      const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      const oEmbedData = await oEmbedRes.json();
      
      const realVideo: VideoMetadata = {
        ...placeholderVideo,
        title: oEmbedData.title,
        author: oEmbedData.author_name,
        thumbnail: oEmbedData.thumbnail_url
      };

      setJob(prev => prev ? { ...prev, video: realVideo } : null);

      const result = await getTranscriptionFromUrl(url, oEmbedData.title);
      
      const completedJob: TranscriptionJob = {
        ...(job || newJob),
        video: realVideo,
        status: 'completed',
        segments: result.segments,
        summary: result.summary,
        createdAt: Date.now()
      };

      setJob(completedJob);
      
      // Auto-save to history if logged in
      if (user) {
        setHistory(prev => [completedJob, ...prev]);
      }

    } catch (err) {
      console.error("Transcription failed", err);
      setJob(prev => prev ? { ...prev, status: 'error' } : null);
      showToast("Unable to process this video. Try a shorter clip or public video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (name: string, email: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
    };
    setUser(newUser);
    localStorage.setItem('ts_user', JSON.stringify(newUser));
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${name.split(' ')[0]}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ts_user');
    setView('landing');
    showToast("Successfully signed out.");
  };

  const handleUpdateSegment = useCallback((id: string, updated: Partial<TranscriptSegment>) => {
    setJob(prev => {
      if (!prev) return null;
      const updatedJob = {
        ...prev,
        segments: prev.segments.map(s => s.id === id ? { ...s, ...updated } : s)
      };
      
      // Update in history if exists
      setHistory(h => h.map(jobItem => jobItem.id === prev.id ? updatedJob : jobItem));
      
      return updatedJob;
    });
  }, []);

  const reset = () => {
    setJob(null);
    setUrl('');
    setView('landing');
  };

  const openJobFromHistory = (jobFromHistory: TranscriptionJob) => {
    setJob(jobFromHistory);
    setView('editor');
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(j => j.id !== id));
    showToast("Project deleted from studio.");
  };

  return (
    <div className="min-h-screen relative selection:bg-indigo-100 selection:text-indigo-900">
      <Header 
        user={user} 
        onNotify={showToast} 
        onLogin={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout}
        onDashboard={() => setView('dashboard')}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {view === 'landing' && !job && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
            <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[120%] h-[120%] mesh-bg opacity-5 pointer-events-none -z-10 blur-3xl"></div>
            
            <div className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Enterprise Video Intelligence</span>
            </div>

            <div className="max-w-4xl text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-5xl md:text-7xl font-[800] tracking-tight text-slate-900 leading-[1] gradient-text">
                Your videos, <br />
                <span className="text-slate-900">translated into intelligence.</span>
              </h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                Professional-grade transcription, conceptual summaries, and semantic refinement for teams.
              </p>
            </div>

            <div className={`w-full max-w-3xl flex flex-col md:flex-row gap-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 delay-150 ${isError ? 'shake' : ''}`}>
              <div className="relative flex-grow group">
                <input 
                  type="text" 
                  placeholder="Paste YouTube Link (e.g. youtube.com/watch?v=...)"
                  className={`relative w-full px-8 py-6 bg-white border-2 rounded-3xl outline-none focus:ring-0 transition-all text-lg font-medium text-slate-800 shadow-sm ${isError ? 'border-red-200' : 'border-slate-200 focus:border-indigo-600'}`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTranscribe()}
                />
              </div>
              <button 
                onClick={handleTranscribe}
                disabled={isSubmitting}
                className="px-10 py-6 bg-slate-900 text-white font-extrabold text-lg rounded-3xl hover:bg-indigo-600 transition-all shadow-2xl hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Initializing...' : 'Transcribe Now'}
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard 
            history={history} 
            onOpenJob={openJobFromHistory} 
            onDeleteJob={deleteFromHistory} 
            onClose={() => setView(job ? 'editor' : 'landing')} 
          />
        )}

        {view === 'editor' && job && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            {job.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative mb-12">
                  <div className="w-32 h-32 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-3xl font-[800] text-slate-900 mb-4 tracking-tight">Processing Modalities...</h3>
                <div className="mt-12 max-w-md w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-indigo-600 h-full w-2/3 animate-[loading_2s_infinite_linear] rounded-full"></div>
                </div>
              </div>
            ) : job.status === 'error' ? (
              <div className="bg-white border border-red-100 rounded-[2.5rem] p-16 text-center shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-4">Transcription Interrupted</h3>
                <button onClick={reset} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">Back to Dashboard</button>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700 slide-in-from-top-4">
                <div className="flex items-center justify-between mb-12">
                  <button 
                    onClick={reset}
                    className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                    </div>
                    New Project
                  </button>
                  <div className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Project ID: {job.id.toUpperCase()}
                  </div>
                </div>
                
                <TranscriptionEditor 
                  segments={job.segments} 
                  video={job.video}
                  summary={job.summary}
                  onUpdateSegment={handleUpdateSegment}
                  onNotify={showToast}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleLogin} 
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-slate-900 text-white text-sm font-bold rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-slate-700/50">
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
          {toast}
        </div>
      )}

      <footer className="py-20 border-t border-slate-100 text-center bg-slate-50/30">
         <div className="max-w-7xl mx-auto px-6">
            <p className="text-xs font-bold text-slate-400 tracking-tight">
              © 2024 TubeScribe AI — Professional Grade Intelligence.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;
