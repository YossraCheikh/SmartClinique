'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Facture } from '@/types';
import {
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Filter,
  DollarSign,
  User,
  Plus,
  X,
} from 'lucide-react';

export default function FacturationPage() {
  const { isMedecin, isSecretaire, isAdmin } = useAuth();
  const isDoctorOnly = isMedecin && !isSecretaire && !isAdmin;

  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paye' | 'impaye' | 'partiel'>('all');
  const [printFacture, setPrintFacture] = useState<Facture | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getFactures();
      setFactures(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatutUpdate = async (id: number, newStatut: string) => {
    if (isDoctorOnly) return;
    try {
      await api.updateFacture(id, { statut: newStatut });
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du changement de statut');
    }
  };

  const filtered = factures.filter((f) => {
    const q = search.toLowerCase();
    const c = typeof f.consultation === 'object' ? f.consultation : null;
    const rdv = c && typeof c.rendezVous === 'object' ? c.rendezVous : null;
    const p = rdv && typeof rdv.patient === 'object' ? rdv.patient : null;

    const matchesSearch =
      String(f.id).includes(q) ||
      (p && `${p.prenom} ${p.nom}`.toLowerCase().includes(q)) ||
      (f.modePaiement && f.modePaiement.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || f.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalEncaisse = factures
    .filter((f) => f.statut === 'paye')
    .reduce((sum, f) => sum + (f.montant || 0), 0);

  const totalEnAttente = factures
    .filter((f) => f.statut === 'impaye')
    .reduce((sum, f) => sum + (f.montant || 0), 0);

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
              Facturation & Règlements
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Gestion comptable, encaissements sur place (carte/espèces), factures dématérialisées.
            </p>
          </div>


        </div>

        {/* Metrics cards */}
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
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {totalEncaisse.toFixed(2)} TND
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total encaissé (Payé)</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {totalEnAttente.toFixed(2)} TND
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Impayés / En attente</div>
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
              <Receipt size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
                {factures.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total des factures émises</div>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Rechercher par patient, numéro ou mode de paiement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.9rem',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              Toutes
            </button>
            <button
              onClick={() => setStatusFilter('paye')}
              className={`btn ${statusFilter === 'paye' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              Payées
            </button>
            <button
              onClick={() => setStatusFilter('impaye')}
              className={`btn ${statusFilter === 'impaye' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              Impayées
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Facture</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Patient & Médecin</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Montant</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Mode</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Statut</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Chargement des factures...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const c = typeof f.consultation === 'object' ? f.consultation : null;
                  const rdv = c && typeof c.rendezVous === 'object' ? c.rendezVous : null;
                  const pat = rdv && typeof rdv.patient === 'object' ? rdv.patient : null;
                  const med = rdv && typeof rdv.medecin === 'object' ? rdv.medecin : null;

                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>FAC-{String(f.id).padStart(4, '0')}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {f.dateFacture ? new Date(f.dateFacture).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                          {pat ? `${pat.prenom} ${pat.nom}` : 'Patient'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Dr. {med ? `${med.nom} (${med.specialite})` : 'Médecin'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                          {f.montant.toFixed(2)} TND
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textTransform: 'capitalize', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {f.modePaiement || 'Carte bancaire'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${
                          f.statut === 'paye'
                            ? 'badge-success'
                            : f.statut === 'impaye'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                          {f.statut === 'paye' ? 'Payé' : f.statut === 'impaye' ? 'Impayé' : 'Partiel'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!isDoctorOnly && f.statut === 'impaye' && (
                            <button
                              onClick={() => handleStatutUpdate(f.id, 'paye')}
                              className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            >
                              Encaisser
                            </button>
                          )}
                          <button
                            onClick={() => setPrintFacture(f)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Printer size={13} />
                            Imprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Facture Print Modal */}
        {printFacture && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem',
          }}>
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '650px',
              borderRadius: '16px',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              fontFamily: 'sans-serif',
            }}>
              <button
                onClick={() => setPrintFacture(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1', margin: 0 }}>CLINIQUE SANTÉPLUS</h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Plateforme Médicale Intelligente</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>SIRET : 894 123 456 00012 • TVA : FR82894123456</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>FACTURE N° FAC-{String(printFacture.id).padStart(4, '0')}</span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Date : {printFacture.dateFacture ? new Date(printFacture.dateFacture).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                  </p>
                </div>
              </div>

              {/* Client & Practitioner */}
              {(() => {
                const c = typeof printFacture.consultation === 'object' ? printFacture.consultation : null;
                const r = c && typeof c.rendezVous === 'object' ? c.rendezVous : null;
                const p = r && typeof r.patient === 'object' ? r.patient : null;
                const m = r && typeof r.medecin === 'object' ? r.medecin : null;

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Facturé à</div>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{p ? `${p.prenom} ${p.nom}` : 'Patient'}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>Dossier : {p?.numeroDossier || 'N/A'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>Tél : {p?.telephone || 'N/A'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Praticien traitant</div>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Dr. {m ? `${m.prenom} ${m.nom}` : 'Médecin'}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#0284c7' }}>{m?.specialite || 'Généraliste'}</div>
                      </div>
                    </div>

                    {/* Table items */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#475569' }}>Prestation</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#475569' }}>Qté</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>Tarif TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#1e293b' }}>
                            Consultation médicale spécialisée ({m?.specialite || 'Médecine générale'})
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem', color: '#1e293b' }}>1</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                            {printFacture.montant.toFixed(2)} TND
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>Total à régler TTC :</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: '#0369a1' }}>
                            {printFacture.montant.toFixed(2)} TND
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
                      <p style={{ margin: '0 0 0.25rem' }}><strong>Mode de règlement :</strong> {printFacture.modePaiement || 'Carte bancaire'}</p>
                      <p style={{ margin: 0 }}><strong>Statut :</strong> {printFacture.statut === 'paye' ? 'Acquittée en totalité' : 'En attente de paiement'}</p>
                    </div>
                  </>
                );
              })()}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.25rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Printer size={16} />
                  Imprimer la facture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
