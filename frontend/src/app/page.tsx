'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Medecin } from '@/types';
import {
  Stethoscope,
  Calendar,
  Shield,
  Bot,
  Clock,
  ArrowRight,
  Activity,
  HeartPulse,
  Award,
  CheckCircle2,
  Users,
  User,
  Sparkles,
  Phone,
  MapPin,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, isStaff, isPatient } = useAuth();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMedecins()
      .then((res) => setMedecins(res.slice(0, 4)))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
            }}>
              <Stethoscope size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Clinique <span className="gradient-text">SantéPlus</span>
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.7rem',
                color: '#38bdf8',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Smart Clinique & IA
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <a href="#specialites" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
              Nos Spécialistes
            </a>
            <a href="#innovations" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
              Innovations
            </a>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isStaff ? (
                  <Link
                    href="/dashboard"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    <LayoutDashboard size={16} />
                    Tableau de Bord Staff ({user?.prenom})
                  </Link>
                ) : (
                  <Link
                    href="/espace-patient"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    <Calendar size={16} />
                    Mon Espace Patient ({user?.prenom})
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <Link
                  href="/login"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
                >
                  <LogIn size={15} />
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.85rem',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                  }}
                >
                  <Users size={15} />
                  Inscription Patient
                </Link>
                <Link
                  href="/login?redirect=/espace-patient"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.95rem' }}
                >
                  <Calendar size={15} />
                  Prendre RDV
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 2rem 4rem',
        overflow: 'hidden',
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            <Sparkles size={15} />
            Plateforme Médicale Intelligente de Nouvelle Génération
          </div>

          <h1 style={{
            fontSize: '3.25rem',
            fontWeight: 900,
            color: '#f8fafc',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
          }}>
            La Gestion Clinique Réinventée : <br />
            <span className="gradient-text">Plus Rapide, Plus Sûre, Plus Intelligente</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#94a3b8',
            maxWidth: '720px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            Centralisez vos dossiers médicaux, automatisez vos plannings sans double réservation,
            détectez instantanément les allergies médicamenteuses et offrez à vos patients une expérience sans attente.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href={isAuthenticated ? (isStaff ? '/dashboard' : '/espace-patient') : '/login?redirect=/espace-patient'}
              className="btn btn-primary"
              style={{
                fontSize: '1.05rem',
                padding: '0.85rem 1.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Calendar size={20} />
              {isAuthenticated && isPatient ? 'Mon Espace Patient & RDV' : 'Prendre Rendez-vous en Ligne'}
              <ArrowRight size={18} />
            </Link>

            {isStaff ? (
              <Link
                href="/dashboard"
                className="btn btn-secondary"
                style={{
                  fontSize: '1.05rem',
                  padding: '0.85rem 1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <LayoutDashboard size={20} />
                Tableau de Bord Médical (Staff)
              </Link>
            ) : isAuthenticated ? (
              <Link
                href="/espace-patient"
                className="btn btn-secondary"
                style={{
                  fontSize: '1.05rem',
                  padding: '0.85rem 1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <User size={20} />
                Mon Dossier & Ordonnances
              </Link>
            ) : (
              <Link
                href="/register"
                className="btn btn-secondary"
                style={{
                  fontSize: '1.05rem',
                  padding: '0.85rem 1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                }}
              >
                <Users size={20} />
                Créer un Compte Patient
              </Link>
            )}
          </div>

          {/* Quick trust metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '4rem',
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>0 min</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Conflits de planning grâce à l'IA</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Dossiers médicaux numérisés & sécurisés</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>24/7</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Assistant IA et prise de créneau directe</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>Temps réel</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>File d'attente au cabinet synchronisée</div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovations & Smart features Section */}
      <section id="innovations" style={{ padding: '4rem 2rem', background: 'rgba(255, 255, 255, 0.01)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Fonctionnalités Intelligentes (Smart Clinique)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
              Répondant aux exigences du cahier des charges pour l'automatisation et la sécurité des soins.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Suggestion de Créneaux Sans Conflit
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                L'algorithme analyse l'emploi du temps des médecins et propose instantanément le créneau disponible le plus précoce sans double réservation.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Alerte Allergies Médicamenteuses
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Contrôle en direct lors de la saisie d'ordonnance : détection automatique des contre-indications selon les allergies enregistrées dans le dossier patient.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Salle d'Attente Interactive & Directe
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Gestion visuelle du flux des patients pour la secrétaire et le praticien : transition En attente ➔ En consultation ➔ Terminé en un clic.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Bot size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Assistant Conversationnel IA
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Réservation de consultations en langage naturel et réponse aux questions fréquentes 24h/24 pour les patients et le personnel.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.12)',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Dossier Médical & Constantes
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Suivi complet : tension artérielle, poids, température, antécédents, examens biologiques et ordonnances téléchargeables en PDF.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Facturation & Tableaux Décisionnels
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Génération automatique des factures, suivi des règlements sur place (carte/espèces), analyse de la rentabilité et taux d'absentéisme.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors / Specialists Section */}
      <section id="specialites" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Nos Médecins & Praticiens Spécialistes
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                Une équipe médicale d'excellence disponible pour vos consultations sur rendez-vous.
              </p>
            </div>

            <Link
              href="/medecins"
              style={{
                color: '#38bdf8',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Voir toute l'équipe
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {medecins.map((m) => (
              <div key={m.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}>
                    {m.prenom[0]}{m.nom[0]}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                    Dr. {m.prenom} {m.nom}
                  </h3>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'inline-block',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    marginBottom: '0.75rem',
                  }}>
                    {m.specialite}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>Tarif : <strong style={{ color: '#22c55e' }}>{m.tarif ? `${m.tarif} TND` : '60 TND'}</strong></div>
                    <div>Durée : {m.dureeConsultation || 30} minutes</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <Link
                    href={isAuthenticated ? '/espace-patient' : '/login?redirect=/espace-patient'}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                  >
                    Réserver avec ce médecin
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-color)',
        padding: '3rem 2rem 2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Stethoscope size={20} color="#38bdf8" />
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>Clinique SantéPlus</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
              Application de gestion de clinique intelligente (Smart Clinique) • Conforme au cahier des charges
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tableau de bord</Link>
            <Link href="/salle-attente" style={{ color: '#94a3b8', textDecoration: 'none' }}>Salle d'attente</Link>
            <Link href="/consultations" style={{ color: '#94a3b8', textDecoration: 'none' }}>Consultations</Link>
            <Link href="/statistiques" style={{ color: '#94a3b8', textDecoration: 'none' }}>Statistiques</Link>
            <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Espace Pro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
