'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Medecin } from '@/types';
import { formatDoctorName } from '@/lib/formatters';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  Clock,
  Upload,
  Check,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';

function MedecinsContent() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialite, setSelectedSpecialite] = useState<string>('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedecin, setEditingMedecin] = useState<Medecin | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    specialite: 'Généraliste',
    telephone: '',
    email: '',
    disponibilite: 'Lun-Ven 09:00 - 17:00',
    image: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedecins = async () => {
    try {
      setLoading(true);
      const data = await api.getMedecins();
      setMedecins(data);
    } catch (err: any) {
      console.error('Failed to load medecins', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedecins();
  }, []);

  const specialites = Array.from(new Set(medecins.map((m) => m.specialite))).filter(Boolean);

  const openCreateModal = () => {
    setEditingMedecin(null);
    setFormData({
      nom: '',
      prenom: '',
      specialite: 'Généraliste',
      telephone: '',
      email: '',
      disponibilite: 'Lun-Ven 09:00 - 17:00',
      image: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (m: Medecin) => {
    setEditingMedecin(m);
    setFormData({
      nom: m.nom,
      prenom: m.prenom,
      specialite: m.specialite,
      telephone: m.telephone,
      email: m.email,
      disponibilite: m.disponibilite || 'Lun-Ven 09:00 - 17:00',
      image: m.image || '',
    });
    setImageFile(null);
    setImagePreview(m.image ? `http://localhost:8000/uploads/medecins/${m.image}` : null);
    setError(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let finalFilename = formData.image;

      // If user uploaded a new image file, upload it first to /api/upload
      if (imageFile) {
        const uploadRes = await api.uploadImage(imageFile);
        finalFilename = uploadRes.filename;
      }

      const cleanNom = formData.nom.replace(/^Dr\.?\s*/i, '').trim();
      const cleanPrenom = formData.prenom.replace(/^Dr\.?\s*/i, '').trim();

      if (editingMedecin) {
        await api.updateMedecin(editingMedecin.id, {
          nom: cleanNom,
          prenom: cleanPrenom,
          specialite: formData.specialite,
          telephone: formData.telephone,
          email: formData.email,
          disponibilite: formData.disponibilite,
          image: finalFilename || undefined,
        });
      } else {
        await api.createMedecin({
          nom: cleanNom,
          prenom: cleanPrenom,
          specialite: formData.specialite,
          telephone: formData.telephone,
          email: formData.email,
          disponibilite: formData.disponibilite,
          image: finalFilename || undefined,
        });
      }
      setModalOpen(false);
      setSearch('');
      setSelectedSpecialite('all');
      await fetchMedecins();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de ${formatDoctorName({ nom: name })} ?`)) {
      return;
    }
    try {
      await api.deleteMedecin(id);
      fetchMedecins();
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de supprimer ce médecin.'}`);
    }
  };

  const filteredMedecins = medecins.filter((m) => {
    const nom = (m.nom || '').toLowerCase();
    const prenom = (m.prenom || '').toLowerCase();
    const spec = (m.specialite || '').toLowerCase();
    const q = (search || '').toLowerCase();
    const matchesSearch =
      nom.includes(q) ||
      prenom.includes(q) ||
      spec.includes(q);
    const matchesSpec = selectedSpecialite === 'all' || m.specialite === selectedSpecialite;
    return matchesSearch && matchesSpec;
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
            Corps <span className="gradient-text">Médical</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {medecins.length} praticiens et spécialistes rattachés à la clinique
          </p>
        </div>

        {isAdmin ? (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} />
            Ajouter un Médecin
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
          }}>
            <ShieldAlert size={14} color="var(--accent-amber)" />
            Ajout réservé à l'administrateur
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
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
            placeholder="Rechercher par nom ou spécialité..."
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

        {/* Specialty Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedSpecialite('all')}
            className={`badge ${selectedSpecialite === 'all' ? 'badge-sky' : ''}`}
            style={{
              cursor: 'pointer',
              background: selectedSpecialite === 'all' ? undefined : 'rgba(255, 255, 255, 0.05)',
              border: selectedSpecialite === 'all' ? undefined : '1px solid var(--border-color)',
              color: selectedSpecialite === 'all' ? undefined : 'var(--text-muted)',
              padding: '0.4rem 0.8rem',
            }}
          >
            Toutes
          </button>
          {specialites.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialite(spec)}
              className={`badge ${selectedSpecialite === spec ? 'badge-sky' : ''}`}
              style={{
                cursor: 'pointer',
                background: selectedSpecialite === spec ? undefined : 'rgba(255, 255, 255, 0.05)',
                border: selectedSpecialite === spec ? undefined : '1px solid var(--border-color)',
                color: selectedSpecialite === spec ? undefined : 'var(--text-muted)',
                padding: '0.4rem 0.8rem',
              }}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement du corps médical...
        </div>
      ) : filteredMedecins.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UserCheck size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
          <p>Aucun médecin trouvé.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredMedecins.map((m) => (
            <div
              key={m.id}
              className="glass-panel"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Doctor Header */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)',
                  border: '2px solid rgba(56, 189, 248, 0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}>
                  {m.image ? (
                    <img
                      src={`http://localhost:8000/uploads/medecins/${m.image}`}
                      alt={m.nom}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>Dr</span>
                  )}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {formatDoctorName(m)}
                  </h3>
                  <span className="badge badge-purple" style={{ marginTop: '0.25rem' }}>
                    <Stethoscope size={11} />
                    {m.specialite}
                  </span>
                </div>
              </div>

              {/* Contact & Availability */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} color="var(--primary-light)" />
                  <span>{m.disponibilite || 'Lun-Ven 09h-17h'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} color="var(--accent-emerald)" />
                  <span>{m.telephone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} color="var(--accent-purple)" />
                  <span>{m.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                }}>
                  <button
                    onClick={() => openEditModal(m)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Edit2 size={14} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, `${m.nom} ${m.prenom}`)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit Medecin */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingMedecin ? `Modifier ${formatDoctorName(editingMedecin)}` : 'Ajouter un Médecin'}
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

                {/* Photo Upload Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px dashed var(--border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UserCheck size={28} color="var(--text-dim)" />
                    )}
                  </div>
                  <div>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      <Upload size={15} />
                      Choisir une photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                      JPG, PNG jusqu'à 5 Mo
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nom de famille *</label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="form-input"
                      placeholder="ex: Ben Amor (sans Dr.)"
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
                      placeholder="ex: Sarah"
                    />
                  </div>
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Spécialité *</label>
                    <select
                      value={formData.specialite}
                      onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                      className="form-select"
                    >
                      <option value="Cardiologue">Cardiologue</option>
                      <option value="Dermatologue">Dermatologue</option>
                      <option value="Généraliste">Généraliste</option>
                      <option value="Pédiatre">Pédiatre</option>
                      <option value="Ophtalmologue">Ophtalmologue</option>
                      <option value="Neurologue">Neurologue</option>
                      <option value="Orthopédiste">Orthopédiste</option>
                      <option value="Gynécologue">Gynécologue</option>
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
                      placeholder="ex: 06 99 88 77 66"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email professionnel *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="docteur@clinique.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Disponibilités</label>
                  <input
                    type="text"
                    value={formData.disponibilite}
                    onChange={(e) => setFormData({ ...formData, disponibilite: e.target.value })}
                    className="form-input"
                    placeholder="ex: Lun-Jeu 08:30 - 16:30"
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
                  {submitting ? 'Enregistrement...' : editingMedecin ? 'Mettre à jour' : 'Ajouter le médecin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function MedecinsPage() {
  return (
    <Suspense fallback={null}>
      <MedecinsContent />
    </Suspense>
  );
}
