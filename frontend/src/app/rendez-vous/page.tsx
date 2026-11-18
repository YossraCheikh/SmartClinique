'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Medecin, Patient, RendezVous } from '@/types';
import {
  formatDoctorName,
  formatPatientName,
  formatAppointmentDate,
  formatAppointmentTime,
} from '@/lib/formatters';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  Clock3,
  XCircle,
  FilePlus2,
  Sparkles,
} from 'lucide-react';

import Link from 'next/link';

export default function RendezVousPage() {
  const { isMedecin, isSecretaire, isAdmin } = useAuth();
  const isDoctorOnly = isMedecin && !isSecretaire && !isAdmin;

  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: '09:00',
    motif: 'Consultation générale',
    statut: 'En attente',
    patientId: '',
    medecinId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart Slots & Suggestion state
  const [creneaux, setCreneaux] = useState<Array<{ heure: string; disponible: boolean; conflit: boolean }>>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const fetchCreneaux = async (medecinId: string, date: string) => {
    if (!medecinId || !date) return;
    try {
      setLoadingCreneaux(true);
      const res = await api.getSmartCreneaux(Number(medecinId), date);
      setCreneaux(res.creneaux || []);
    } catch (e) {
      console.error(e);
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  };

  useEffect(() => {
    if (modalOpen && formData.medecinId && formData.date) {
      fetchCreneaux(formData.medecinId, formData.date);
    }
  }, [modalOpen, formData.medecinId, formData.date]);

  const handleSmartSuggestion = async () => {
    try {
      setSuggesting(true);
      const res = await api.getSmartSuggestion(undefined, formData.medecinId ? Number(formData.medecinId) : undefined);
      if (res.trouve && res.date && res.heure && res.medecin) {
        setFormData((prev) => ({
          ...prev,
          date: res.date!,
          heure: res.heure!,
          medecinId: String(res.medecin!.id),
          motif: prev.motif || res.motifSuggere || 'Consultation',
        }));
        setModalOpen(true);
      } else {
        alert(res.message || 'Aucun créneau immédiat trouvé.');
      }
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la suggestion');
    } finally {
      setSuggesting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rdvData, patientData, medecinData] = await Promise.all([
        api.getRendezVous(),
        api.getPatients(),
        api.getMedecins(),
      ]);
      setRdvs(rdvData);
      setPatients(patientData);
      setMedecins(medecinData);

      if (patientData.length > 0 && !formData.patientId) {
        setFormData((prev) => ({
          ...prev,
          patientId: String(patientData[0].id),
          medecinId: medecinData.length > 0 ? String(medecinData[0].id) : '',
        }));
      }
    } catch (err: any) {
      console.error('Failed to load appointments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    if (isDoctorOnly) return;
    setEditingRdv(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      heure: '10:00',
      motif: 'Consultation de suivi',
      statut: 'En attente',
      patientId: patients[0] ? String(patients[0].id) : '',
      medecinId: medecins[0] ? String(medecins[0].id) : '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (rdv: RendezVous) => {
    if (isDoctorOnly) return;
    setEditingRdv(rdv);
    const pId = typeof rdv.patient === 'object' && rdv.patient ? String(rdv.patient.id) : '';
    const mId = typeof rdv.medecin === 'object' && rdv.medecin ? String(rdv.medecin.id) : '';

    setFormData({
      date: rdv.date ? rdv.date.split('T')[0] : '',
      heure: rdv.heure ? rdv.heure.split('T')[1]?.substring(0, 5) || rdv.heure.substring(0, 5) : '09:00',
      motif: rdv.motif,
      statut: rdv.statut,
      patientId: pId,
      medecinId: mId,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleStatusChange = async (rdv: RendezVous, newStatus: string) => {
    if (isDoctorOnly) return;
    try {
      await api.updateRendezVous(rdv.id, { statut: newStatus });
      setRdvs((prev) =>
        prev.map((r) => (r.id === rdv.id ? { ...r, statut: newStatus } : r))
      );
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de mettre à jour le statut.'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDoctorOnly) return;
    setSubmitting(true);
    setError(null);

    try {
      const patientIri = `/api/patients/${formData.patientId}`;
      const medecinIri = `/api/medecins/${formData.medecinId}`;

      if (editingRdv) {
        await api.updateRendezVous(editingRdv.id, {
          date: formData.date,
          heure: `${formData.date}T${formData.heure}:00`,
          motif: formData.motif,
          statut: formData.statut,
          patient: patientIri,
          medecin: medecinIri,
        });
      } else {
        await api.createRendezVous({
          date: formData.date,
          heure: `${formData.date}T${formData.heure}:00`,
          motif: formData.motif,
          statut: formData.statut,
          patient: patientIri,
          medecin: medecinIri,
        });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isDoctorOnly) return;
    if (!window.confirm('Confirmez-vous l\'annulation et la suppression de ce rendez-vous ?')) {
      return;
    }
    try {
      await api.deleteRendezVous(id);
      fetchData();
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de supprimer ce rendez-vous.'}`);
    }
  };

  const filteredRdvs = rdvs.filter((r) => {
    const pName = typeof r.patient === 'object' && r.patient ? `${r.patient.nom} ${r.patient.prenom}` : '';
    const mName = typeof r.medecin === 'object' && r.medecin ? `${r.medecin.nom} ${r.medecin.prenom}` : '';
    const matchesSearch =
      pName.toLowerCase().includes(search.toLowerCase()) ||
      mName.toLowerCase().includes(search.toLowerCase()) ||
      r.motif.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      {/* Header */}
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
            Planning & <span className="gradient-text">Rendez-vous</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Gestion de l'agenda des consultations et disponibilités
          </p>
        </div>

        {!isDoctorOnly && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSmartSuggestion}
              disabled={suggesting}
              className="btn btn-secondary"
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={16} />
              {suggesting ? 'Recherche IA...' : 'Suggestion Créneau Intelligent'}
            </button>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={18} />
              Nouveau Rendez-vous
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher patient, médecin, motif..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.92rem',
              width: '100%',
            }}
          />
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['all', 'Confirmé', 'En attente', 'Annulé'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`badge ${
                statusFilter === st
                  ? st === 'Confirmé'
                    ? 'badge-emerald'
                    : st === 'En attente'
                    ? 'badge-amber'
                    : st === 'Annulé'
                    ? 'badge-rose'
                    : 'badge-sky'
                  : ''
              }`}
              style={{
                cursor: 'pointer',
                background: statusFilter === st ? undefined : 'rgba(255, 255, 255, 0.05)',
                border: statusFilter === st ? undefined : '1px solid var(--border-color)',
                color: statusFilter === st ? undefined : 'var(--text-muted)',
                padding: '0.45rem 0.85rem',
              }}
            >
              {st === 'all' ? 'Tous les statuts' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chargement de l'agenda...
          </div>
        ) : filteredRdvs.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CalendarIcon size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
            <p>Aucun rendez-vous ne correspond à vos critères.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Patient</th>
                  <th>Médecin Spécialiste</th>
                  <th>Motif de consultation</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRdvs.map((rdv) => {
                  const patientObj = typeof rdv.patient === 'object' ? rdv.patient : null;
                  const medecinObj = typeof rdv.medecin === 'object' ? rdv.medecin : null;
                  const dateStr = formatAppointmentDate(rdv.date);
                  const heureStr = formatAppointmentTime(rdv.heure);

                  return (
                    <tr key={rdv.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {dateStr}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                            <Clock size={13} />
                            {heureStr}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(56, 189, 248, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-light)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}>
                            <User size={15} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600 }}>
                              {formatPatientName(patientObj)}
                            </p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {patientObj?.telephone || 'ID #' + (patientObj?.id || '')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>
                          <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Stethoscope size={14} color="var(--accent-purple)" />
                            {formatDoctorName(medecinObj)}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>
                            {medecinObj?.specialite}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {rdv.motif}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge ${
                            rdv.statut === 'Confirmé'
                              ? 'badge-emerald'
                              : rdv.statut === 'En attente'
                              ? 'badge-amber'
                              : 'badge-rose'
                          }`}>
                            {rdv.statut === 'Confirmé' && <CheckCircle2 size={11} />}
                            {rdv.statut === 'En attente' && <Clock3 size={11} />}
                            {rdv.statut === 'Annulé' && <XCircle size={11} />}
                            {rdv.statut}
                          </span>

                          {/* Quick Status dropdown (Secrétaire & Admin uniquement) */}
                          {!isDoctorOnly && (
                            <select
                              value={rdv.statut}
                              onChange={(e) => handleStatusChange(rdv, e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-dim)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="Confirmé">Passer à Confirmé</option>
                              <option value="En attente">Passer à En attente</option>
                              <option value="Annulé">Passer à Annulé</option>
                            </select>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {isMedecin && (
                            <Link
                              href="/ordonnances"
                              className="btn-icon btn-secondary"
                              title="Rédiger une ordonnance"
                            >
                              <FilePlus2 size={15} color="var(--accent-emerald)" />
                            </Link>
                          )}
                          {!isDoctorOnly && (
                            <>
                              <button
                                onClick={() => openEditModal(rdv)}
                                className="btn-icon btn-secondary"
                                title="Modifier"
                              >
                                <Edit2 size={15} color="var(--primary-light)" />
                              </button>
                              <button
                                onClick={() => handleDelete(rdv.id)}
                                className="btn-icon btn-secondary"
                                title="Supprimer"
                              >
                                <Trash2 size={15} color="var(--accent-rose)" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingRdv ? 'Modifier le Rendez-vous' : 'Planifier un Rendez-vous'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="btn-icon btn-secondary" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fb7185',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {formatPatientName(p)} ({p.telephone || 'Sans tél'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Médecin Spécialiste *</label>
                    <select
                      required
                      value={formData.medecinId}
                      onChange={(e) => setFormData({ ...formData, medecinId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map((m) => (
                        <option key={m.id} value={m.id}>
                          {formatDoctorName(m)} — {m.specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Date de consultation *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Heure choisie *</label>
                    <input
                      type="time"
                      required
                      value={formData.heure}
                      onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Créneaux suggérés / Détection de conflits */}
                {formData.medecinId && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                        Créneaux du médecin ({formData.date}) - Détection des conflits :
                      </span>
                      {loadingCreneaux && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vérification...</span>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {creneaux.length === 0 && !loadingCreneaux ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cabinet fermé ou aucun créneau ce jour-là.</span>
                      ) : (
                        creneaux.map((c) => (
                          <button
                            type="button"
                            key={c.heure}
                            disabled={!c.disponible}
                            onClick={() => setFormData({ ...formData, heure: c.heure })}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: c.disponible ? 'pointer' : 'not-allowed',
                              border: `1px solid ${
                                formData.heure === c.heure
                                  ? '#38bdf8'
                                  : c.disponible
                                  ? 'rgba(34, 197, 94, 0.4)'
                                  : 'rgba(239, 68, 68, 0.3)'
                              }`,
                              background:
                                formData.heure === c.heure
                                  ? '#0284c7'
                                  : c.disponible
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(239, 68, 68, 0.1)',
                              color:
                                formData.heure === c.heure
                                  ? '#ffffff'
                                  : c.disponible
                                  ? '#4ade80'
                                  : '#f87171',
                            }}
                          >
                            {c.heure} {!c.disponible && '(Pris)'}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Motif de consultation *</label>
                  <input
                    type="text"
                    required
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="form-input"
                    placeholder="ex: Consultation cardiologique, bilan tensionnel..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="form-select"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Enregistrement...' : editingRdv ? 'Mettre à jour' : 'Planifier le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
