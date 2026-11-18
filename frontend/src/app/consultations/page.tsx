'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Consultation, Patient, RendezVous, AllergieAlerte } from '@/types';
import {
  Activity,
  Plus,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Heart,
  Scale,
  Printer,
  Calendar,
  User,
  Stethoscope,
  X,
  CreditCard,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ConsultationsContent() {
  const searchParams = useSearchParams();
  const initialRdvId = searchParams.get('rdvId');

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedRdvId, setSelectedRdvId] = useState<string>(initialRdvId || '');
  const [motif, setMotif] = useState('');
  const [symptomes, setSymptomes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [notes, setNotes] = useState('');
  const [tension, setTension] = useState<number | ''>(12.8);
  const [poids, setPoids] = useState<number | ''>(70);
  const [temperature, setTemperature] = useState<number | ''>(37.0);

  // Ordonnance fields
  const [creerOrdonnance, setCreerOrdonnance] = useState(true);
  const [medicaments, setMedicaments] = useState('');
  const [descriptionOrdo, setDescriptionOrdo] = useState('');
  const [allergyAlerts, setAllergyAlerts] = useState<AllergieAlerte[]>([]);
  const [checkingAllergies, setCheckingAllergies] = useState(false);

  // Print modal
  const [printConsultation, setPrintConsultation] = useState<Consultation | null>(null);

  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [consultList, rdvList, patList] = await Promise.all([
        api.getConsultations(),
        api.getRendezVous(),
        api.getPatients(),
      ]);
      setConsultations(consultList);
      setRdvs(rdvList);
      setPatients(patList);

      if (initialRdvId) {
        const found = rdvList.find((r) => r.id === Number(initialRdvId));
        if (found) {
          setSelectedRdvId(String(found.id));
          setMotif(found.motif || 'Consultation');
          setShowModal(true);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialRdvId]);

  // Real-time allergy check when typing medications
  useEffect(() => {
    if (!medicaments || !selectedRdvId) {
      setAllergyAlerts([]);
      return;
    }

    const rdv = rdvs.find((r) => r.id === Number(selectedRdvId));
    const patId = typeof rdv?.patient === 'object' ? rdv?.patient?.id : null;
    if (!patId) return;

    const timer = setTimeout(async () => {
      try {
        setCheckingAllergies(true);
        const res = await api.verifierAllergies(patId, medicaments);
        setAllergyAlerts(res.alertes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingAllergies(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [medicaments, selectedRdvId, rdvs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRdvId) {
      alert('Veuillez sélectionner un rendez-vous');
      return;
    }

    try {
      setSaving(true);
      const rdvObj = rdvs.find((r) => r.id === Number(selectedRdvId));

      // 1. Create Consultation
      const newConsult = await api.createConsultation({
        rendezVous: `/api/rendez-vous/${selectedRdvId}`,
        motif,
        symptomes,
        diagnostic,
        notes,
        tension: tension !== '' ? Number(tension) : undefined,
        poids: poids !== '' ? Number(poids) : undefined,
        temperature: temperature !== '' ? Number(temperature) : undefined,
      });

      // 2. Create Ordonnance if requested
      if (creerOrdonnance && medicaments.trim()) {
        await api.createOrdonnance({
          rendezVous: `/api/rendez-vous/${selectedRdvId}`,
          medicaments,
          date: new Date().toISOString().split('T')[0],
          description: descriptionOrdo,
        });
      }

      // 3. Automatically generate Facture (en Dinars Tunisiens TND)
      const tarif = (typeof rdvObj?.medecin === 'object' ? rdvObj?.medecin?.tarif : 60) || 60;
      await api.createFacture({
        consultation: `/api/consultations/${newConsult.id}`,
        montant: tarif,
        statut: 'paye',
        modePaiement: 'carte',
        dateFacture: new Date().toISOString(),
        notes: `Facturation automatique de la consultation #${newConsult.id}`,
      });

      // 4. Mark appointment as Terminé
      await api.updateRendezVous(Number(selectedRdvId), { statut: 'Terminé' });

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la création de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedRdvId('');
    setMotif('');
    setSymptomes('');
    setDiagnostic('');
    setNotes('');
    setTension(12.8);
    setPoids(70);
    setTemperature(37.0);
    setMedicaments('');
    setDescriptionOrdo('');
    setAllergyAlerts([]);
  };

  // Filter consultations
  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    const rdv = typeof c.rendezVous === 'object' ? c.rendezVous : null;
    const pat = rdv && typeof rdv.patient === 'object' ? rdv.patient : null;
    const med = rdv && typeof rdv.medecin === 'object' ? rdv.medecin : null;

    return (
      (c.motif && c.motif.toLowerCase().includes(q)) ||
      (c.diagnostic && c.diagnostic.toLowerCase().includes(q)) ||
      (pat && `${pat.prenom} ${pat.nom}`.toLowerCase().includes(q)) ||
      (med && `${med.prenom} ${med.nom}`.toLowerCase().includes(q))
    );
  });

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
              Consultations & Dossier Médical
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Examen clinique, constantes vitales, rédaction d'ordonnances avec alertes d'allergies IA.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Nouvelle Consultation
          </button>
        </div>

        {/* Search */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher par patient, diagnostic, motif ou médecin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.95rem',
              width: '100%',
            }}
          />
        </div>

        {/* Consultations List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Chargement des consultations...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '3rem',
              textAlign: 'center',
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)',
            }}>
              <Activity size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, color: '#e2e8f0' }}>Aucune consultation trouvée</p>
            </div>
          ) : (
            filtered.map((c) => {
              const rdv = typeof c.rendezVous === 'object' ? c.rendezVous : null;
              const pat = rdv && typeof rdv.patient === 'object' ? rdv.patient : null;
              const med = rdv && typeof rdv.medecin === 'object' ? rdv.medecin : null;

              return (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    {/* Patient & Date header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                          {pat ? `${pat.prenom} ${pat.nom}` : 'Patient non spécifié'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Dr. {med ? `${med.prenom} ${med.nom}` : 'Médecin'} • {med?.specialite || 'Général'}
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        #{c.id}
                      </span>
                    </div>

                    {/* Vitals Pills */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                        <Heart size={14} color="#f87171" />
                        <span>Tension: <strong>{c.tension ? `${c.tension} cmHg` : 'N/A'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                        <Scale size={14} color="#60a5fa" />
                        <span>Poids: <strong>{c.poids ? `${c.poids} kg` : 'N/A'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                        <Thermometer size={14} color="#fbbf24" />
                        <span>Temp: <strong>{c.temperature ? `${c.temperature}°C` : 'N/A'}</strong></span>
                      </div>
                    </div>

                    {/* Diagnosis & Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      {c.diagnostic && (
                        <div>
                          <strong style={{ color: '#38bdf8' }}>Diagnostic : </strong>
                          <span style={{ color: '#cbd5e1' }}>{c.diagnostic}</span>
                        </div>
                      )}
                      {c.symptomes && (
                        <div>
                          <strong style={{ color: '#94a3b8' }}>Symptômes : </strong>
                          <span style={{ color: '#94a3b8' }}>{c.symptomes}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          Note : {c.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {c.dateConsultation ? new Date(c.dateConsultation).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                    </span>

                    <button
                      onClick={() => setPrintConsultation(c)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Printer size={14} />
                      Imprimer Ordonnance
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal : Nouvelle Consultation */}
        {showModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}>
            <div className="card" style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Saisie de Consultation Médicale
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Renseignez l'examen clinique, les constantes et la prescription avec contrôle d'allergie intelligent.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Rendez-vous selector */}
                <div>
                  <label className="form-label">Rendez-vous associé *</label>
                  <select
                    className="form-input"
                    value={selectedRdvId}
                    onChange={(e) => {
                      setSelectedRdvId(e.target.value);
                      const r = rdvs.find((x) => x.id === Number(e.target.value));
                      if (r) setMotif(r.motif || 'Consultation');
                    }}
                    required
                  >
                    <option value="">Sélectionnez un rendez-vous...</option>
                    {rdvs.map((r) => {
                      const p = typeof r.patient === 'object' ? r.patient : null;
                      const m = typeof r.medecin === 'object' ? r.medecin : null;
                      return (
                        <option key={r.id} value={r.id}>
                          RDV #{r.id} - {p ? `${p.prenom} ${p.nom}` : 'Patient'} avec Dr. {m ? m.nom : 'Médecin'} ({r.date} {r.heure})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Patient Allergies Notice if selected */}
                {selectedRdvId && (() => {
                  const r = rdvs.find((x) => x.id === Number(selectedRdvId));
                  const p = typeof r?.patient === 'object' ? r?.patient : null;
                  if (!p?.allergies) return null;
                  return (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#f87171',
                      fontSize: '0.85rem',
                    }}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Allergies du patient connues : </strong>
                        {p.allergies}
                      </div>
                    </div>
                  );
                })()}

                {/* Constantes vitales */}
                <div>
                  <label className="form-label">Constantes Vitales</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Tension (cmHg)</span>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="Ex: 12.8"
                        value={tension}
                        onChange={(e) => setTension(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Poids (kg)</span>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input"
                        placeholder="Ex: 72"
                        value={poids}
                        onChange={(e) => setPoids(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Température (°C)</span>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="Ex: 37.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                </div>

                {/* Examen & Diagnostic */}
                <div>
                  <label className="form-label">Motif & Symptômes</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Symptômes décrits par le patient, antécédents récents..."
                    value={symptomes}
                    onChange={(e) => setSymptomes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Diagnostic Médical *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ex: Rhinopharyngite aiguë, Surveillance hypertension..."
                    value={diagnostic}
                    onChange={(e) => setDiagnostic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Notes cliniques & recommandations</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Recommandations d'hygiène, examens complémentaires prescrits..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Ordonnance Section */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} color="#38bdf8" />
                      <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>
                        Ordonnance Numérique & Prescription
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <input
                        type="checkbox"
                        checked={creerOrdonnance}
                        onChange={(e) => setCreerOrdonnance(e.target.checked)}
                      />
                      Générer ordonnance
                    </label>
                  </div>

                  {creerOrdonnance && (
                    <>
                      <div>
                        <label className="form-label">Médicaments & Posologie (détection d'allergie IA active)</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="Ex: 1. Amoxicilline 500mg (1 gélule matin et soir pendant 6 jours)&#10;2. Paracétamol 1000mg si fièvre"
                          value={medicaments}
                          onChange={(e) => setMedicaments(e.target.value)}
                        />
                      </div>

                      {/* AI Allergy Warnings Alert Banner */}
                      {allergyAlerts.length > 0 && (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '2px solid #ef4444',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          animation: 'pulse 1.5s infinite',
                        }}>
                          {allergyAlerts.map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#fca5a5' }}>
                              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <strong style={{ color: '#fff', textTransform: 'uppercase' }}>🚨 ALERTE ALLERGIE MAJEURE ({a.allergie}) :</strong>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{a.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="form-label">Instructions patient (durée, précautions)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Prendre au milieu des repas. Bien s'hydrater. Revoir le médecin si persistance."
                          value={descriptionOrdo}
                          onChange={(e) => setDescriptionOrdo(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={16} />
                    {saving ? 'Enregistrement...' : 'Valider & Générer Facture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable modal preview */}
        {printConsultation && (
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
                onClick={() => setPrintConsultation(null)}
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

              {/* Clinic Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1', margin: 0 }}>CLINIQUE SANTÉPLUS</h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Plateforme Médicale Intelligente</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>12 Avenue de la République • 75011 Paris • Tél: 01 42 00 00 00</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>ORDONNANCE MÉDICALE</span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Date : {printConsultation.dateConsultation ? new Date(printConsultation.dateConsultation).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                  </p>
                </div>
              </div>

              {/* Patient info */}
              {(() => {
                const r = typeof printConsultation.rendezVous === 'object' ? printConsultation.rendezVous : null;
                const p = r && typeof r.patient === 'object' ? r.patient : null;
                const m = r && typeof r.medecin === 'object' ? r.medecin : null;

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>PATIENT</div>
                        <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{p ? `${p.prenom} ${p.nom}` : 'Patient'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>Dossier: {p?.numeroDossier || 'N/A'} • Groupe: {p?.groupeSanguin || 'N/A'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>PRATICIEN</div>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Dr. {m ? `${m.prenom} ${m.nom}` : 'Médecin'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>{m?.specialite || 'Généraliste'}</div>
                      </div>
                    </div>

                    {/* Prescription lines */}
                    <div style={{ minHeight: '140px', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Prescription :
                      </div>
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-line' }}>
                        {printConsultation.notes || '1. Traitement conforme au diagnostic médical établi.\n2. Repos et hydratation.'}
                      </div>
                    </div>

                    {/* Signature */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                      <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Signature & Cachet du Médecin</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>Dr. {m?.nom}</p>
                      </div>
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
                  Lancer l'impression
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={null}>
      <ConsultationsContent />
    </Suspense>
  );
}
