'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Patient } from '@/types';
import { formatPatientName } from '@/lib/formatters';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

function PatientsContent() {
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);


  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: 'M',
    telephone: '',
    email: '',
    adresse: '',
    groupeSanguin: '',
    allergies: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (err: any) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData({
      nom: '',
      prenom: '',
      dateNaissance: '',
      sexe: 'M',
      telephone: '',
      email: '',
      adresse: '',
      groupeSanguin: '',
      allergies: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      nom: patient.nom,
      prenom: patient.prenom,
      dateNaissance: patient.dateNaissance || '',
      sexe: patient.sexe || 'M',
      telephone: patient.telephone,
      email: patient.email,
      adresse: patient.adresse || '',
      groupeSanguin: patient.groupeSanguin || '',
      allergies: patient.allergies || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.dateNaissance ? formData.dateNaissance : undefined,
        sexe: formData.sexe,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse || undefined,
        groupeSanguin: formData.groupeSanguin || undefined,
        allergies: formData.allergies || undefined,
      };

      if (editingPatient) {
        await api.updatePatient(editingPatient.id, payload);
      } else {
        await api.createPatient(payload);
      }
      setModalOpen(false);
      setSearch('');
      await fetchPatients();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier de ${name} ?`)) {
      return;
    }
    try {
      await api.deletePatient(id);
      fetchPatients();
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de supprimer ce patient.'}`);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.nom || '').toLowerCase().includes(q) ||
      (p.prenom || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.telephone || '').includes(q)
    );
  });

  return (
    <AppLayout>
      {/* Page Header */}
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
            Gestion des <span className="gradient-text">Patients</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {patients.length} dossiers médicaux enregistrés dans l'établissement
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Nouveau Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom, email ou téléphone..."
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
          <button
            onClick={() => setSearch('')}
            className="btn-icon btn-secondary"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Patients Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chargement des patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
            <p>Aucun patient trouvé.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Âge</th>
                  <th>Contact</th>
                  <th>Adresse</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const initialPrenom = patient.prenom ? patient.prenom[0].toUpperCase() : 'P';
                  const initialNom = patient.nom ? patient.nom[0].toUpperCase() : '';
                  const displayName = formatPatientName(patient);

                  return (
                    <tr key={patient.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'var(--primary-light)',
                          }}>
                            {initialPrenom}{initialNom}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {displayName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                {patient.numeroDossier || `DOS-${patient.id}`}
                              </span>
                              {patient.groupeSanguin && (
                                <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                  {patient.groupeSanguin}
                                </span>
                              )}
                            </div>
                            {patient.allergies && (
                              <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                                ⚠️ {patient.allergies}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>


                    <td>
                      <span className="badge badge-sky">
                        {patient.dateNaissance
                          ? new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear() + ' ans'
                          : patient.sexe === 'F' ? '👩 F' : patient.sexe === 'M' ? '👨 M' : '—'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.82rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                          <Phone size={13} color="var(--primary-light)" />
                          {patient.telephone}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                          <Mail size={13} color="var(--accent-purple)" />
                          {patient.email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} color="var(--text-dim)" />
                        {patient.adresse || 'Non renseignée'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="btn-icon btn-secondary"
                          title="Modifier le patient"
                        >
                          <Edit2 size={15} color="var(--primary-light)" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id, `${patient.prenom} ${patient.nom}`)}
                          className="btn-icon btn-secondary"
                          title="Supprimer"
                          style={{ borderColor: 'rgba(244, 63, 94, 0.2)' }}
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
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


      {/* Modal Create/Edit Patient */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingPatient ? 'Modifier le Dossier Patient' : 'Créer un Nouveau Patient'}
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
                    <label className="form-label">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="form-input"
                      placeholder="ex: Ben Ali"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="form-input"
                      placeholder="ex: Ahmed"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Date de naissance</label>
                    <input
                      type="date"
                      value={formData.dateNaissance}
                      onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexe</label>
                    <select
                      value={formData.sexe}
                      onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                      className="form-input"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Groupe sanguin</label>
                    <select
                      value={formData.groupeSanguin}
                      onChange={(e) => setFormData({ ...formData, groupeSanguin: e.target.value })}
                      className="form-input"
                    >
                      <option value="">—</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="form-input"
                      placeholder="ex: 06 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Allergies connues</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="form-input"
                    placeholder="ex: Pénicilline, Aspirine..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="patient@email.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse de résidence</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="form-input"
                    placeholder="ex: 15 Rue de la Liberté, Tunis"
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
                  {submitting ? 'Enregistrement...' : editingPatient ? 'Mettre à jour' : 'Créer le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <PatientsContent />
    </Suspense>
  );
}

