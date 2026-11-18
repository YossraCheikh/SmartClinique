'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Chirurgie, Medecin, Patient } from '@/types';
import {
  Scissors,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Edit2,
  Trash2,
  ShieldCheck,
  Stethoscope,
  Filter,
  Check,
  Play,
  RotateCcw,
  Building,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Phone,
  FileText,
  BadgeAlert,
  SlidersHorizontal,
} from 'lucide-react';

// Operating Rooms standard list
const SALLES_BLOC = [
  { id: 'bloc-1', name: 'Bloc Opératoire 1 (Majeur)', type: 'Chirurgie Majeure & Viscérale', capacity: 'Opérationnel' },
  { id: 'bloc-2', name: 'Bloc Opératoire 2 (Ambulatoire)', type: 'Chirurgie Ambulatoire & Plastique', capacity: 'Opérationnel' },
  { id: 'bloc-3', name: 'Bloc 3 (Cardiovasculaire & CEC)', type: 'Chirurgie Cardio-vasculaire', capacity: 'Opérationnel' },
  { id: 'bloc-4', name: 'Bloc 4 (Neurochirurgie & Rachis)', type: 'Neurochirurgie & Orthopédie lourde', capacity: 'Opérationnel' },
  { id: 'bloc-endo', name: 'Salle d\'Endoscopie & Cœlioscopie', type: 'Endoscopie Interventionnelle', capacity: 'Opérationnel' },
];

const SUGGESTIONS_INTERVENTIONS = [
  'Arthroscopie du genou (Méniscectomie)',
  'Cholécystectomie par cœlioscopie',
  'Cure de hernie discale lombaire',
  'Reconstruction ligament croisé (LCA)',
  'Pontage aorto-coronarien',
  'Chirurgie de la cataracte par phakoémulsification',
  'Césarienne programmée',
  'Résection transurétrale de prostate (RTUP)',
  'Chirurgie du canal carpien',
  'Thyroïdectomie totale',
];

function ChirurgiesContent() {
  const { user, isMedecin, isSecretaire, isAdmin } = useAuth();
  const searchParams = useSearchParams();

  const [chirurgies, setChirurgies] = useState<Chirurgie[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'blocs' (Room Cards / Planning) or 'table' (Tabular List)
  const [viewMode, setViewMode] = useState<'blocs' | 'table'>('blocs');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salleFilter, setSalleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChirurgie, setEditingChirurgie] = useState<Chirurgie | null>(null);
  const [printChirurgie, setPrintChirurgie] = useState<Chirurgie | null>(null);

  // Form State
  const defaultFixePar = isMedecin
    ? `Dr. ${user?.nom} (Chirurgien)`
    : isSecretaire
    ? `${user?.prenom} ${user?.nom} (Secrétariat Médical)`
    : `Administrateur`;

  const [formData, setFormData] = useState({
    patientId: '',
    chirurgienId: '',
    titreIntervention: '',
    dateIntervention: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    heureDebut: '08:30',
    dureeMinutes: 60,
    salleOperation: 'Bloc Opératoire 1 (Majeur)',
    typeAnesthesie: 'Générale',
    statut: 'Programmée',
    fixePar: defaultFixePar,
    notesPreoperatoires: 'Patient à jeun strict dès minuit. Consultation anesthésique et bilan biologique validés.',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chirData, medData, patData] = await Promise.all([
        api.getChirurgies(),
        api.getMedecins(),
        api.getPatients(),
      ]);
      setChirurgies(chirData || []);
      setMedecins(medData || []);
      setPatients(patData || []);
    } catch (err: any) {
      console.error('Failed to load surgeries data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter surgical doctors
  const chirurgiensList = useMemo(() => {
    return medecins.filter(
      (m) =>
        m.specialite.toLowerCase().includes('chirurg') ||
        m.specialite.toLowerCase().includes('neurochir') ||
        m.specialite.toLowerCase().includes('ophtalmo') ||
        m.specialite.toLowerCase().includes('urolog') ||
        m.specialite.toLowerCase().includes('gynéco')
    );
  }, [medecins]);
  const doctorsForSelection = chirurgiensList.length > 0 ? chirurgiensList : medecins;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const openCreateModal = (preselectedSalle?: string) => {
    setEditingChirurgie(null);
    setFormData({
      patientId: patients[0]?.id ? String(patients[0].id) : '',
      chirurgienId: doctorsForSelection[0]?.id ? String(doctorsForSelection[0].id) : '',
      titreIntervention: '',
      dateIntervention: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      heureDebut: '08:30',
      dureeMinutes: 60,
      salleOperation: preselectedSalle || 'Bloc Opératoire 1 (Majeur)',
      typeAnesthesie: 'Générale',
      statut: 'Programmée',
      fixePar: defaultFixePar,
      notesPreoperatoires: 'Patient à jeun strict dès minuit. Consultation anesthésique et bilan biologique validés.',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (chir: Chirurgie) => {
    setEditingChirurgie(chir);
    const patId = typeof chir.patient === 'object' ? String(chir.patient?.id) : '';
    const chirId = typeof chir.chirurgien === 'object' ? String(chir.chirurgien?.id) : '';
    const dateStr = chir.dateIntervention ? chir.dateIntervention.split('T')[0] : '';
    const timeStr = chir.heureDebut ? chir.heureDebut.split('T')[1]?.slice(0, 5) || chir.heureDebut.slice(0, 5) : '08:30';

    setFormData({
      patientId: patId,
      chirurgienId: chirId,
      titreIntervention: chir.titreIntervention,
      dateIntervention: dateStr,
      heureDebut: timeStr,
      dureeMinutes: chir.dureeMinutes || 60,
      salleOperation: chir.salleOperation || 'Bloc Opératoire 1 (Majeur)',
      typeAnesthesie: chir.typeAnesthesie || 'Générale',
      statut: chir.statut || 'Programmée',
      fixePar: chir.fixePar || defaultFixePar,
      notesPreoperatoires: chir.notesPreoperatoires || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.chirurgienId || !formData.titreIntervention) {
      setError('Veuillez renseigner le patient, le chirurgien et l\'intitulé de l\'intervention.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        patient: `/api/patients/${formData.patientId}`,
        chirurgien: `/api/medecins/${formData.chirurgienId}`,
        titreIntervention: formData.titreIntervention,
        dateIntervention: formData.dateIntervention,
        heureDebut: `${formData.dateIntervention}T${formData.heureDebut}:00`,
        dureeMinutes: Number(formData.dureeMinutes),
        salleOperation: formData.salleOperation,
        typeAnesthesie: formData.typeAnesthesie,
        statut: formData.statut,
        fixePar: formData.fixePar,
        notesPreoperatoires: formData.notesPreoperatoires,
      };

      if (editingChirurgie) {
        await api.updateChirurgie(editingChirurgie.id, payload);
      } else {
        await api.createChirurgie(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement de la chirurgie.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatut = async (id: number, newStatut: string) => {
    try {
      await api.updateChirurgie(id, { statut: newStatut });
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment annuler et supprimer cette intervention chirurgicale ?')) return;
    try {
      await api.deleteChirurgie(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return chirurgies.filter((c) => {
      const q = search.toLowerCase();
      const patName = typeof c.patient === 'object' ? `${c.patient?.prenom} ${c.patient?.nom}`.toLowerCase() : '';
      const chirName = typeof c.chirurgien === 'object' ? `${c.chirurgien?.prenom} ${c.chirurgien?.nom}`.toLowerCase() : '';
      const titre = (c.titreIntervention || '').toLowerCase();
      const salle = (c.salleOperation || '').toLowerCase();
      const dateStr = c.dateIntervention ? c.dateIntervention.split('T')[0] : '';

      const matchesSearch = !q || patName.includes(q) || chirName.includes(q) || titre.includes(q) || salle.includes(q);
      const matchesStatus = statusFilter === 'all' || c.statut === statusFilter;
      const matchesSalle = salleFilter === 'all' || c.salleOperation === salleFilter;

      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = dateStr === todayStr;
      } else if (dateFilter === 'upcoming') {
        matchesDate = dateStr >= todayStr;
      }

      return matchesSearch && matchesStatus && matchesSalle && matchesDate;
    });
  }, [chirurgies, search, statusFilter, salleFilter, dateFilter, todayStr]);

  // KPIs
  const totalInterventions = chirurgies.length;
  const chirProgrammes = chirurgies.filter((c) => c.statut === 'Programmée').length;
  const chirEnCours = chirurgies.filter((c) => c.statut === 'En cours').length;
  const chirAujourdhui = chirurgies.filter((c) => c.dateIntervention && c.dateIntervention.startsWith(todayStr)).length;
  const chirTerminees = chirurgies.filter((c) => c.statut === 'Terminée').length;

  const sallesUniques = useMemo(() => {
    const list = Array.from(new Set(chirurgies.map((c) => c.salleOperation).filter(Boolean)));
    SALLES_BLOC.forEach((s) => {
      if (!list.includes(s.name)) list.push(s.name);
    });
    return list;
  }, [chirurgies]);

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'Programmée':
        return (
          <span className="badge badge-sky" style={{ gap: '0.4rem' }}>
            <Calendar size={12} /> {stat}
          </span>
        );
      case 'En cours':
        return (
          <span className="badge badge-amber" style={{ gap: '0.4rem', animation: 'pulse 2s infinite' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            {stat}
          </span>
        );
      case 'Terminée':
        return (
          <span className="badge badge-emerald" style={{ gap: '0.4rem' }}>
            <CheckCircle2 size={12} /> {stat}
          </span>
        );
      case 'Reportée':
        return (
          <span className="badge badge-purple" style={{ gap: '0.4rem' }}>
            <RotateCcw size={12} /> {stat}
          </span>
        );
      case 'Annulée':
        return (
          <span className="badge badge-rose" style={{ gap: '0.4rem' }}>
            <X size={12} /> {stat}
          </span>
        );
      default:
        return <span className="badge">{stat}</span>;
    }
  };

  return (
    <AppLayout>
      {/* Print Specific Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-convocation, #printable-convocation * {
            visibility: visible;
          }
          #printable-convocation {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: #0f172a !important;
            padding: 2.5cm !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modern Surgical Suite Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
              position: 'relative',
            }}
          >
            <Scissors size={28} />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid var(--bg-main)',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Chirurgies & <span className="gradient-text">Bloc Opératoire</span>
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                Pôle Chirurgical
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Régulation chirurgicale, occupation des 5 blocs opératoires et suivi interventionnel
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            5 Blocs Opérationnels
          </div>

          <button
            onClick={() => openCreateModal()}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              fontWeight: 700,
              boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Programmer une Chirurgie
          </button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* KPI 1 */}
        <div
          className="glass-panel"
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Interventions</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Scissors size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {totalInterventions}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Actives, terminées & archivées</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div
          className="glass-panel"
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Programmées à Venir</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>
            {chirProgrammes}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Protocole anesthésique validé</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div
          className="glass-panel"
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aujourd'hui & En Cours</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em' }}>
              {chirAujourdhui}
            </div>
            {chirEnCours > 0 && (
              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                {chirEnCours} en cours
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Interventions prévues ce jour</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div
          className="glass-panel"
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #8b5cf6, #c084fc)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Équipe Chirurgicale</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <Stethoscope size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.03em' }}>
            {doctorsForSelection.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Praticiens & chirurgiens accrédités</span>
          </div>
        </div>
      </div>

      {/* Control Bar: View Mode Switcher + Filters */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Row 1: View mode tabs and Quick Status counters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setViewMode('blocs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                background: viewMode === 'blocs' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'blocs' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <LayoutGrid size={16} />
              Vue Blocs Opératoires
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <List size={16} />
              Vue Tableau Détaillé
            </button>
          </div>

          {/* Quick Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Toutes', count: chirurgies.length },
              { id: 'Programmée', label: 'Programmées', count: chirProgrammes },
              { id: 'En cours', label: 'En cours', count: chirEnCours },
              { id: 'Terminée', label: 'Terminées', count: chirTerminees },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  border: statusFilter === st.id ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                  background: statusFilter === st.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: statusFilter === st.id ? 'var(--primary-light)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{st.label}</span>
                <span
                  style={{
                    background: statusFilter === st.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search input, Room select, Date filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher par patient, chirurgien, intervention, salle de bloc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
                paddingRight: search ? '2.5rem' : '1rem',
                borderRadius: '10px',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '50%',
                }}
                title="Effacer la recherche"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Salle Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={salleFilter}
              onChange={(e) => setSalleFilter(e.target.value)}
              style={{ borderRadius: '10px', fontSize: '0.85rem' }}
            >
              <option value="all">Tous les Blocs Opératoires</option>
              {sallesUniques.map((salle) => (
                <option key={salle} value={salle}>
                  {salle}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{ borderRadius: '10px', fontSize: '0.85rem' }}
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui uniquement</option>
              <option value="upcoming">À partir d'aujourd'hui</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Chargement des interventions chirurgicales et des plannings de bloc...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--text-muted)',
            }}
          >
            <Scissors size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Aucune intervention chirurgicale trouvée
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Aucun résultat ne correspond à vos critères de recherche ou de filtrage actuels.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setSalleFilter('all');
              setDateFilter('all');
            }}
            className="btn btn-secondary"
            style={{ borderRadius: '10px' }}
          >
            Réinitialiser tous les filtres
          </button>
        </div>
      ) : viewMode === 'blocs' ? (
        /* ========================================================================= */
        /* VUE BLOCS OPÉRATOIRES (ROOM CARDS & PLANNING VIEW)                        */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {SALLES_BLOC.filter((bloc) => salleFilter === 'all' || bloc.name === salleFilter).map((bloc) => {
            // Find surgeries assigned to this room
            const roomSurgeries = filtered.filter(
              (c) => c.salleOperation === bloc.name || (!c.salleOperation && bloc.name.includes('Bloc Opératoire 1'))
            );

            // Determine room status
            const hasActiveSurgery = roomSurgeries.some((c) => c.statut === 'En cours');
            const hasScheduledToday = roomSurgeries.some((c) => c.dateIntervention?.startsWith(todayStr) && c.statut === 'Programmée');
            const roomStatus = hasActiveSurgery ? 'Occupé (En cours)' : hasScheduledToday ? 'Programmé aujourd\'hui' : 'Disponible & Prêt';

            return (
              <div
                key={bloc.id}
                className="glass-panel"
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: hasActiveSurgery
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : '1px solid var(--border-color)',
                  boxShadow: hasActiveSurgery ? '0 8px 30px rgba(245, 158, 11, 0.15)' : 'var(--shadow-md)',
                }}
              >
                {/* Bloc Header */}
                <div
                  style={{
                    padding: '1.15rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.025)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: hasActiveSurgery
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(56, 189, 248, 0.12)',
                        color: hasActiveSurgery ? '#f59e0b' : '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{bloc.name}</h3>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: hasActiveSurgery
                              ? 'rgba(245, 158, 11, 0.18)'
                              : hasScheduledToday
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                            color: hasActiveSurgery ? '#fbbf24' : hasScheduledToday ? '#38bdf8' : '#34d399',
                            border: `1px solid ${
                              hasActiveSurgery
                                ? 'rgba(245, 158, 11, 0.3)'
                                : hasScheduledToday
                                ? 'rgba(56, 189, 248, 0.3)'
                                : 'rgba(16, 185, 129, 0.3)'
                            }`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: hasActiveSurgery ? '#f59e0b' : hasScheduledToday ? '#38bdf8' : '#10b981',
                            }}
                          />
                          {roomStatus}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {bloc.type} • Stérilisation validée • Monitoring multiparamétrique
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => openCreateModal(bloc.name)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.82rem',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Plus size={15} />
                      Planifier dans ce bloc
                    </button>
                  </div>
                </div>

                {/* Bloc Body: Surgeries Cards */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {roomSurgeries.length === 0 ? (
                    <div
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px dashed var(--border-color)',
                      }}
                    >
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                        Aucune intervention planifiée dans cette salle selon les filtres sélectionnés.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {roomSurgeries.map((chir) => {
                        const patObj = typeof chir.patient === 'object' ? chir.patient : null;
                        const medObj = typeof chir.chirurgien === 'object' ? chir.chirurgien : null;
                        const dateStr = chir.dateIntervention ? chir.dateIntervention.split('T')[0] : '';
                        const heureStr = chir.heureDebut
                          ? chir.heureDebut.split('T')[1]?.slice(0, 5) || chir.heureDebut.slice(0, 5)
                          : '08:30';
                        const isToday = dateStr === todayStr;

                        return (
                          <div
                            key={chir.id}
                            style={{
                              padding: '1.15rem',
                              borderRadius: '14px',
                              background: 'rgba(15, 23, 42, 0.65)',
                              border: isToday
                                ? '1px solid rgba(56, 189, 248, 0.3)'
                                : '1px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.9rem',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {/* Card Top: Timing & Status */}
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '0.65rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.88rem',
                                      fontWeight: 800,
                                      color: isToday ? '#f59e0b' : 'var(--text-main)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <Clock size={15} />
                                    {dateStr} • {heureStr}
                                  </span>
                                  {isToday && (
                                    <span
                                      className="badge badge-amber"
                                      style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}
                                    >
                                      Aujourd'hui
                                    </span>
                                  )}
                                </div>
                                <div>{getStatusBadge(chir.statut)}</div>
                              </div>

                              {/* Title */}
                              <h4
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  color: 'var(--text-main)',
                                  marginBottom: '0.6rem',
                                  lineHeight: 1.35,
                                }}
                              >
                                {chir.titreIntervention}
                              </h4>

                              {/* Patient & Surgeon */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '8px',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    P
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                      {patObj ? `${patObj.prenom} ${patObj.nom}` : 'Patient non spécifié'}
                                    </span>
                                    {patObj?.telephone && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                        ({patObj.telephone})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '8px',
                                      background: 'rgba(192, 132, 252, 0.15)',
                                      color: '#c084fc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Dr
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 600, color: '#c084fc' }}>
                                      {medObj ? `Dr. ${medObj.prenom} ${medObj.nom}` : 'Chirurgien'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                      • {medObj?.specialite || 'Chirurgie'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Details tags */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  Durée : <strong>{chir.dureeMinutes} min</strong>
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  Anesthésie : <strong>{chir.typeAnesthesie}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Card Footer: Quick Actions */}
                            <div
                              style={{
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                              }}
                            >
                              {/* Quick State Advance */}
                              <div>
                                {chir.statut === 'Programmée' ? (
                                  <button
                                    onClick={() => handleUpdateStatut(chir.id, 'En cours')}
                                    className="btn btn-emerald"
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <Play size={13} fill="currentColor" /> Démarrer
                                  </button>
                                ) : chir.statut === 'En cours' ? (
                                  <button
                                    onClick={() => handleUpdateStatut(chir.id, 'Terminée')}
                                    className="btn btn-primary"
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <CheckCircle2 size={13} /> Clôturer
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Fixé par : {chir.fixePar || 'Clinique'}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button
                                  onClick={() => setPrintChirurgie(chir)}
                                  title="Fiche opératoire & Convocation"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem', borderRadius: '8px' }}
                                >
                                  <Printer size={15} />
                                </button>
                                <button
                                  onClick={() => openEditModal(chir)}
                                  title="Modifier les détails"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem', borderRadius: '8px' }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(chir.id)}
                                  title="Supprimer / Annuler"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem', borderRadius: '8px', color: '#f43f5e' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VUE TABLEAU DÉTAILLÉ (TABULAR DATA TABLE)                                 */
        /* ========================================================================= */
        <div className="glass-panel" style={{ borderRadius: '18px', overflow: 'hidden' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Chirurgien</th>
                  <th>Intervention & Salle de Bloc</th>
                  <th>Date & Heure</th>
                  <th>Durée & Anesthésie</th>
                  <th>Statut</th>
                  <th>Programmation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((chir) => {
                  const patObj = typeof chir.patient === 'object' ? chir.patient : null;
                  const medObj = typeof chir.chirurgien === 'object' ? chir.chirurgien : null;
                  const dateStr = chir.dateIntervention ? chir.dateIntervention.split('T')[0] : '';
                  const heureStr = chir.heureDebut
                    ? chir.heureDebut.split('T')[1]?.slice(0, 5) || chir.heureDebut.slice(0, 5)
                    : '';
                  const isToday = dateStr === todayStr;

                  return (
                    <tr key={chir.id}>
                      {/* Patient */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#38bdf8',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {patObj?.prenom?.[0] || 'P'}
                            {patObj?.nom?.[0] || ''}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {patObj ? `${patObj.prenom} ${patObj.nom}` : 'Patient non spécifié'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {patObj?.telephone || 'Sans tél'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Surgeon */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {medObj ? `Dr. ${medObj.prenom} ${medObj.nom}` : 'Chirurgien'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>
                          {medObj?.specialite || 'Chirurgie'}
                        </div>
                      </td>

                      {/* Intervention & Room */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', maxWidth: '280px' }}>
                          {chir.titreIntervention}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.2rem',
                          }}
                        >
                          <Building size={12} />
                          {chir.salleOperation}
                        </div>
                      </td>

                      {/* Date & Heure */}
                      <td>
                        <div style={{ fontWeight: 700, color: isToday ? '#f59e0b' : 'var(--text-main)' }}>
                          {dateStr}
                          {isToday && (
                            <span
                              className="badge badge-amber"
                              style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}
                            >
                              Aujourd'hui
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Clock size={12} />
                          {heureStr}
                        </div>
                      </td>

                      {/* Duration & Anesthesia */}
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>
                          {chir.dureeMinutes} min
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Anesthésie : {chir.typeAnesthesie}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          className="form-select"
                          value={chir.statut}
                          onChange={(e) => handleUpdateStatut(chir.id, e.target.value)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background:
                              chir.statut === 'En cours'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : chir.statut === 'Terminée'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(56, 189, 248, 0.15)',
                            borderColor:
                              chir.statut === 'En cours'
                                ? 'rgba(245, 158, 11, 0.4)'
                                : chir.statut === 'Terminée'
                                ? 'rgba(16, 185, 129, 0.4)'
                                : 'rgba(56, 189, 248, 0.4)',
                            color:
                              chir.statut === 'En cours'
                                ? '#fbbf24'
                                : chir.statut === 'Terminée'
                                ? '#34d399'
                                : '#38bdf8',
                          }}
                        >
                          <option value="Programmée">Programmée</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminée">Terminée</option>
                          <option value="Reportée">Reportée</option>
                          <option value="Annulée">Annulée</option>
                        </select>
                      </td>

                      {/* Fixé par */}
                      <td>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-color)',
                            color: chir.fixePar?.toLowerCase().includes('chirurg')
                              ? '#38bdf8'
                              : '#10b981',
                            display: 'inline-block',
                            fontWeight: 600,
                          }}
                        >
                          {chir.fixePar || 'Non spécifié'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => setPrintChirurgie(chir)}
                            title="Fiche opératoire & Convocation"
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '8px' }}
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => openEditModal(chir)}
                            title="Modifier la date ou les détails"
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '8px' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(chir.id)}
                            title="Annuler l'intervention"
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '8px', color: '#f43f5e' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROGRAMMER / MODIFIER UNE CHIRURGIE                                */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '680px',
              padding: 0,
              background: '#0d1322',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Scissors size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {editingChirurgie ? 'Modifier l\'Intervention Chirurgicale' : 'Programmer une Chirurgie'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Planification opératoire dans les blocs de la Clinique SantéPlus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '10px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', maxHeight: '78vh', overflowY: 'auto' }}>
              {error && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* 2-column: Patient & Surgeon */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Patient Bénéficiaire *</label>
                    <select
                      className="form-select"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom.toUpperCase()} {p.prenom} {p.telephone ? `(${p.telephone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Chirurgien Référent *</label>
                    <select
                      className="form-select"
                      value={formData.chirurgienId}
                      onChange={(e) => setFormData({ ...formData, chirurgienId: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner un chirurgien</option>
                      {doctorsForSelection.map((m) => (
                        <option key={m.id} value={m.id}>
                          Dr. {m.prenom} {m.nom} — {m.specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Procedure Title & Suggestions */}
                <div className="form-group">
                  <label className="form-label">Intitulé de l'Intervention Chirurgicale *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Cholécystectomie par cœlioscopie, Arthroscopie..."
                    value={formData.titreIntervention}
                    onChange={(e) => setFormData({ ...formData, titreIntervention: e.target.value })}
                    required
                  />

                  {/* Suggestions Chips */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {SUGGESTIONS_INTERVENTIONS.slice(0, 5).map((sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => setFormData({ ...formData, titreIntervention: sugg })}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3-column: Date, Time, Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Date d'Intervention *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dateIntervention}
                      onChange={(e) => setFormData({ ...formData, dateIntervention: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Heure d'Admission Bloc *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Durée Estimée (min) *</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      className="form-input"
                      value={formData.dureeMinutes}
                      onChange={(e) => setFormData({ ...formData, dureeMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
                  {[30, 45, 60, 90, 120, 180].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setFormData({ ...formData, dureeMinutes: dur })}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        background: formData.dureeMinutes === dur ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                        color: formData.dureeMinutes === dur ? 'white' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>

                {/* 2-column: Room & Anesthesia */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Salle de Bloc Opératoire *</label>
                    <select
                      className="form-select"
                      value={formData.salleOperation}
                      onChange={(e) => setFormData({ ...formData, salleOperation: e.target.value })}
                      required
                    >
                      {SALLES_BLOC.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Type d'Anesthésie *</label>
                    <select
                      className="form-select"
                      value={formData.typeAnesthesie}
                      onChange={(e) => setFormData({ ...formData, typeAnesthesie: e.target.value })}
                    >
                      <option value="Générale">Générale</option>
                      <option value="Locale">Locale</option>
                      <option value="Rachianesthésie">Rachianesthésie</option>
                      <option value="Loco-régionale">Loco-régionale</option>
                      <option value="Sédation vigile">Sédation vigile</option>
                    </select>
                  </div>
                </div>

                {/* 2-column: Status & Fixé par */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Statut d'Avancement *</label>
                    <select
                      className="form-select"
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    >
                      <option value="Programmée">Programmée</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
                      <option value="Reportée">Reportée</option>
                      <option value="Annulée">Annulée</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Date & Heure Fixée par *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fixePar}
                      onChange={(e) => setFormData({ ...formData, fixePar: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Preoperative Notes */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Notes Préopératoires & Consignes Anesthésiques</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.notesPreoperatoires}
                    onChange={(e) => setFormData({ ...formData, notesPreoperatoires: e.target.value })}
                    placeholder="Patient à jeun strict dès minuit, bilans hémostase validés, bilan pré-anesthésique..."
                  />
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.85rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
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
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Check size={18} />
                    {submitting
                      ? 'Enregistrement...'
                      : editingChirurgie
                      ? 'Sauvegarder les modifications'
                      : 'Confirmer la Programmation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PRINT: FICHE D'INTERVENTION & CONVOCATION OPÉRATOIRE                */}
      {/* ========================================================================= */}
      {printChirurgie && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '680px',
              padding: '2.5rem',
              background: '#090d16',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Printable Container */}
            <div id="printable-convocation">
              {/* Header with authentic Tunisian Clinic Info */}
              <div
                style={{
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.02em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    CLINIQUE MÉDICALE SANTÉPLUS
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#06b6d4', fontWeight: 700 }}>
                    Pôle Chirurgical & Bloc Opératoire
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Centre Urbain Nord, 1082 Tunis, Tunisie • Tél: +216 71 888 999 • Fax: +216 71 888 998
                  </p>
                </div>

                <button
                  onClick={() => setPrintChirurgie(null)}
                  className="btn btn-secondary no-print"
                  style={{ padding: '0.4rem', borderRadius: '10px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title Badge */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.45rem 1.25rem',
                    borderRadius: '999px',
                    background: 'rgba(2, 132, 199, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  FICHE D'INTERVENTION & CONVOCATION OPÉRATOIRE
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Réf. Opératoire : #BLOC-{printChirurgie.id.toString().padStart(5, '0')}
                </p>
              </div>

              {/* Patient & Surgical Details Grid */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  padding: '1.35rem',
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.15rem',
                  fontSize: '0.88rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    PATIENT
                  </span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                    {typeof printChirurgie.patient === 'object'
                      ? `${printChirurgie.patient.nom.toUpperCase()} ${printChirurgie.patient.prenom}`
                      : 'Patient'}
                  </strong>
                  {typeof printChirurgie.patient === 'object' && printChirurgie.patient.telephone && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Tél: {printChirurgie.patient.telephone}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    CHIRURGIEN RÉFÉRENT
                  </span>
                  <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>
                    {typeof printChirurgie.chirurgien === 'object'
                      ? `Dr. ${printChirurgie.chirurgien.nom} ${printChirurgie.chirurgien.prenom}`
                      : 'Chirurgien'}
                  </strong>
                  {typeof printChirurgie.chirurgien === 'object' && printChirurgie.chirurgien.specialite && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Spécialité : {printChirurgie.chirurgien.specialite}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    ACTE CHIRURGICAL PRÉVU
                  </span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    {printChirurgie.titreIntervention}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    DATE D'INTERVENTION
                  </span>
                  <strong style={{ color: '#f59e0b', fontSize: '0.98rem' }}>
                    {printChirurgie.dateIntervention?.split('T')[0]}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    HEURE D'ADMISSION AU BLOC
                  </span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.98rem' }}>
                    {printChirurgie.heureDebut?.split('T')[1]?.slice(0, 5) || printChirurgie.heureDebut?.slice(0, 5)}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    SALLE DE BLOC OPÉRATOIRE
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{printChirurgie.salleOperation}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    PROTOCOLE ANESTHÉSIQUE
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{printChirurgie.typeAnesthesie}</strong>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                    DATE FIXÉE & VALIDÉE PAR
                  </span>
                  <strong style={{ color: '#10b981' }}>{printChirurgie.fixePar}</strong>
                </div>
              </div>

              {/* Preoperative Instructions Box */}
              {printChirurgie.notesPreoperatoires && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.82rem',
                    color: '#fef3c7',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} /> CONSIGNES MÉDICALES ET PRÉOPÉRATOIRES :
                  </div>
                  {printChirurgie.notesPreoperatoires}
                </div>
              )}

              {/* Official Stamp & Signatures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ textAlign: 'center', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Visa du Chirurgien Référent
                  </span>
                  <div style={{ height: '50px' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>(Signature & Cachet)</span>
                </div>
                <div style={{ textAlign: 'center', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Régulation Bloc Opératoire
                  </span>
                  <div style={{ height: '50px' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>(Cachet de la Clinique)</span>
                </div>
              </div>
            </div>

            {/* Print Modal Footer */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
              <button onClick={() => setPrintChirurgie(null)} className="btn btn-secondary">
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Printer size={16} />
                Imprimer la Convocation
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ChirurgiesPage() {
  return (
    <Suspense fallback={null}>
      <ChirurgiesContent />
    </Suspense>
  );
}
