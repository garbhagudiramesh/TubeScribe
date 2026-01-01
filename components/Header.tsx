
import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onNotify: (message: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onDashboard: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNotify, onLogin, onLogout, onDashboard }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/60 py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => window.location.reload()}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95">
              <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              Tube<span className="text-indigo-600">Scribe</span>
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
              Intelligence Engine
            </span>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={onDashboard}
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </button>
              <div className="group relative">
                <button 
                  onClick={onLogout}
                  className="w-10 h-10 rounded-full border-2 border-slate-100 p-0.5 overflow-hidden hover:border-indigo-600 transition-all active:scale-95"
                  title="Logout"
                >
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-extrabold uppercase tracking-widest rounded-full hover:bg-indigo-600 transition-all shadow-md active:scale-95"
            >
              Login
            </button>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-6">
            {user && (
               <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <img src={user.avatar} className="w-12 h-12 rounded-full" alt="" />
                 <div>
                   <p className="font-bold text-slate-900">{user.name}</p>
                   <p className="text-xs text-slate-500">{user.email}</p>
                 </div>
               </div>
            )}
            {user ? (
              <>
                <button onClick={() => { onDashboard(); setIsMobileMenuOpen(false); }} className="text-left text-lg font-bold text-indigo-600">Dashboard</button>
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="text-left text-lg font-bold text-red-500">Logout</button>
              </>
            ) : (
              <button 
                onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                className="mt-4 w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
