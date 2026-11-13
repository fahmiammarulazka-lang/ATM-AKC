import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Trash2,
  GraduationCap,
  HelpCircle,
  Loader2,
  Radio,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CARD_TIER_CONFIGS, formatRupiah } from '../utils/bankUtils';

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  botPersona: 'general' | 'career' | 'spin' | 'admin';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

const AI_BOT_PERSONAS: {
  id: 'general' | 'career' | 'spin' | 'admin';
  name: string;
  badge: string;
  icon: string;
  desc: string;
  welcome: string;
}[] = [
  {
    id: 'general',
    name: 'Bot Utama Nusantara AI',
    badge: 'Ensiklopedia Seluruh Aplikasi',
    icon: '🤖',
    desc: 'Menjelaskan seluruh tombol, fitur Mobile Banking, ATM, Kartu 3D, dan Tutorial Kartu Baru secara lengkap.',
    welcome:
      'Halo! Saya Bot Utama Nusantara AI (ditenagai Gemini 1.5 Flash). Anda bisa bertanya apa pun tentang seluruh tombol dan fitur di aplikasi Bank Nusantara ini — baik lewat ketikan maupun memakai Voice Chat / Suara!',
  },
  {
    id: 'career',
    name: 'Bot Spesialis Karir, Mining Kripto & Lelang Supercar',
    badge: 'Gaji, Suit, Mining & Lelang VIP',
    icon: '💎',
    desc: 'Ahli menjelaskan 9 Lowongan Kerja (Target Klik 5x Lipat), Suit Komputer, serta 💎 Pusat Mining Kripto, Lelang Supercar & Cyber Vault.',
    welcome:
      'Halo! Saya Bot Spesialis Karir, Mining Kripto & Lelang Supercar (Gemini 1.5 Flash). Tanyakan apa saja tentang 9 Gaji Pekerjaan, Arena Suit, 12 Rig Mining GPU/Quantum, atau cara Jual Lelang Supercar dengan profit hingga +250%!',
  },
  {
    id: 'spin',
    name: 'Bot Spesialis Spin Wheel & Jackpot',
    badge: '20 Hadiah & 100 Paket Koin',
    icon: '🎡',
    desc: 'Ahli menjelaskan Spin the Wheel (Rp 100rb s/d Rp 20 Juta), peluang 1 dari 1.000 Kuadriliun, & 100 Paket Koin.',
    welcome:
      'Halo! Saya Bot Spesialis Spin the Wheel & Koin (Gemini 1.5 Flash). Mau tanya cara beli 100 paket koin, diskon spin, atau rahasia Jackpot Rp 15 Juta & Rp 20 Juta? Silakan ketik atau bicara pakai mikrofon!',
  },
  {
    id: 'admin',
    name: 'Bot Spesialis Admin, Pengaturan & Fitur Dihapus',
    badge: 'PIN 159357, 60+ Pengaturan & 56 Super Tools',
    icon: '🛡️',
    desc: 'Ahli menjelaskan PIN Admin 159357, 60+ Pengaturan Lengkap, cara Hapus & Pulihkan Fitur Dihapus, Mintol 35 Fitur, & 56 Super Tools.',
    welcome:
      'Halo! Saya Bot Spesialis Otoritas Admin & Pengaturan Lengkap (Gemini 1.5 Flash). Tanyakan cara menghapus/memulihkan fitur di Pengaturan, menyetujui kartu baru agar Tutorial terbuka, atau fungsi 56 Super Tools!',
  },
];

const QUICK_QUESTIONS = [
  'Jelaskan semua tombol dari atas sampai bawah di aplikasi ini!',
  'Apa saja 4 fitur di dalam 💎 Mining & Lelang VIP pengganti Kerajaan?',
  'Bagaimana cara menghapus fitur dan memulihkan Fitur yang Dihapus di Pengaturan?',
  'Kenapa kartu baru harus disetujui Admin dulu baru ada tutorialnya?',
  'Sebutkan 9 gaji Lowongan Pekerjaan, syarat level, dan target kliknya!',
  'Bagaimana cara kerja Spin the Wheel, peluang 20 Juta, dan beli koin?',
  'Berapa PIN Panel Admin dan apa saja fungsi 56 Super Tools?',
];

export const AppAiBotModal: React.FC = () => {
  const {
    currentAccount,
    isAiBotModalOpen,
    setIsAiBotModalOpen,
    setIsTutorialModalOpen,
    featureConfigs,
  } = useBank();

  const [selectedBot, setSelectedBot] = useState<'general' | 'career' | 'spin' | 'admin'>(
    'general'
  );
  const [modeTab, setModeTab] = useState<'chat' | 'voice_call'>('chat');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'ai-welcome-1',
      role: 'assistant',
      botPersona: 'general',
      text: AI_BOT_PERSONAS[0].welcome,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Gemini 1.5 Flash',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoSpeakReply, setAutoSpeakReply] = useState<boolean>(true);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceStatusText, setVoiceStatusText] = useState<string>(
    'Siap mendengarkan suara Anda (Bahasa Indonesia)'
  );

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech & mic when modal closes
  useEffect(() => {
    if (!isAiBotModalOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListeningMic(false);
      setIsSpeakingTts(false);
    }
  }, [isAiBotModalOpen]);

  if (!isAiBotModalOpen) return null;

  const activePersonaObj =
    AI_BOT_PERSONAS.find((b) => b.id === selectedBot) || AI_BOT_PERSONAS[0];

  const speakIndonesianText = (rawText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural speech
    const cleanSpeech = rawText
      .replace(/[*#_`~]/g, '')
      .replace(/\n+/g, '. ')
      .trim();
    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'id-ID';
    utterance.rate = 1.04;
    utterance.onstart = () => {
      setIsSpeakingTts(true);
      setVoiceStatusText('🔊 Bot AI sedang berbicara menjawab Anda...');
    };
    utterance.onend = () => {
      setIsSpeakingTts(false);
      setVoiceStatusText('Siap mendengarkan suara Anda (Bahasa Indonesia)');
    };
    utterance.onerror = () => {
      setIsSpeakingTts(false);
      setVoiceStatusText('Siap mendengarkan suara Anda (Bahasa Indonesia)');
    };
    setIsSpeakingTts(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTts(false);
    setVoiceStatusText('Suara dihentikan • Siap mendengarkan kembali');
  };

  const handleSendQuestion = async (customQuestion?: string) => {
    const questionText = (customQuestion ?? inputText).trim();
    if (!questionText || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      botPersona: selectedBot,
      text: questionText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuestion) setInputText('');
    setLiveTranscript('');
    setIsLoading(true);
    setVoiceStatusText('⚡ Gemini 1.5 Flash sedang menyusun penjelasan lengkap...');

    const contextSummary = currentAccount
      ? `Nama: ${currentAccount.fullName}, No. Rekening: ${currentAccount.accountNumber}, Status Kartu: ${currentAccount.cardStatus.toUpperCase()} (${
          currentAccount.cardStatus === 'active'
            ? 'Sudah Disetujui Admin & Tutorial Terbuka'
            : 'Menunggu Persetujuan Admin'
        }), Kasta: ${CARD_TIER_CONFIGS[currentAccount.cardTier].nameIndo}, Saldo: ${formatRupiah(
          currentAccount.balance
        )}, Level Kerja: Level ${currentAccount.jobLevel || 1}, Voucher Level: ${
          currentAccount.levelVouchers || 0
        }, Koin Spin: ${(currentAccount.spinCoins || 0).toLocaleString('id-ID')} Koin, Total Fitur Aplikasi: ${
          featureConfigs.length
        } Fitur.`
      : 'Belum ada kartu aktif.';

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: questionText,
          botPersona: selectedBot,
          contextSummary,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText =
        data?.reply ||
        'Maaf, terjadi gangguan koneksi. Silakan coba tanyakan kembali kepada Bot AI Bank Nusantara.';

      const botMsg: AiChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        botPersona: selectedBot,
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data?.modelUsed || 'Gemini 1.5 Flash',
      };

      setMessages((prev) => [...prev, botMsg]);

      if (autoSpeakReply || modeTab === 'voice_call') {
        speakIndonesianText(replyText);
      } else {
        setVoiceStatusText('Penjelasan lengkap selesai ditampilkan.');
      }
    } catch {
      const fallbackMsg: AiChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        botPersona: selectedBot,
        text: 'Halo! Sistem Bot AI Bank Nusantara siap membantu. Untuk membuka Panel Admin gunakan PIN **159357**, untuk membuka Tutorial pastikan kartu baru Anda sudah disetujui Admin, dan untuk membuka Kerajaan Sultan pastikan mencapai **Level 50**!',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Gemini 1.5 Flash (Offline Ready)',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoSpeakReply || modeTab === 'voice_call') {
        speakIndonesianText(fallbackMsg.text);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicrophoneRecording = () => {
    if (isListeningMic && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningMic(false);
      setVoiceStatusText('Mikrofon dimatikan.');
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceStatusText(
        'Browser ini belum mendukung perekaman suara langsung. Silakan ketik pertanyaan Anda dan Bot AI tetap akan menjawab dengan Suara Bahasa Indonesia!'
      );
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningMic(true);
        setLiveTranscript('');
        setVoiceStatusText('🎙️ Mendengarkan suara Anda... Silakan bicara sekarang!');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }
        if (interim) {
          setLiveTranscript(interim);
        }
        if (finalTranscript.trim()) {
          setLiveTranscript(finalTranscript.trim());
          setInputText(finalTranscript.trim());
          setIsListeningMic(false);
          handleSendQuestion(finalTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
        setVoiceStatusText(
          'Izin mikrofon belum aktif atau suara tidak terdengar. Coba klik tombol Bicara lagi atau ketik pertanyaan.'
        );
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningMic(false);
      setVoiceStatusText('Gagal memulai mikrofon. Pastikan izin mikrofon diaktifkan.');
    }
  };

  const handleSelectPersona = (personaId: 'general' | 'career' | 'spin' | 'admin') => {
    setSelectedBot(personaId);
    const p = AI_BOT_PERSONAS.find((b) => b.id === personaId);
    if (p) {
      const switchMsg: AiChatMessage = {
        id: `switch-${Date.now()}`,
        role: 'assistant',
        botPersona: personaId,
        text: p.welcome,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Gemini 1.5 Flash',
      };
      setMessages((prev) => [...prev, switchMsg]);
      if (autoSpeakReply) {
        speakIndonesianText(p.welcome);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[125] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="max-w-5xl w-full bg-[#091020] border-2 border-cyan-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-cyan-500/30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30 shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  ⚡ POWERED BY GEMINI 1.5 FLASH
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  🎙️ VOICE CHAT &amp; SUARA AKTIF
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                🤖 Bot-Bot AI Khusus Aplikasi Bank Nusantara (Tanya Jawab &amp; Voice Chat)
              </h2>
              <p className="text-xs text-slate-300">
                Tanyakan penjelasan lengkap fitur atau tombol apa pun lewat ketikan atau suara!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAiBotModalOpen(false);
                setIsTutorialModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>🎓 Buka Tutorial</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAiBotModalOpen(false)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Specialized Application Bots Selector + Mode Toggle */}
        <div className="bg-slate-950 border-b border-slate-800 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
              Pilih Bot AI Spesialis Aplikasi:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setModeTab('chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                  modeTab === 'chat'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>💬 Mode Chat &amp; Suara</span>
              </button>
              <button
                type="button"
                onClick={() => setModeTab('voice_call')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                  modeTab === 'voice_call'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>📞 Mode Voice Chat / Telepon Langsung</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !autoSpeakReply;
                  setAutoSpeakReply(nextVal);
                  if (!nextVal) stopSpeaking();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                  autoSpeakReply
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {autoSpeakReply ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Auto-Suara: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Auto-Suara: OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {AI_BOT_PERSONAS.map((bot) => (
              <button
                key={bot.id}
                type="button"
                onClick={() => handleSelectPersona(bot.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  selectedBot === bot.id
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-xl shrink-0">{bot.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">{bot.name}</div>
                  <div className="text-[10px] font-bold text-cyan-300 truncate">{bot.badge}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MODE 1: CHAT + VOICE ASSISTANT */}
        {modeTab === 'chat' ? (
          <>
            {/* Quick Questions Bar */}
            <div className="bg-slate-900/70 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-black uppercase text-amber-400 shrink-0">
                ⚡ Tanya Cepat:
              </span>
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuestion(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-semibold text-slate-200 shrink-0 cursor-pointer transition"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#070c18]">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const persona =
                  AI_BOT_PERSONAS.find((b) => b.id === msg.botPersona) || AI_BOT_PERSONAS[0];
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-2xl p-4 space-y-2 ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-slate-900 border border-cyan-500/30 text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1.5">
                        <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
                          <span>{isUser ? '🧑' : persona.icon}</span>
                          <span>
                            {isUser
                              ? currentAccount?.fullName || 'Anda (Nasabah)'
                              : `${persona.name} • ${msg.modelUsed || 'Gemini 1.5 Flash'}`}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                      </div>

                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </div>

                      {!isUser && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              isSpeakingTts ? stopSpeaking() : speakIndonesianText(msg.text)
                            }
                            className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                          >
                            {isSpeakingTts ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                                <span>Hentikan Suara</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>🔊 Putar Suara Penjelasan</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 max-w-md text-xs text-cyan-200 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{activePersonaObj.name} (Gemini 1.5 Flash) sedang menjawab...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Bottom Input & Voice Bar */}
            <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 space-y-2">
              {(isListeningMic || liveTranscript || isSpeakingTts) && (
                <div className="px-3 py-2 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-between gap-2 text-xs text-cyan-200">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="font-bold">
                      {liveTranscript ? `🎙️ Terdengar: "${liveTranscript}"` : voiceStatusText}
                    </span>
                  </div>
                  {isSpeakingTts && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Stop Suara
                    </button>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuestion();
                }}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleMicrophoneRecording}
                  className={`px-4 py-3 rounded-2xl font-black text-xs flex items-center gap-2 cursor-pointer transition shrink-0 ${
                    isListeningMic
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                  }`}
                >
                  {isListeningMic ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop Rekam</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>🎙️ Bicara (Voice Chat)</span>
                    </>
                  )}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Tanya apa saja ke ${activePersonaObj.name} (Gemini 1.5 Flash)...`}
                  className="flex-1 min-w-[200px] px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: `reset-${Date.now()}`,
                        role: 'assistant',
                        botPersona: selectedBot,
                        text: activePersonaObj.welcome,
                        timestamp: new Date().toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        modelUsed: 'Gemini 1.5 Flash',
                      },
                    ])
                  }
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Bersihkan Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* MODE 2: INTERACTIVE LIVE VOICE CALL / VOICE CHAT */
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#070c18] to-slate-950 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-2 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                📞 MODE VOICE CHAT INTERAKTIF • GEMINI 1.5 FLASH
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Ngobrol Suara Langsung dengan {activePersonaObj.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Tekan tombol mikrofon besar di bawah untuk bicara menggunakan suara Anda, atau pilih
                topik suara cepat. Bot AI akan langsung menjawab dengan suara Bahasa Indonesia!
              </p>
            </div>

            {/* Animated Voice Avatar */}
            <div className="relative flex items-center justify-center my-2">
              {(isListeningMic || isSpeakingTts) && (
                <div className="absolute w-36 h-36 rounded-full bg-cyan-500/25 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={toggleMicrophoneRecording}
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1.5 border-4 transition shadow-2xl cursor-pointer relative z-10 ${
                  isListeningMic
                    ? 'bg-rose-600 border-rose-300 text-white scale-105'
                    : isSpeakingTts
                    ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                    : 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 text-slate-950 hover:scale-105'
                }`}
              >
                {isListeningMic ? (
                  <>
                    <MicOff className="w-9 h-9" />
                    <span className="text-[11px] font-black">STOP BICARA</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9" />
                    <span className="text-[11px] font-black">KLIK BICARA</span>
                  </>
                )}
              </button>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-bold text-cyan-300 max-w-xl">
              {liveTranscript ? `🎙️ "${liveTranscript}"` : voiceStatusText}
            </div>

            {/* Latest Answer Card in Voice Mode */}
            {messages.length > 0 && (
              <div className="max-w-2xl w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">
                    🔊 Jawaban Suara Terakhir ({activePersonaObj.name}):
                  </span>
                  {isSpeakingTts ? (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Hentikan Suara
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => speakIndonesianText(messages[messages.length - 1].text)}
                      className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-black cursor-pointer"
                    >
                      Putar Ulang Suara
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
                  {messages[messages.length - 1].text}
                </p>
              </div>
            )}

            {/* Quick Voice Prompts */}
            <div className="max-w-2xl w-full space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Atau Klik Pertanyaan di Bawah untuk Langsung Dijawab dengan Suara:
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_QUESTIONS.slice(0, 5).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendQuestion(q)}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-slate-200 cursor-pointer transition"
                  >
                    🔊 "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
