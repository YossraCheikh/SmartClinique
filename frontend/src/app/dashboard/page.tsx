'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatDoctorName, formatPatientName, formatAppointmentTime } from '@/lib/formatters';
import {
  Users,
  UserCheck,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlusCircle,
  Bot,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Scissors,
  Eye,
} from 'lucide-react';


export default function DashboardPage() {
  const { user, isMedecin, isSecretaire, isAdmin } = useAuth();
  const isDoctorOnly = isMedecin && !isSecretaire && !isAdmin;
  const isSecretaryOnly = isSecretaire && !isMedecin && !isAdmin;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients ?? '...',
      icon: Users,
      color: '#0284c7',
      bgGlow: 'rgba(2, 132, 199, 0.15)',
      trend: '+12% ce mois',
      href: '/patients',
    },
    {
      title: isDoctorOnly ? 'Chirurgies & Bloc' : 'Médecins Actifs',
      value: isDoctorOnly ? 'Programmé' : (stats?.totalMedecins ?? '...'),
      icon: isDoctorOnly ? Scissors : UserCheck,
      color: isDoctorOnly ? '#c084fc' : '#10b981',
      bgGlow: isDoctorOnly ? 'rgba(192, 132, 252, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      trend: isDoctorOnly ? 'Bloc opératoire' : '17 praticiens',
      href: isDoctorOnly ? '/chirurgies' : '/medecins',
    },
    {
      title: isDoctorOnly ? 'Rendez-vous (Lecture)' : 'Rendez-vous Total',
      value: stats?.totalRdv ?? '...',
      icon: Calendar,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      trend: isDoctorOnly ? 'Consultation seule' : 'Activité clinique',
      href: '/rendez-vous',
    },
    isSecretaryOnly
      ? {
          title: "Salle d'attente",
          value: stats?.rdvDuJour?.length ?? '...',
          icon: Clock,
          color: '#f59e0b',
          bgGlow: 'rgba(245, 158, 11, 0.15)',
          trend: 'En direct',
          href: '/salle-attente',
        }
      : {
          title: 'Ordonnances Émises',
          value: stats?.totalOrdonnances ?? '...',
          icon: FileText,
          color: '#f59e0b',
          bgGlow: 'rgba(245, 158, 11, 0.15)',
          trend: 'Dossiers traités',
          href: '/ordonnances',
        },
  ];

  // Helper for max value in day chart
  const maxDayRdv = stats ? Math.max(...stats.chartDataJours, 1) : 1;

  return (
    <AppLayout>
      {/* Welcome Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Tableau de Bord <span className="gradient-text">Clinique</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Bienvenue, <strong>{user?.fullName || 'Utilisateur'}</strong>. Aperçu des consultations et des dossiers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isDoctorOnly ? (
            <Link href="/consultations" className="btn btn-secondary">
              <Activity size={17} />
              Mes Consultations
            </Link>
          ) : isSecretaryOnly ? (
            <Link href="/salle-attente" className="btn btn-secondary">
              <Clock size={17} />
              Salle d'attente
            </Link>
          ) : (
            <Link href="/rendez-vous" className="btn btn-secondary">
              <Calendar size={17} />
              Agenda
            </Link>
          )}
          <Link href="/chat" className="btn btn-primary">
            <Bot size={17} />
            Consulter l'IA Clinique
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                display: 'block',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: card.bgGlow,
                borderRadius: '50%',
                filter: 'blur(30px)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: card.bgGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}>
                  <Icon size={22} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {card.value}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}>
                  <TrendingUp size={13} />
                  {card.trend}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Activity Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Activité des Rendez-vous
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Consultations par jour pour le mois en cours
              </p>
            </div>
            <div className="badge badge-sky">
              <Activity size={12} />
              Mois en cours
            </div>
          </div>

          {/* Bar Visualizer */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.45rem',
            height: '180px',
            paddingTop: '1rem',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}>
            {stats?.chartLabelsJours.map((day, idx) => {
              const count = stats.chartDataJours[idx] || 0;
              const heightPct = Math.round((count / maxDayRdv) * 100);
              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    minWidth: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  title={`Jour ${day} : ${count} RDV`}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(heightPct, 6)}%`,
                      borderRadius: '4px 4px 0 0',
                      background: count > 0
                        ? 'linear-gradient(180deg, var(--primary-light) 0%, var(--primary) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {day % 5 === 0 || day === 1 ? day : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Statut des Rendez-vous
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Répartition des consultations
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem' }}>
            {stats?.chartLabelsStatut.map((statut, idx) => {
              const count = stats.chartDataStatut[idx] || 0;
              const total = stats.totalRdv || 1;
              const pct = Math.round((count / total) * 100);
              const color =
                statut === 'Confirmé'
                  ? 'var(--accent-emerald)'
                  : statut === 'En attente'
                  ? 'var(--accent-amber)'
                  : 'var(--accent-rose)';

              return (
                <div key={statut}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{statut}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Appointments & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
      }}>
        {/* Today's Appointments Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Clock size={20} color="var(--primary-light)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Rendez-vous d'Aujourd'hui
              </h3>
            </div>
            <Link href="/rendez-vous" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Voir tout <ArrowUpRight size={14} />
            </Link>
          </div>

          {stats?.rdvDuJour && stats.rdvDuJour.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rdvDuJour.map((rdv) => (
                    <tr key={rdv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                        {formatAppointmentTime(rdv.heure)}
                      </td>
                      <td>
                        {formatPatientName(rdv.patient)}
                      </td>
                      <td>
                        {formatDoctorName(rdv.medecin)}
                      </td>
                      <td>{rdv.motif}</td>
                      <td>
                        <span className={`badge ${
                          rdv.statut === 'Confirmé'
                            ? 'badge-emerald'
                            : rdv.statut === 'En attente'
                            ? 'badge-amber'
                            : 'badge-rose'
                        }`}>
                          {rdv.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}>
              <CheckCircle size={32} color="var(--accent-emerald)" style={{ marginBottom: '0.65rem' }} />
              <p>Aucun rendez-vous prévu pour aujourd'hui.</p>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Raccourcis Pratiques
          </h3>

          {isDoctorOnly ? (
            <>
              {/* Doctor Shortcuts (NO appointment creation, NO salle d'attente) */}
              <Link
                href="/consultations"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Activity size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mes Consultations</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dossiers et diagnostics</p>
                </div>
              </Link>

              <Link
                href="/ordonnances"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rédiger une Ordonnance</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prescriptions et posologies</p>
                </div>
              </Link>

              <Link
                href="/chirurgies"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(192, 132, 252, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Scissors size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chirurgies & Bloc</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Programmation des opérations</p>
                </div>
              </Link>
            </>
          ) : isSecretaryOnly ? (
            <>
              {/* Secretary Shortcuts (NO consultations, NO ordonnances) */}
              <Link
                href="/rendez-vous"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nouveau Rendez-vous</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planifier ou modifier un RDV</p>
                </div>
              </Link>

              <Link
                href="/salle-attente"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Salle d'attente</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gestion du flux patient en direct</p>
                </div>
              </Link>

              <Link
                href="/facturation"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Facturation & Encaissements</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Règlements et reçus</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* Admin Shortcuts */}
              <Link
                href="/rendez-vous"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nouveau Rendez-vous</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planifier une consultation</p>
                </div>
              </Link>

              <Link
                href="/patients"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enregistrer un Patient</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Créer un nouveau dossier</p>
                </div>
              </Link>
            </>
          )}

          <Link
            href="/chat"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              textDecoration: 'none',
              color: 'var(--text-main)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-gradient)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}>
              <Bot size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Assistant Gemini</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>Interroger l'IA médicale</p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
