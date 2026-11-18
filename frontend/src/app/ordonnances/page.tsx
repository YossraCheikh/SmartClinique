'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Ordonnance, RendezVous } from '@/types';
import { formatDoctorName, formatPatientName, formatAppointmentDate } from '@/lib/formatters';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  X,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Sparkles,
  CheckCircle,
} from 'lucide-react';


export default function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | null>(null);
  const [editingOrd, setEditingOrd] = useState<Ordonnance | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    medicaments: '',
    description: '',
    rdvId: '',
  });
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordData, rdvData] = await Promise.all([
        api.getOrdonnances(),
        api.getRendezVous(),
      ]);
      setOrdonnances(ordData);
      setRdvs(rdvData);
    } catch (err: any) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingOrd(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      medicaments: '',
      description: 'Posologie : 1 comprimé le matin et 1 le soir pendant 7 jours.',
      rdvId: rdvs[0] ? String(rdvs[0].id) : '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (ord: Ordonnance) => {
    setEditingOrd(ord);
    const rId = typeof ord.rendezVous === 'object' && ord.rendezVous ? String(ord.rendezVous.id) : '';
    setFormData({
      date: ord.date ? ord.date.split('T')[0] : '',
      medicaments: ord.medicaments,
      description: ord.description || '',
      rdvId: rId,
    });
    setError(null);
    setModalOpen(true);
  };

  const openPrintModal = (ord: Ordonnance) => {
    setSelectedOrdonnance(ord);
    setPrintModalOpen(true);
  };

  // AI Assistant for Prescription suggestions
  const handleAiSuggest = async () => {
    if (!formData.medicaments.trim()) {
      setError('Veuillez renseigner un médicament ou symptôme pour les suggestions IA.');
      return;
    }
    setAiSuggesting(true);
    setError(null);

    try {
      const res = await api.sendChatMessage(
        `En tant qu'assistant médical, suggère une posologie standard et recommandations de précaution pour cette prescription : "${formData.medicaments}". Sois concis.`
      );
      setFormData((prev) => ({
        ...prev,
        description: prev.description ? `${prev.description}\n\n[Suggestion IA] :\n${res.response}` : `[Suggestion IA] :\n${res.response}`,
      }));
    } catch (err: any) {
      setError('Impossible d\'obtenir la suggestion IA pour le moment.');
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rdvId) {
      setError('Veuillez sélectionner un rendez-vous associé.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const rdvIri = `/api/rendez-vous/${formData.rdvId}`;

      if (editingOrd) {
        await api.updateOrdonnance(editingOrd.id, {
          date: formData.date,
          medicaments: formData.medicaments,
          description: formData.description || undefined,
          rendezVous: rdvIri,
        });
      } else {
        await api.createOrdonnance({
          date: formData.date,
          medicaments: formData.medicaments,
          description: formData.description || undefined,
          rendezVous: rdvIri,
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
    if (!window.confirm('Supprimer cette ordonnance médicale ?')) return;
    try {
      await api.deleteOrdonnance(id);
      fetchData();
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de supprimer cette ordonnance.'}`);
    }
  };

  const filteredOrdonnances = ordonnances.filter((o) => {
    const q = search.toLowerCase();
    const rdv = typeof o.rendezVous === 'object' ? o.rendezVous : null;
    const p = rdv && typeof rdv.patient === 'object' ? `${rdv.patient.nom} ${rdv.patient.prenom}` : '';
    const m = rdv && typeof rdv.medecin === 'object' ? `${rdv.medecin.nom}` : '';
    return (
      o.medicaments.toLowerCase().includes(q) ||
      (o.description && o.description.toLowerCase().includes(q)) ||
      p.toLowerCase().includes(q) ||
      m.toLowerCase().includes(q)
    );
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
            Gestion des <span className="gradient-text">Ordonnances</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Prescriptions médicales numériques avec assistance posologique IA
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Rédiger une Ordonnance
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par médicament, patient, médecin prescripteur..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '0.92rem',
            width: '100%',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="btn-icon btn-secondary" style={{ width: '28px', height: '28px' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Ordonnances Cards Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement des ordonnances...
        </div>
      ) : filteredOrdonnances.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
          <p>Aucune ordonnance trouvée.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredOrdonnances.map((ord) => {
            const rdv = typeof ord.rendezVous === 'object' ? ord.rendezVous : null;
            const patient = rdv && typeof rdv.patient === 'object' ? rdv.patient : null;
            const medecin = rdv && typeof rdv.medecin === 'object' ? rdv.medecin : null;
            const dateStr = ord.date ? new Date(ord.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }) : '';

            return (
              <div
                key={ord.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Pill size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        Ordonnance #{ord.id}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Délivrée le {dateStr}
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-amber">Prescription</span>
                </div>

                {/* Patient & Doctor Box */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      Bénéficiaire
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {formatPatientName(patient)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      Médecin
                    </span>
                    <strong style={{ color: 'var(--primary-light)' }}>
                      {formatDoctorName(medecin)}
                    </strong>
                  </div>
                </div>

                {/* Medication Details */}
                <div style={{ marginBottom: '1.25rem', flex: 1 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                  }}>
                    Traitements prescrits
                  </div>
                  <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5',
                  }}>
                    {ord.medicaments}
                  </p>

                  {ord.description && (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <em>Note : {ord.description}</em>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                  marginTop: 'auto',
                }}>
                  <button
                    onClick={() => openPrintModal(ord)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Printer size={15} />
                    Imprimer / PDF
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => openEditModal(ord)}
                      className="btn-icon btn-secondary"
                      title="Modifier"
                    >
                      <Edit2 size={15} color="var(--primary-light)" />
                    </button>
                    <button
                      onClick={() => handleDelete(ord.id)}
                      className="btn-icon btn-secondary"
                      title="Supprimer"
                    >
                      <Trash2 size={15} color="var(--accent-rose)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Preview Modal */}
      {printModalOpen && selectedOrdonnance && (
        <div className="modal-overlay" onClick={() => setPrintModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', background: '#ffffff', color: '#111827' }}
          >
            <div style={{ padding: '2.5rem' }} id="printable-prescription">
              {/* Clinic Letterhead */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '2px solid #0284c7',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#0284c7', fontWeight: 800 }}>
                    CLINIQUE MÉDICALE SANTÉ+
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                    Cabinet de Consultations et Soins Spécialisés
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Tél : +216 71 000 000 • Email : contact@cliniquesante.com
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}>
                    ORDONNANCE #{selectedOrdonnance.id}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.5rem' }}>
                    Date : {new Date(selectedOrdonnance.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '2rem',
                fontSize: '0.9rem',
              }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Patient</span>
                  <p style={{ fontWeight: 700, color: '#111827' }}>
                    {typeof selectedOrdonnance.rendezVous === 'object' && selectedOrdonnance.rendezVous?.patient
                      ? formatPatientName(selectedOrdonnance.rendezVous.patient as any)
                      : 'Patient'}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Médecin Prescripteur</span>
                  <p style={{ fontWeight: 700, color: '#0284c7' }}>
                    {typeof selectedOrdonnance.rendezVous === 'object' && selectedOrdonnance.rendezVous?.medecin
                      ? formatDoctorName(selectedOrdonnance.rendezVous.medecin as any)
                      : 'Médecin'}
                  </p>
                </div>
              </div>

              {/* Prescription Body */}
              <div style={{ minHeight: '220px', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Prescription Médicale :
                </h4>
                <div style={{
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap',
                  paddingLeft: '0.5rem',
                }}>
                  {selectedOrdonnance.medicaments}
                </div>

                {selectedOrdonnance.description && (
                  <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.85rem', color: '#4b5563' }}>
                    <strong>Instructions & Posologie :</strong>
                    <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{selectedOrdonnance.description}</p>
                  </div>
                )}
              </div>

              {/* Signature Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Document officiel généré par Clinique Santé+
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '2.5rem' }}>
                    Signature et Cachet du Médecin
                  </p>
                  <div style={{ width: '160px', borderBottom: '1px dashed #9ca3af' }} />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f9fafb', borderTopColor: '#e5e7eb' }}>
              <button onClick={() => setPrintModalOpen(false)} className="btn btn-secondary" style={{ color: '#111827' }}>
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={16} />
                Lancer l'impression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingOrd ? 'Modifier l\'Ordonnance' : 'Rédiger une Ordonnance'}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Rendez-vous associé *</label>
                    <select
                      required
                      value={formData.rdvId}
                      onChange={(e) => setFormData({ ...formData, rdvId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Sélectionner un rendez-vous</option>
                      {rdvs.map((r) => {
                        const p = typeof r.patient === 'object' && r.patient ? formatPatientName(r.patient) : `RDV #${r.id}`;
                        const d = r.date ? r.date.split('T')[0] : '';
                        return (
                          <option key={r.id} value={r.id}>
                            #{r.id} - {p} ({d})
                          </option>
                        );
                      })}
                    </select>
                  </div>


                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label className="form-label">Médicaments prescrits *</label>
                    <button
                      type="button"
                      onClick={handleAiSuggest}
                      disabled={aiSuggesting || !formData.medicaments.trim()}
                      className="badge badge-sky"
                      style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Sparkles size={12} />
                      {aiSuggesting ? 'Analyse IA...' : 'Suggérer posologie IA'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={formData.medicaments}
                    onChange={(e) => setFormData({ ...formData, medicaments: e.target.value })}
                    className="form-textarea"
                    placeholder="ex:&#10;1. Paracétamol 1000mg - 3x par jour pendant 5 jours&#10;2. Amoxicilline 500mg - 2x par jour pendant 7 jours"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recommandations & Instructions</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                    placeholder="Instructions diététiques, repos, précautions d'emploi..."
                  />
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
                  {submitting ? 'Enregistrement...' : editingOrd ? 'Mettre à jour' : 'Émettre l\'ordonnance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
