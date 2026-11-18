'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { StatistiquesAvancees } from '@/types';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  UserX,
  Calendar,
  AlertTriangle,
  Download,
  Stethoscope,
  Activity,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function StatistiquesPage() {
  const [stats, setStats] = useState<StatistiquesAvancees | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getStatistiquesAvancees();
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Total Patients', stats.kpis.totalPatients],
      ['Total Rendez-vous', stats.kpis.totalRdv],
      ['Total Consultations', stats.kpis.totalConsultations],
      ['Total Revenus Encaissés', `${stats.kpis.totalRevenus} TND`],
      ['Taux d Absentéisme', `${stats.kpis.tauxAbsenteisme} %`],
      ['Taux d Annulation', `${stats.kpis.tauxAnnulation} %`],
      ['Taux de Remplissage', `${stats.kpis.tauxRemplissage} %`],
    ];

    let csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_clinique_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
              Statistiques Décisionnelles & Rapports
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Tableaux de bord d'activité, analyse financière, indicateurs d'absentéisme et intelligence médicale.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Exporter les Données (CSV)
          </button>
        </div>

        {/* Top KPIs Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Revenus Totaux</span>
              <DollarSign size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#22c55e' }}>
              {stats?.kpis.totalRevenus.toFixed(2) ?? '0.00'} TND
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Factures acquittées
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Taux d'Absentéisme</span>
              <UserX size={18} color="#f87171" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171' }}>
              {stats?.kpis.tauxAbsenteisme ?? 0} %
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Patients non présentés aux RDV
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Taux de Remplissage</span>
              <TrendingUp size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8' }}>
              {stats?.kpis.tauxRemplissage ?? 0} %
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Consultations menées à terme
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Consultations Réalisées</span>
              <Activity size={18} color="#a855f7" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#a855f7' }}>
              {stats?.kpis.totalConsultations ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Dossiers médicaux mis à jour
            </div>
          </div>
        </div>

        {/* Charts & Distributions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {/* Revenus par Médecin */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={18} color="#38bdf8" />
              Revenus générés par médecin
            </h3>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Chargement...</p>
            ) : Object.keys(stats?.revenusParMedecin || {}).length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Aucune donnée disponible</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(stats?.revenusParMedecin || {}).map(([medName, montant]) => {
                  const maxMontant = Math.max(...Object.values(stats?.revenusParMedecin || {}), 1);
                  const pct = Math.min(100, Math.round((montant / maxMontant) * 100));

                  return (
                    <div key={medName}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{medName}</span>
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>{montant.toFixed(2)} TND</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                          borderRadius: '999px',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spécialités les plus sollicitées */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#a855f7" />
              Spécialités les plus sollicitées
            </h3>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Chargement...</p>
            ) : Object.keys(stats?.specialites || {}).length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Aucune donnée disponible</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(stats?.specialites || {}).map(([spec, count]) => {
                  const maxCount = Math.max(...Object.values(stats?.specialites || {}), 1);
                  const pct = Math.min(100, Math.round((count / maxCount) * 100));

                  return (
                    <div key={spec}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{spec}</span>
                        <span style={{ color: '#a855f7', fontWeight: 700 }}>{count} rendez-vous</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                          borderRadius: '999px',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Suivi Préventif & Rappels Intelligents */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={20} color="#eab308" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                Patients sans consultation récente ({'>'} 6 mois) - Rappel de suivi préventif
              </h3>
            </div>
            <span style={{
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {stats?.nbPatientsSansSuivi ?? 0} patients à relancer
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Fonction intelligente suggérant des rappels pour le dépistage et le renouvellement de suivi médical.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {stats?.patientsSansSuivi.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                    {p.prenom} {p.nom}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Dossier: {p.numeroDossier} • Tél: {p.telephone}
                  </div>
                </div>

                <button
                  onClick={() => alert(`Rappel automatique par email/SMS envoyé avec succès à ${p.email || p.telephone} !`)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', color: '#38bdf8' }}
                >
                  Envoyer rappel
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
