"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CornerDownRight, CheckCircle2, ChevronRight, Minimize2, Loader2, Menu, X, Mail, Phone, Instagram, HeartHandshake } from 'lucide-react';

type Message = {
  role: 'user' | 'model';
  text: string;
};

type ViewState = 'home' | 'contact' | 'donate';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Home State
  const [step, setStep] = useState<'initial' | 'expanding' | 'transparent'>('initial');
  const [problem, setProblem] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [area, setArea] = useState(1); // Starts at 1, goes up
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = '/api/expand';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'home') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeView]);

  const handleInitialDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;

    setStep('expanding');
    setIsLoading(true);

    const initialMessage = { role: 'user' as const, text: `Core Problem: ${problem}` };
    setMessages([initialMessage]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ text: initialMessage.text }] }],
          isFinalState: false
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      setArea(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to cognitive engine. Maintain calm and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const newAnswer = inputVal.trim();
    setInputVal('');
    
    const newUserMessage = { role: 'user' as const, text: newAnswer };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    setArea(prev => Math.min(prev + 2, 20));

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          isFinalState: false
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Interruption in cognitive flow. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTransparency = async () => {
    setIsLoading(true);
    
    try {
      const apiMessages = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          isFinalState: true
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      setStep('transparent');
      setArea(50); // Massive area, flat pressure
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (view: ViewState) => {
    setActiveView(view);
    setIsMenuOpen(false);
  };

  const gaugeWidth = Math.min(100 + (area * 30), 800);
  const gaugeHeight = Math.max(200 / (area * 0.8), 2);
  const gaugeColor = area > 10 ? '#4ADE80' : area > 4 ? '#A78BFA' : '#F87171';
  const opacity = area > 10 ? 0.3 : 0.8;

  return (
    <main className="fixed inset-0 bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* Background visual gauge ONLY visible on Home */}
      <div className={`fixed inset-0 pointer-events-none flex items-center justify-center -z-10 transition-opacity duration-1000 ${activeView === 'home' ? 'opacity-30' : 'opacity-5'}`}>
        <motion.div 
          animate={{ 
            width: gaugeWidth, 
            height: gaugeHeight,
            backgroundColor: gaugeColor,
            opacity: opacity
          }}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }}
          className="rounded-[100%] blur-3xl"
        />
      </div>

      {/* Global Header */}
      <header className="p-6 md:p-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
          <Minimize2 className="w-6 h-6 text-white/70" />
          <h1 className="text-xl font-medium tracking-tight">BigTire</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm font-mono text-white/40 tracking-widest hidden md:block">
            {activeView === 'home' ? 'P = F/A' : activeView.toUpperCase()}
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors z-50 mix-blend-difference"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="p-6 md:p-10 flex justify-end">
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="w-8 h-8 text-white/70" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-10 text-3xl md:text-5xl font-light tracking-tight">
              <button 
                onClick={() => navigateTo('home')}
                className={`transition-all hover:scale-105 ${activeView === 'home' ? 'text-white font-medium' : 'text-white/40 hover:text-white/80'}`}
              >
                Home
              </button>
              <button 
                onClick={() => navigateTo('contact')}
                className={`transition-all hover:scale-105 ${activeView === 'contact' ? 'text-white font-medium' : 'text-white/40 hover:text-white/80'}`}
              >
                Contact
              </button>
              <button 
                onClick={() => navigateTo('donate')}
                className={`transition-all hover:scale-105 ${activeView === 'donate' ? 'text-white font-medium' : 'text-white/40 hover:text-white/80'}`}
              >
                Donate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- VIEWS --- */}
      <div className="flex-1 relative">
        
        {/* HOMEPAGE VIEW (Hidden via CSS when inactive to preserve state) */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${activeView === 'home' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
          <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto relative">
            
            <AnimatePresence mode="wait">
              {step === 'initial' && activeView === 'home' && (
                <motion.div 
                  key="initial"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", y: -40 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col items-center text-center space-y-12"
                >
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                      Drop the weight. <br/> Expand the surface.
                    </h2>
                    <p className="text-white/40 text-lg">
                      Input the perceived impossibility. We will map the hidden context until the pressure drops to zero.
                    </p>
                  </div>

                  <form onSubmit={handleInitialDrop} className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-purple-500/0 to-red-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 transition-all duration-300 focus-within:border-white/30 focus-within:bg-white/10 shadow-2xl">
                      <input 
                        type="text"
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder="e.g. I need to build a billion dollar company in 1 week..."
                        className="w-full bg-transparent text-white px-6 py-5 text-lg md:text-xl outline-none placeholder:text-white/20 font-light"
                        autoFocus={activeView === 'home'}
                      />
                      <button 
                        type="submit"
                        disabled={!problem.trim() || isLoading}
                        className="mr-2 p-4 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {(step === 'expanding' || step === 'transparent') && activeView === 'home' && (
                <motion.div 
                  key="expanding"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col"
                >
                  <div className="flex-1 w-full overflow-y-auto pb-8 space-y-8 scroll-smooth pr-2">
                    <div className="pb-8 border-b border-white/10 mb-8 opacity-70 mt-4">
                      <h3 className="text-sm font-mono text-white/40 mb-2 uppercase tracking-widest">Core Concept (F)</h3>
                      <p className="text-2xl font-light">{problem}</p>
                    </div>

                    {messages.slice(1).map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col ${msg.role === 'model' ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-3 mb-2 opacity-50">
                          {msg.role === 'model' ? <Sparkles className="w-4 h-4" /> : <CornerDownRight className="w-4 h-4" />}
                          <span className="text-xs font-mono uppercase tracking-widest">
                            {msg.role === 'model' ? 'Cognitive Engine' : 'User'}
                          </span>
                        </div>
                        <div className={`text-lg md:text-xl font-light leading-relaxed max-w-[90%] md:max-w-[85%] whitespace-pre-wrap
                          ${msg.role === 'model' ? 'text-white' : 'text-neutral-400'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-start gap-4 animate-in fade-in duration-500">
                        <Loader2 className="w-5 h-5 animate-spin text-white/40 mt-1" />
                        <span className="text-white/40 font-mono text-sm uppercase tracking-widest animate-pulse">Calculating Surface Area Expansion...</span>
                      </div>
                    )}
                    
                    {/* Spacer so the last message always clears the bottom fixed input bar */}
                    <div className="h-40 md:h-48 shrink-0" />
                    <div ref={messagesEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {step === 'expanding' && activeView === 'home' && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50"
              >
                <div className="max-w-3xl mx-auto flex flex-col gap-4 pointer-events-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Pressure Status</span>
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-white"
                            animate={{ width: `${Math.max(10, 100 - (area * 5))}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <span className="font-mono text-sm">{(100 / area).toFixed(1)} P</span>
                      </div>
                    </div>

                    <button 
                      onClick={calculateTransparency}
                      disabled={isLoading || messages.length < 3}
                      className="text-sm font-medium tracking-wide text-white/70 hover:text-white transition-colors disabled:opacity-30 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      FORCE TRANSPARENCY
                    </button>
                  </div>

                  <form onSubmit={handleAnswer} className="relative flex items-center bg-white/5 border border-white/10 rounded-xl p-1 transition-all focus-within:border-white/30 focus-within:bg-white/10 shadow-xl backdrop-blur-md">
                    <input 
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="Provide context..."
                      className="w-full bg-transparent text-white px-5 py-4 text-[16px] outline-none placeholder:text-white/20"
                    />
                    <button 
                      type="submit"
                      disabled={!inputVal.trim() || isLoading}
                      className="mr-1 p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step === 'transparent' && activeView === 'home' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-auto z-50"
              >
                <button 
                  onClick={() => {
                    setStep('initial');
                    setProblem('');
                    setMessages([]);
                    setArea(1);
                  }}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  <Sparkles className="w-5 h-5" />
                  Drop Another Weight
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTACT VIEW */}
        <AnimatePresence>
          {activeView === 'contact' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black"
            >
              <div className="max-w-md w-full space-y-12 text-center">
                <div className="space-y-4">
                  <h2 className="text-3xl font-light tracking-tight text-white">Contact Developer</h2>
                  <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Connect & Collaborate</p>
                </div>
                
                <div className="flex flex-col gap-6 items-center">
                  <a href="mailto:azizinnovates@outlook.com" className="flex items-center gap-4 text-white/70 hover:text-white transition-colors group">
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-light tracking-wide">azizinnovates@outlook.com</span>
                  </a>
                  
                  <a href="tel:+917635000668" className="flex items-center gap-4 text-white/70 hover:text-white transition-colors group">
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Phone className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-light tracking-wide">+91 7635000668</span>
                  </a>
                  
                  <a href="https://instagram.com/abdulazizgauhar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/70 hover:text-white transition-colors group">
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Instagram className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-light tracking-wide">@abdulazizgauhar</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DONATE VIEW */}
        <AnimatePresence>
          {activeView === 'donate' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black"
            >
              <div className="max-w-md w-full space-y-12 text-center">
                <div className="space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <HeartHandshake className="w-8 h-8 text-white/80" />
                  </div>
                  <h2 className="text-3xl font-light tracking-tight text-white">Support the Project</h2>
                  <p className="text-white/40 text-sm font-mono uppercase tracking-widest px-4 leading-relaxed">
                    If this tool helped reduce the pressure in your life, consider expanding ours.
                  </p>
                </div>
                
                <div className="pt-8 border-t border-white/10 flex flex-col items-center">
                  <a 
                    href="upi://pay?pa=abdul0668@ptyes&pn=Abdul%20Aziz&am=100.00&cu=INR&tn=Payment%20for%20Goods"
                    className="group relative inline-flex items-center justify-center"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                    
                    {/* Styled like FORCE TRANSPARENCY but more prominent, as requested */}
                    <div className="relative px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-medium tracking-wide rounded-full transition-all flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
                      CLICK TO PAY (UPI)
                    </div>
                  </a>
                  <span className="text-xs text-white/20 mt-6 tracking-wide font-mono">SECURE TRANSACTION VIA UPI</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
