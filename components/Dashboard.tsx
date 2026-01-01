
import React from 'react';
import { TranscriptionJob } from '../types';

interface DashboardProps {
  history: TranscriptionJob[];
  onOpenJob: (job: TranscriptionJob) => void;
  onDeleteJob: (id: string) => void;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, onOpenJob, onDeleteJob, onClose }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Studio</h2>
          <p className="text-slate-500 font-medium">Manage and review your processed video intelligence</p>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
        >
          Close Dashboard
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] py-24 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">No projects found</h3>
          <p className="text-slate-400 mt-2">Your transcription history will appear here once processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {history.map((job) => (
            <div 
              key={job.id}
              className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <img src={job.video?.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">{job.video?.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => onOpenJob(job)}
                  className="flex-grow py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Open Report
                </button>
                <button 
                  onClick={() => onDeleteJob(job.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
