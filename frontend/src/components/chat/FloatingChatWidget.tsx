'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  X,
  Send,
  Maximize2,
  Sparkles,
  User,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isMedecin } = useAuth();
  const { messages, loading, sendMessage, resetChat, isFloatingOpen, setIsFloatingOpen } = useChat();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isFloatingOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isFloatingOpen, loading]);

  // If on /chat or /login page, don't show the floating bubble
  if (pathname === '/chat' || pathname === '/login') {
    return null;
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    await sendMessage(textToSend);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous effacer cette conversation ?')) {
      resetChat();
    }
  };

  const quickPrompts: { label: string; message: string }[] = [
    { label: '❤️ Cardiologue', message: 'Je veux réserver un rendez-vous avec le cardiologue demain à 9h' },
    { label: '👶 Pédiatre', message: 'Réserver une consultation pédiatrique pour mon enfant' },
    { label: '🦴 Orthopédiste', message: 'Je veux voir le chirurgien orthopédiste — réserver un RDV' },
    { label: '👁️ Ophtalmologiste', message: 'Prendre un rendez-vous avec l\'ophtalmologiste' },
    { label: '🫁 Pneumologue', message: 'Réserver un RDV avec le pneumologue pour gêne respiratoire' },
    { label: '🧠 Neurologue', message: 'Je veux consulter un neurologue — prendre rendez-vous' },
  ];

  // Helper to format basic markdown (bold, bullet points, line breaks)
  const renderFormatted = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parseBold = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      };

      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ');
      const content = isBullet ? trimmed.replace(/^(\*|•|-)\s+/, '') : line;

      if (isBullet) {
        return (
          <div
            key={lineIdx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              margin: '0.2rem 0',
            }}
          >
            <span style={{ color: 'var(--primary-light)', flexShrink: 0 }}>•</span>
            <div>{parseBold(content)}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '0.45rem' }} />;
      }

      return (
        <div key={lineIdx} style={{ margin: '0.15rem 0' }}>
          {parseBold(line)}
        </div>
      );
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!isFloatingOpen && (
        <button
          onClick={() => setIsFloatingOpen(true)}
          style={{
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(2, 132, 199, 0.55), 0 0 25px rgba(56, 189, 248, 0.45)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
          }}
          title="Ouvrir l'Assistant IA Clinique Santé+"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
        >
          <Bot size={28} />
          {/* Active Status Badge */}
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              border: '2px solid var(--bg-main)',
              boxShadow: '0 0 8px var(--accent-emerald)',
            }}
          />
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isFloatingOpen && (
        <div
          className="glass-panel"
          style={{
            width: '420px',
            maxWidth: 'calc(100vw - 2rem)',
            height: '620px',
            maxHeight: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(2, 132, 199, 0.25)',
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Assistant IA & RDV</h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    color: user ? 'var(--primary-light)' : 'var(--accent-emerald)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: user ? 'var(--primary-color)' : 'var(--accent-emerald)',
                    }}
                  />
                  {user
                    ? `Session : ${isMedecin ? `Dr. ${user.nom}` : `${user.prenom} ${user.nom}`}`
                    : 'Session Visiteur (Non connecté)'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                onClick={handleReset}
                className="btn-icon btn-secondary"
                style={{ width: '30px', height: '30px' }}
                title="Réinitialiser la conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => {
                  setIsFloatingOpen(false);
                  router.push('/chat');
                }}
                className="btn-icon btn-secondary"
                style={{ width: '30px', height: '30px' }}
                title="Ouvrir en plein écran (/chat)"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setIsFloatingOpen(false)}
                className="btn-icon btn-secondary"
                style={{ width: '30px', height: '30px' }}
                title="Fermer la bulle"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '0.55rem 0.85rem',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
            }}
          >
            {quickPrompts.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.message)}
                disabled={loading}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {q.label}
              </button>
            ))}

          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isUser ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {isUser ? <User size={14} /> : <Bot size={15} color="var(--primary-light)" />}
                  </div>

                  <div style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                    <div
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: isUser
                          ? 'var(--primary-gradient)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isUser ? 'none' : '1px solid var(--border-color)',
                        color: isUser ? '#fff' : 'var(--text-main)',
                        fontSize: '0.84rem',
                        lineHeight: '1.45',
                        boxShadow: isUser ? '0 4px 14px var(--primary-glow)' : 'none',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {renderFormatted(msg.content)}
                    </div>

                    {/* Appointment Card in Floating Bubble */}
                    {msg.appointment && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <CheckCircle2 size={13} />
                          RDV #{msg.appointment.id} Confirmé
                        </div>
                        <p style={{ margin: '0.15rem 0' }}><strong>Médecin:</strong> {msg.appointment.medecin}</p>
                        <p style={{ margin: '0.15rem 0' }}><strong>Date:</strong> {msg.appointment.date} à {msg.appointment.heure}</p>
                        <Link
                          href="/rendez-vous"
                          onClick={() => setIsFloatingOpen(false)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--primary-light)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            marginTop: '0.4rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Calendar size={12} />
                          Voir l'agenda
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}

                    {!isUser && msg.id !== 'welcome' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.2rem' }}>
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={11} color="var(--accent-emerald)" />
                              <span style={{ color: 'var(--accent-emerald)' }}>Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={14} className="spin" color="var(--primary-light)" />
                </div>
                <div
                  style={{
                    padding: '0.6rem 0.95rem',
                    borderRadius: '4px 16px 16px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Sparkles size={14} color="var(--primary-light)" />
                  <span>Traitement de votre demande...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(13, 19, 34, 0.85)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez une question ou demandez un RDV..."
              className="form-input"
              style={{ fontSize: '0.84rem', padding: '0.6rem 0.85rem' }}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.6rem 0.85rem',
                opacity: !input.trim() || loading ? 0.6 : 1,
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              }}
              title="Envoyer"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
