'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { SalleAttenteData, SalleAttentePatient } from '@/types';
import {
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowRight,
  RefreshCw,
  Phone,
  FileText,
  UserX,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';

export default function SalleAttentePage() {
  const { isMedecin, isSecretaire, isAdmin } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<SalleAttenteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMedecin && !isSecretaire && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isMedecin, isSecretaire, isAdmin, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSalleAttente();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement de la salle d\'attente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatutChange = async (id: number, newStatut: string) => {
    try {
      setUpdatingId(id);
      await api.updateStatutSalleAttente(id, newStatut);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isMedecin && !isSecretaire && !isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                Salle d'Attente Interactive
              </h1>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulse 2s infinite' }} />
                En direct • {data?.dateLisible || 'Aujourd\'hui'}
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Gestion en temps réel du flux des patients et de la file d'attente du cabinet.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {data?.nbEnAttente ?? 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>En attente au cabinet</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {data?.nbEnConsultation ?? 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>En consultation</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {data?.nbTermines ?? 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Consultations terminées</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {data?.totalAujourdhui ?? 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total prévus aujourd'hui</div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Queue Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' }}>
            File d'attente ordonnée par heure de convocation
          </h2>

          {loading && !data ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Chargement de la file d'attente...
            </div>
          ) : data?.patients.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)',
            }}>
              <Clock size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: '0.25rem' }}>Aucun patient dans la salle d'attente pour le moment</p>
              <p style={{ fontSize: '0.85rem' }}>Tous les rendez-vous du jour ont été pris en charge ou aucun n'est prévu.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data?.patients.map((item, index) => {
                const isWaiting = item.statut === 'En attente';
                const inConsultation = item.statut === 'Confirmé';
                const isFinished = item.statut === 'Terminé';
                const isAbsent = item.statut === 'Absent';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: inConsultation
                        ? 'rgba(56, 189, 248, 0.08)'
                        : isWaiting
                        ? 'rgba(234, 179, 8, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${
                        inConsultation
                          ? 'rgba(56, 189, 248, 0.3)'
                          : isWaiting
                          ? 'rgba(234, 179, 8, 0.25)'
                          : 'var(--border-color)'
                      }`,
                      borderRadius: '14px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Left: Ordre & Heure */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                      }}>
                        #{index + 1}
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                        }}>
                          <Clock size={16} color="#38bdf8" />
                          {item.heure}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {item.motif || 'Consultation standard'}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Patient info */}
                    <div style={{ minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>
                          {item.patient.prenom} {item.patient.nom}
                        </span>
                        {item.patient.numeroDossier && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                          }}>
                            {item.patient.numeroDossier}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Phone size={13} />
                        {item.patient.telephone || 'Non renseigné'}
                      </div>
                      {item.patient.allergies && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#f87171',
                          marginTop: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}>
                          <AlertCircle size={12} />
                          Allergies : {item.patient.allergies}
                        </div>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div style={{ minWidth: '180px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Médecin assigné</div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>
                        Dr. {item.medecin.prenom} {item.medecin.nom}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        display: 'inline-block',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '999px',
                        marginTop: '0.25rem',
                      }}>
                        {item.medecin.specialite}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className={`badge ${
                        inConsultation
                          ? 'badge-info'
                          : isWaiting
                          ? 'badge-warning'
                          : isFinished
                          ? 'badge-success'
                          : 'badge-danger'
                      }`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                        {item.statut}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isWaiting && (
                        <button
                          onClick={() => handleStatutChange(item.id, 'Confirmé')}
                          disabled={updatingId === item.id}
                          className="btn btn-primary"
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Stethoscope size={15} />
                          Faire entrer
                        </button>
                      )}

                      {inConsultation && (isAdmin || isMedecin) && (
                        <Link
                          href={`/consultations?rdvId=${item.id}&patientId=${item.patient.id}`}
                          className="btn btn-primary"
                          style={{
                            fontSize: '0.85rem',
                            padding: '0.4rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          }}
                        >
                          <CheckCircle size={15} />
                          Consulter
                        </Link>
                      )}

                      {inConsultation && !isMedecin && (
                        <button
                          onClick={() => handleStatutChange(item.id, 'Terminé')}
                          disabled={updatingId === item.id}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <CheckCircle size={15} />
                          Marquer Terminé
                        </button>
                      )}

                      {!isFinished && !isAbsent && (
                        <button
                          onClick={() => handleStatutChange(item.id, 'Absent')}
                          disabled={updatingId === item.id}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem', color: '#f87171' }}
                          title="Marquer absent"
                        >
                          <UserX size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
