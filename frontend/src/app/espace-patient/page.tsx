'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Medecin, Patient } from '@/types';
import {
  formatDoctorName,
  formatAppointmentDate,
  formatAppointmentTime,
} from '@/lib/formatters';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  Plus,
  Activity,
  FileText,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  FileDown,
  Sparkles,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  HeartPulse,
  Printer,
  ChevronRight,
  BadgeAlert,
} from 'lucide-react';

export default function EspacePatientPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout, isStaff } = useAuth();

  const [patientData, setPatientData] = useState<any>(null);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rdvs' | 'nouveau-rdv' | 'consultations' | 'medecins'>('rdvs');

  // New Appointment Form State
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedHeure, setSelectedHeure] = useState<string>('09:00');
  const [motif, setMotif] = useState<string>('Consultation de routine');
  const [creneaux, setCreneaux] = useState<Array<{ heure: string; disponible: boolean; conflit: boolean }>>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Selected Consultation / Ordonnance Modal
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/espace-patient');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadPatientPortalData = async () => {
    try {
      setLoading(true);
      const [pData, medList] = await Promise.all([
        api.getPatientData(),
        api.getMedecins(),
      ]);
      setPatientData(pData);
      setMedecins(medList);
      if (medList.length > 0 && !selectedMedecinId) {
        setSelectedMedecinId(medList[0].id.toString());
      }
    } catch (err) {
      console.error('Erreur chargement portail patient:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPatientPortalData();
    }
  }, [isAuthenticated]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (selectedMedecinId && selectedDate) {
      setLoadingCreneaux(true);
      api.getSmartCreneaux(parseInt(selectedMedecinId), selectedDate)
        .then((res: any) => {
          setCreneaux(res.creneaux || []);
          const firstDispo = res.creneaux?.find((c: any) => c.disponible);
          if (firstDispo) setSelectedHeure(firstDispo.heure);
        })
        .catch(() => setCreneaux([]))
        .finally(() => setLoadingCreneaux(false));
    }
  }, [selectedMedecinId, selectedDate]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedecinId || !selectedDate || !selectedHeure) return;

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await api.createPatientRendezVous({
        medecinId: parseInt(selectedMedecinId),
        date: selectedDate,
        heure: selectedHeure,
        motif,
      });

      setBookingSuccess('Votre rendez-vous a bien été enregistré ! Il apparaîtra ci-dessous.');
      await loadPatientPortalData();
      setTimeout(() => {
        setActiveTab('rdvs');
        setBookingSuccess(null);
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Erreur lors de la réservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }
    try {
      setCancellingId(id);
      await api.cancelPatientRendezVous(id);
      await loadPatientPortalData();
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible d\'annuler ce rendez-vous.'}`);
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: 'var(--primary-light)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p>Chargement de votre Espace Patient sécurisé...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const patient = patientData?.patient;
  const rendezVousList = patientData?.rendezVous || [];
  const consultationsList = patientData?.consultations || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.9rem 2rem',
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
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
            }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Clinique <span className="gradient-text">Santé+</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                Portail Patient
              </span>
            </div>
          </Link>

          {/* User Nav and Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isStaff && (
              <Link
                href="/dashboard"
                className="btn btn-secondary"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                }}
              >
                <LayoutDashboard size={15} />
                Tableau de Bord Staff
              </Link>
            )}

            <Link
              href="/chat"
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Sparkles size={15} color="#38bdf8" />
              Assistant IA
            </Link>

            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '2rem' }}>
        {/* Patient Identity Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 132, 199, 0.15) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 800,
              boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
            }}>
              {user?.prenom?.[0] || 'P'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <span className="badge badge-sky" style={{ fontSize: '0.75rem' }}>
                  {patient?.numeroDossier || user?.numeroDossier || 'DOSSIER ACTIF'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Bienvenue dans votre espace médical personnel. Vous pouvez réserver une consultation, suivre vos ordonnances et contacter vos médecins.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                Groupe Sanguin
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>
                {patient?.groupeSanguin || 'Non spécifié'}
              </span>
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                Allergies Connues
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fbbf24' }}>
                {patient?.allergies || 'Aucune enregistrée'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setActiveTab('rdvs')}
            style={{
              padding: '0.85rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'rdvs' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'rdvs' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Calendar size={18} />
            Mes Rendez-vous ({rendezVousList.length})
          </button>

          <button
            onClick={() => setActiveTab('nouveau-rdv')}
            style={{
              padding: '0.85rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'nouveau-rdv' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'nouveau-rdv' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={18} />
            Prendre un Rendez-vous
          </button>

          <button
            onClick={() => setActiveTab('consultations')}
            style={{
              padding: '0.85rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'consultations' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'consultations' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Activity size={18} />
            Mes Consultations & Ordonnances ({consultationsList.length})
          </button>

          <button
            onClick={() => setActiveTab('medecins')}
            style={{
              padding: '0.85rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'medecins' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'medecins' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <User size={18} />
            Nos Médecins ({medecins.length})
          </button>
        </div>

        {/* Tab 1: Mes Rendez-vous */}
        {activeTab === 'rdvs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vos Rendez-vous Médicaux</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Consultez l'état d'avancement de vos réservations et vos rendez-vous passés.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('nouveau-rdv')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                Nouveau Rendez-vous
              </button>
            </div>

            {rendezVousList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <Calendar size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Aucun rendez-vous enregistré
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Vous n'avez pas encore de rendez-vous programmé à la clinique.
                </p>
                <button
                  onClick={() => setActiveTab('nouveau-rdv')}
                  className="btn btn-primary"
                >
                  Prendre mon premier rendez-vous
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {rendezVousList.map((rdv: any) => {
                  const isPast = new Date(rdv.date) < new Date(new Date().toDateString());
                  let statusBadge = 'badge-sky';
                  if (rdv.statut === 'Confirmé') statusBadge = 'badge-emerald';
                  else if (rdv.statut === 'Terminé') statusBadge = 'badge-purple';
                  else if (rdv.statut === 'Annulé') statusBadge = 'badge-rose';

                  return (
                    <div
                      key={rdv.id}
                      className="glass-panel"
                      style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: `4px solid ${
                          rdv.statut === 'Confirmé'
                            ? '#10b981'
                            : rdv.statut === 'Terminé'
                            ? '#a855f7'
                            : '#0ea5e9'
                        }`,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                          <span className={`badge ${statusBadge}`}>
                            {rdv.statut || 'En attente'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            Réf #{rdv.id}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                          {formatDoctorName(rdv.medecin)}
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.75rem' }}>
                          {rdv.medecin?.specialite || 'Généraliste'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={15} color="#38bdf8" />
                            <span>{formatAppointmentDate(rdv.date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={15} color="#38bdf8" />
                            <span>{formatAppointmentTime(rdv.heure)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={15} color="#38bdf8" />
                            <span>Motif : {rdv.motif || 'Consultation générale'}</span>
                          </div>
                        </div>
                      </div>

                      {rdv.medecin?.tarif && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                        }}>
                          <span style={{ color: 'var(--text-dim)' }}>Tarif consultation :</span>
                          <span style={{ fontWeight: 700, color: '#34d399' }}>{rdv.medecin.tarif} TND</span>
                        </div>
                      )}

                      {rdv.statut !== 'Annulé' && rdv.statut !== 'Terminé' && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'flex-end',
                        }}>
                          <button
                            onClick={() => handleCancelAppointment(rdv.id)}
                            disabled={cancellingId === rdv.id}
                            className="btn btn-secondary"
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.75rem',
                              color: '#fb7185',
                              borderColor: 'rgba(251, 113, 133, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              cursor: 'pointer',
                            }}
                          >
                            <XCircle size={14} />
                            {cancellingId === rdv.id ? 'Annulation...' : 'Annuler le rendez-vous'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Nouveau Rendez-vous Form */}
        {activeTab === 'nouveau-rdv' && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Prendre un Nouveau Rendez-vous
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Sélectionnez un praticien, une date et un horaire sans risque de double réservation.
                </p>
              </div>

              {bookingSuccess && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <CheckCircle2 size={20} />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              {bookingError && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(244, 63, 94, 0.18)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <AlertCircle size={20} />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookAppointment}>
                {/* 1. Médecin */}
                <div className="form-group">
                  <label className="form-label">Sélectionner un Médecin Spécialiste *</label>
                  <select
                    className="form-select"
                    value={selectedMedecinId}
                    onChange={(e) => setSelectedMedecinId(e.target.value)}
                    required
                  >
                    {medecins.map((m) => (
                      <option key={m.id} value={m.id}>
                        Dr. {m.prenom} {m.nom} — {m.specialite} ({m.tarif ? `${m.tarif} TND` : 'Tarif conventionné'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Date */}
                <div className="form-group">
                  <label className="form-label">Date souhaitée *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Créneaux disponibles intelligents */}
                <div className="form-group">
                  <label className="form-label">
                    Créneaux Disponibles ({loadingCreneaux ? 'Vérification...' : `${creneaux.filter(c => c.disponible).length} disponibles`})
                  </label>
                  {loadingCreneaux ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Recherche des créneaux en temps réel...
                    </p>
                  ) : creneaux.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#fb7185' }}>
                      Aucun créneau disponible pour ce médecin à cette date (cabinet fermé ou journée complète).
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
                      {creneaux.map((c) => {
                        const isSelected = selectedHeure === c.heure;
                        return (
                          <button
                            type="button"
                            key={c.heure}
                            disabled={!c.disponible}
                            onClick={() => setSelectedHeure(c.heure)}
                            style={{
                              padding: '0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: c.disponible ? 'pointer' : 'not-allowed',
                              border: isSelected
                                ? '2px solid #38bdf8'
                                : c.disponible
                                ? '1px solid rgba(255, 255, 255, 0.12)'
                                : '1px solid rgba(244, 63, 94, 0.2)',
                              background: isSelected
                                ? 'rgba(56, 189, 248, 0.25)'
                                : c.disponible
                                ? 'rgba(255, 255, 255, 0.04)'
                                : 'rgba(244, 63, 94, 0.08)',
                              color: isSelected
                                ? '#ffffff'
                                : c.disponible
                                ? 'var(--text-main)'
                                : 'var(--text-dim)',
                            }}
                          >
                            {c.heure}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Motif */}
                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label">Motif de consultation *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex: Douleurs abdominales, Bilan annuel, Contrôle tension..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || loadingCreneaux || creneaux.length === 0}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
                >
                  {bookingLoading ? 'Enregistrement en cours...' : 'Confirmer et Réserver mon Rendez-vous'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Mes Consultations & Ordonnances */}
        {activeTab === 'consultations' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Historique Médical & Ordonnances</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Retrouvez l'ensemble de vos comptes-rendus de consultation et téléchargez vos prescriptions médicales.
              </p>
            </div>

            {consultationsList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <Activity size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Aucune consultation enregistrée
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Vos comptes-rendus médicaux et ordonnances apparaîtront ici dès que vous aurez effectué une consultation.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {consultationsList.map((c: any) => (
                  <div
                    key={c.id}
                    className="glass-panel"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="badge badge-purple">
                          Consultation #{c.id}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                          {formatAppointmentDate(c.date)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        {formatDoctorName(c.medecin)}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#38bdf8', marginBottom: '0.85rem' }}>
                        {c.medecin?.specialite}
                      </p>

                      <div style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        marginBottom: '0.85rem',
                        fontSize: '0.85rem',
                      }}>
                        <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          Diagnostic :
                        </strong>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                          {c.diagnostic || 'Non renseigné'}
                        </p>
                      </div>

                      {/* Constantes vitales */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                        {c.tension && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                            Tension: <strong>{c.tension}</strong>
                          </div>
                        )}
                        {c.poids && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                            Poids: <strong>{c.poids} kg</strong>
                          </div>
                        )}
                        {c.temperature && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                            T°: <strong>{c.temperature} °C</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {c.ordonnance ? (
                      <button
                        onClick={() => setSelectedConsultation(c)}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.55rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderColor: 'rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                        }}
                      >
                        <FileText size={16} />
                        Voir l'Ordonnance Médicale
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                        Pas d'ordonnance associée
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Nos Médecins */}
        {activeTab === 'medecins' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>L'Équipe Médicale de la Clinique</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nos praticiens qualifiés et spécialisés sont à votre écoute.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {medecins.map((m) => (
                <div
                  key={m.id}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                      }}>
                        {m.prenom[0]}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          Dr. {m.prenom} {m.nom}
                        </h3>
                        <span className="badge badge-sky" style={{ fontSize: '0.72rem' }}>
                          {m.specialite}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="#38bdf8" />
                        <span>{m.telephone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="#38bdf8" />
                        <span>{m.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#38bdf8" />
                        <span>Consultation : {m.dureeConsultation || 30} min</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Tarif</span>
                      <strong style={{ color: '#34d399', fontSize: '1rem' }}>{m.tarif ? `${m.tarif} TND` : 'Conventionné'}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMedecinId(m.id.toString());
                        setActiveTab('nouveau-rdv');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                    >
                      Prendre RDV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Ordonnance Modal */}
      {selectedConsultation && selectedConsultation.ordonnance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2.5rem',
              position: 'relative',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Ordonnance Médicale</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Clinique Santé+ — Délivrée par {formatDoctorName(selectedConsultation.medecin)}
                </p>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                <span>Date: {formatAppointmentDate(selectedConsultation.ordonnance.date)}</span>
                <span>Patient: {user?.prenom} {user?.nom}</span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', color: '#38bdf8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Prescription Médicamenteuse :
                </strong>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {selectedConsultation.ordonnance.medicaments}
                </pre>
              </div>

              {selectedConsultation.ordonnance.description && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Consignes / Posologie :</strong> {selectedConsultation.ordonnance.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
              >
                <Printer size={16} />
                Imprimer l'ordonnance
              </button>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="btn btn-primary"
                style={{ fontSize: '0.88rem' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
