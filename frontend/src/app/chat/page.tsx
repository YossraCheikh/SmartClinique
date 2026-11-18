'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  Stethoscope,
  Clock,
  Calendar,
  ShieldAlert,
  Copy,
  Check,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';

export default function ChatPage() {
  const { user, isMedecin } = useAuth();
  const { messages, loading, sendMessage, resetChat } = useChat();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;
    setInput('');
    await sendMessage(text);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser l\'historique de conversation ?')) {
      resetChat();
    }
  };

  const suggestionCategories = [
    {
      title: '📅 Réserver un RDV',
      icon: CalendarCheck,
      color: '#10b981',
      prompts: [
        'Je veux un rendez-vous avec le cardiologue demain à 9h',
        'Réserver une consultation pédiatrique pour mon enfant',
        'Prendre un RDV avec un dermatologue cette semaine',
        'Je veux voir un neurologue — réserver maintenant',
      ],
    },
    {
      title: '🩺 Toutes les Spécialités',
      icon: Stethoscope,
      color: '#38bdf8',
      prompts: [
        'Réserver avec un gynécologue / obstétricien',
        'Consultation ophtalmologie — prendre RDV',
        'Je veux voir un chirurgien orthopédiste',
        'RDV avec un pneumologue pour une gêne respiratoire',
      ],
    },
    {
      title: '🔍 Orientation Symptômes',
      icon: HelpCircle,
      color: '#c084fc',
      prompts: [
        'J\'ai une forte toux et de la fièvre depuis 2 jours, quel médecin voir ?',
        'Baisse brutale de vision et fatigue oculaire — quel spécialiste ?',
        'Douleurs lombaires aiguës après un effort',
        'Palpitations cardiaques et essoufflement',
      ],
    },
    {
      title: '💊 Conseils & Santé',
      icon: Sparkles,
      color: '#f59e0b',
      prompts: [
        'Conseils pour réguler la tension artérielle naturellement',
        'Règles d\'hygiène pour prévenir les infections saisonnières',
        'Quels examens préventifs faire chaque année ?',
      ],
    },
  ];


  // Helper to format basic markdown (bold, bullet points, line breaks)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parseBold = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: '#fff', fontWeight: 700 }}>
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
              gap: '0.45rem',
              margin: '0.25rem 0',
            }}
          >
            <span style={{ color: 'var(--primary-light)', flexShrink: 0, fontWeight: 'bold' }}>•</span>
            <div>{parseBold(content)}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '0.5rem' }} />;
      }

      return (
        <div key={lineIdx} style={{ margin: '0.15rem 0' }}>
          {parseBold(line)}
        </div>
      );
    });
  };

  return (
    <AppLayout>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 6px 20px var(--primary-glow)',
          }}>
            <Bot size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              Assistant IA & <span className="gradient-text">Prise de RDV</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Intelligence artificielle connectée à la base de données de la clinique (consultations, praticiens et agenda)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user ? (
            <span className="badge badge-primary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}>
              <User size={13} />
              Session : {isMedecin ? `Dr. ${user.nom}` : `${user.prenom} ${user.nom}`}
            </span>
          ) : (
            <span className="badge badge-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
              Session Visiteur (Non connecté)
            </span>
          )}
          <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            <Trash2 size={15} />
            Effacer mon historique
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '1.5rem',
        height: 'calc(100vh - 220px)',
        minHeight: '620px',
      }}>
        {/* Chat Stream Panel */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Medical Disclaimer Banner */}
          <div style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.78rem',
            color: '#fbbf24',
          }}>
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>Information médicale & Prise de RDV :</strong> L'assistant peut programmer vos rendez-vous et vous orienter. En cas d'urgence vitale, contactez le 15 ou le 112.
            </span>
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    maxWidth: isUser ? '80%' : '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: isUser ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: isUser ? '0 4px 14px var(--primary-glow)' : 'none',
                  }}>
                    {isUser ? <User size={18} /> : <Bot size={20} color="var(--primary-light)" />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%' }}>
                    {/* Message Bubble */}
                    <div style={{
                      padding: '1.1rem 1.35rem',
                      borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: isUser
                        ? 'var(--primary-gradient)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      color: isUser ? '#fff' : 'var(--text-main)',
                      fontSize: '0.92rem',
                      lineHeight: '1.65',
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser ? '0 6px 20px var(--primary-glow)' : 'none',
                    }}>
                      {renderFormattedText(msg.content)}
                    </div>

                    {/* Interactive Appointment Card if booked */}
                    {msg.appointment && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          marginTop: '0.25rem',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <span className="badge badge-emerald">
                            <CheckCircle2 size={13} />
                            Rendez-vous Confirmé #{msg.appointment.id}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Enregistré en direct
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.84rem', marginBottom: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Praticien</span>
                            <p style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{msg.appointment.medecin}</p>
                            {msg.appointment.specialite && <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)' }}>{msg.appointment.specialite}</span>}
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Patient</span>
                            <p style={{ fontWeight: 700, color: '#fff' }}>{msg.appointment.patient}</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Date & Heure</span>
                            <p style={{ fontWeight: 600, color: '#fff' }}>📅 {msg.appointment.date} à {msg.appointment.heure}</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Motif</span>
                            <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{msg.appointment.motif}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem' }}>
                          <Link href="/rendez-vous" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                            <Calendar size={13} />
                            Consulter dans l'Agenda
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Copy Action */}
                    {!isUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingLeft: '0.25rem' }}>
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} color="var(--accent-emerald)" />
                              <span style={{ color: 'var(--accent-emerald)' }}>Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copier la réponse</span>
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <RefreshCw size={18} className="spin" color="var(--primary-light)" />
                </div>
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '4px 18px 18px 18px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Sparkles size={16} color="var(--primary-light)" />
                  <span>L'assistant Gemini analyse et traite votre demande...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(13, 19, 34, 0.85)',
            display: 'flex',
            gap: '0.75rem',
          }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Posez une question médicale ou demandez un rendez-vous (ex: 'Je veux un RDV avec le cardiologue')..."
              className="form-input"
              style={{
                resize: 'none',
                padding: '0.85rem 1.1rem',
                fontSize: '0.92rem',
                height: '52px',
              }}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                width: '52px',
                height: '52px',
                padding: 0,
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Right Info & Suggestions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          {/* Quick Questions Library */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--primary-light)" />
              Sujets & Actions rapides
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {suggestionCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div key={i}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: cat.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.5rem',
                    }}>
                      <Icon size={14} />
                      {cat.title}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {cat.prompts.map((p, j) => (
                        <button
                          key={j}
                          onClick={() => handleSend(p)}
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                            e.currentTarget.style.borderColor = 'var(--primary-light)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capabilities Box */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-light)' }}>
              Prise de Rendez-vous Automatisée
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Vous pouvez demander directement à l'assistant de réserver une consultation. Il sélectionne le praticien, vérifie le planning et persiste le rendez-vous dans la clinique.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
