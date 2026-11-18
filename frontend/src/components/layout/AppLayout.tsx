'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Bot,
  LogOut,
  Stethoscope,
  Shield,
  Bell,
  Search,
  Clock,
  Activity,
  Receipt,
  BarChart3,
  Scissors,
  User,
  X,
  ChevronRight,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isAuthenticated, logout, isAdmin, isMedecin, isSecretaire, isStaff, isPatient, isRealAdmin, roleOverride, setRoleOverride } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Routes accessible seulement au staff (pas aux patients)
  const staffOnlyRoutes = [
    '/dashboard',
    '/salle-attente',
    '/facturation',
    '/statistiques',
    '/patients',
    '/medecins',
    '/consultations',
    '/ordonnances',
    '/rendez-vous',
    '/chirurgies',
  ];

  // Routes réservées au médecin (et admin) — secrétaire bloquée (pas d'accès aux consultations & ordonnances)
  const medecinOnlyRoutes = ['/consultations', '/ordonnances'];

  // Routes réservées à la secrétaire (et admin) — médecin bloqué (pas d'accès à la salle d'attente ni facturation)
  const secretaireOnlyRoutes = ['/salle-attente', '/facturation'];

  // Global search state
  const [topSearch, setTopSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchIndex, setSearchIndex] = useState<{
    patients: Array<any>;
    medecins: Array<any>;
    chirurgies: Array<any>;
  }>({ patients: [], medecins: [], chirurgies: [] });
  const [searchLoaded, setSearchLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isStaff && staffOnlyRoutes.includes(pathname)) {
        // Patient → espace patient
        router.replace('/espace-patient');
      } else if (!isAdmin && isSecretaire && !isMedecin && medecinOnlyRoutes.includes(pathname)) {
        // Secrétaire essaie d'accéder aux actes médicaux
        router.replace('/dashboard');
      } else if (!isAdmin && isMedecin && !isSecretaire && secretaireOnlyRoutes.includes(pathname)) {
        // Médecin essaie d'accéder à la salle d'attente ou facturation
        router.replace('/dashboard');
      }
    }
  }, [loading, isAuthenticated, isStaff, isAdmin, isMedecin, isSecretaire, pathname, router]);

  // Load search index lazily on focus
  const loadSearchData = async () => {
    if (searchLoaded || !isStaff) return;
    try {
      const [p, m, c] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getMedecins().catch(() => []),
        api.getChirurgies().catch(() => []),
      ]);
      setSearchIndex({ patients: p, medecins: m, chirurgies: c });
      setSearchLoaded(true);
    } catch (e) {
      console.error('Failed to load search data', e);
    }
  };

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: 'var(--primary-light)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: '0.95rem' }}>Chargement de l'espace clinique...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Si c'est un patient qui a tenté d'accéder au dashboard, attendre la redirection
  if (!isStaff && staffOnlyRoutes.includes(pathname)) {
    return null;
  }

  // Si secrétaire tente une page médicale
  if (!isAdmin && isSecretaire && !isMedecin && medecinOnlyRoutes.includes(pathname)) {
    return null;
  }

  // Si médecin tente la salle d'attente
  if (!isAdmin && isMedecin && !isSecretaire && secretaireOnlyRoutes.includes(pathname)) {
    return null;
  }

  // Navigation par rôle
  // Admin = tout
  // Médecin = pas salle d'attente, rendez-vous et facturation en lecture seule
  // Secrétaire = pas consultations / ordonnances
  const adminNavItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: "Salle d'attente", href: '/salle-attente', icon: Clock, badge: 'Direct' },
    { label: 'Consultations', href: '/consultations', icon: Activity },
    { label: 'Chirurgies & Bloc', href: '/chirurgies', icon: Scissors, badge: 'Bloc' },
    { label: 'Rendez-vous', href: '/rendez-vous', icon: Calendar },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Médecins', href: '/medecins', icon: UserCheck },
    { label: 'Ordonnances', href: '/ordonnances', icon: FileText },
    { label: 'Facturation', href: '/facturation', icon: Receipt },
    { label: 'Statistiques & IA', href: '/statistiques', icon: BarChart3 },
    { label: 'Assistant IA', href: '/chat', icon: Bot, badge: 'IA' },
  ];

  const medecinNavItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Consultations', href: '/consultations', icon: Activity, badge: 'Médical' },
    { label: 'Chirurgies & Bloc', href: '/chirurgies', icon: Scissors, badge: 'Bloc' },
    { label: 'Rendez-vous', href: '/rendez-vous', icon: Calendar, badge: 'Lecture' },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Ordonnances', href: '/ordonnances', icon: FileText, badge: 'Médical' },
    { label: 'Statistiques & IA', href: '/statistiques', icon: BarChart3 },
    { label: 'Assistant IA', href: '/chat', icon: Bot, badge: 'IA' },
  ];

  const secretaireNavItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: "Salle d'attente", href: '/salle-attente', icon: Clock, badge: 'Direct' },
    { label: 'Chirurgies & Bloc', href: '/chirurgies', icon: Scissors, badge: 'Bloc' },
    { label: 'Rendez-vous', href: '/rendez-vous', icon: Calendar },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Médecins', href: '/medecins', icon: UserCheck },
    { label: 'Facturation', href: '/facturation', icon: Receipt },
    { label: 'Statistiques & IA', href: '/statistiques', icon: BarChart3 },
    { label: 'Assistant IA', href: '/chat', icon: Bot, badge: 'IA' },
  ];

  const patientNavItems = [
    { label: 'Mon Espace Patient', href: '/espace-patient', icon: Calendar, badge: 'Portail' },
    { label: 'Assistant IA Santé', href: '/chat', icon: Bot, badge: 'IA' },
    { label: 'Accueil Clinique', href: '/', icon: Stethoscope },
  ];

  const navItems = isAdmin
    ? adminNavItems
    : isMedecin
    ? medecinNavItems
    : isSecretaire
    ? secretaireNavItems
    : patientNavItems;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{
          padding: '1.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 16px var(--primary-glow)',
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Clinique <span className="gradient-text">Santé+</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Gestion Médicale & IA
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            padding: '0 0.75rem 0.5rem',
            letterSpacing: '0.06em',
          }}>
            Menu Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'rgba(2, 132, 199, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={19} color={isActive ? 'var(--primary-light)' : 'var(--text-muted)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className="badge badge-sky" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}>
                {user?.prenom?.[0] || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}>
                  {user?.fullName || user?.email}
                </p>
                <span
                  className={`badge ${
                    isAdmin
                      ? 'badge-purple'
                      : isMedecin
                      ? 'badge-sky'
                      : isSecretaire
                      ? 'badge-emerald'
                      : 'badge-sky'
                  }`}
                  style={{ fontSize: '0.65rem' }}
                >
                  <Shield size={10} />
                  {isAdmin
                    ? 'ADMINISTRATEUR'
                    : isMedecin
                    ? 'MÉDECIN'
                    : isSecretaire
                    ? 'SECRÉTAIRE'
                    : `PATIENT (${user?.numeroDossier || 'ESPACE'})`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(13, 19, 34, 0.6)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
        }}>
          {/* Quick Search Interactive with live results */}
          <div ref={searchRef} style={{ position: 'relative', width: '360px' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = topSearch.trim();
                if (!q) return;
                setIsSearchFocused(false);
                // Si la recherche commence par un nom de docteur ou spécialité
                const docMatch = searchIndex.medecins.find(
                  (m) =>
                    m.nom?.toLowerCase().includes(q.toLowerCase()) ||
                    m.specialite?.toLowerCase().includes(q.toLowerCase())
                );
                if (docMatch && !isMedecin) {
                  router.push(`/medecins?q=${encodeURIComponent(q)}`);
                  return;
                }
                router.push(`/patients?q=${encodeURIComponent(q)}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: isSearchFocused ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: isSearchFocused ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                width: '100%',
                transition: 'all var(--transition-fast)',
                boxShadow: isSearchFocused ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
              }}
            >
              <Search size={16} color={isSearchFocused ? 'var(--primary-light)' : 'var(--text-muted)'} />
              <input
                name="topSearch"
                type="text"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  loadSearchData();
                }}
                placeholder="Rechercher patient, médecin, chirurgie..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  width: '100%',
                }}
              />
              {topSearch && (
                <button
                  type="button"
                  onClick={() => setTopSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Live Dropdown Results */}
            {isSearchFocused && topSearch.trim().length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '420px',
                  background: 'rgba(15, 23, 42, 0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
                  padding: '0.75rem',
                  zIndex: 100,
                  maxHeight: '440px',
                  overflowY: 'auto',
                }}
              >
                {(() => {
                  const q = topSearch.toLowerCase().trim();
                  const matchedPatients = searchIndex.patients
                    .filter((p) =>
                      `${p.nom || ''} ${p.prenom || ''} ${p.telephone || ''} ${p.numeroDossier || ''}`
                        .toLowerCase()
                        .includes(q)
                    )
                    .slice(0, 4);

                  const matchedMedecins = searchIndex.medecins
                    .filter((m) =>
                      `${m.nom || ''} ${m.prenom || ''} ${m.specialite || ''}`
                        .toLowerCase()
                        .includes(q)
                    )
                    .slice(0, 4);

                  const matchedChirurgies = searchIndex.chirurgies
                    .filter((c) =>
                      `${c.titreIntervention || ''} ${c.salleOperation || ''}`
                        .toLowerCase()
                        .includes(q)
                    )
                    .slice(0, 3);

                  const totalMatches =
                    matchedPatients.length + matchedMedecins.length + matchedChirurgies.length;

                  if (totalMatches === 0) {
                    return (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Aucun résultat trouvé pour « {topSearch} »
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Patients Section */}
                      {matchedPatients.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Patients ({matchedPatients.length})
                          </div>
                          {matchedPatients.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                setTopSearch('');
                                router.push(`/patients?q=${encodeURIComponent(p.nom)}`);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                                  <User size={14} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.prenom} {p.nom}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.telephone || 'Dossier patient'}</div>
                                </div>
                              </div>
                              <ChevronRight size={14} color="var(--text-dim)" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Medecins Section */}
                      {matchedMedecins.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Médecins ({matchedMedecins.length})
                          </div>
                          {matchedMedecins.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                setTopSearch('');
                                router.push(`/medecins?q=${encodeURIComponent(m.nom)}`);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                                  <Stethoscope size={14} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Dr. {m.prenom} {m.nom}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>{m.specialite}</div>
                                </div>
                              </div>
                              <ChevronRight size={14} color="var(--text-dim)" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chirurgies Section */}
                      {matchedChirurgies.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Chirurgies & Bloc ({matchedChirurgies.length})
                          </div>
                          {matchedChirurgies.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                setTopSearch('');
                                router.push(`/chirurgies?q=${encodeURIComponent(c.titreIntervention)}`);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                                  <Scissors size={14} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.titreIntervention}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.salleOperation}</div>
                                </div>
                              </div>
                              <ChevronRight size={14} color="var(--text-dim)" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>


          {/* Right Header items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Quick Role View Switcher for Testing (instant role simulation) */}
            {isRealAdmin && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '0.25rem 0.4rem',
                borderRadius: 'var(--radius-full)',
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '0 0.4rem', fontWeight: 600 }}>
                  Vue Rôle :
                </span>
                <button
                  type="button"
                  onClick={() => setRoleOverride('admin')}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: roleOverride === 'admin' || roleOverride === 'auto' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                    color: roleOverride === 'admin' || roleOverride === 'auto' ? '#c084fc' : 'var(--text-muted)',
                    transition: 'all var(--transition-fast)',
                  }}
                  title="Vue Administrateur complète (tous les menus)"
                >
                  Admin (Tout)
                </button>
                <button
                  type="button"
                  onClick={() => setRoleOverride('medecin')}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: roleOverride === 'medecin' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                    color: roleOverride === 'medecin' ? '#38bdf8' : 'var(--text-muted)',
                    transition: 'all var(--transition-fast)',
                  }}
                  title="Vue Médecin : Masque Salle d'attente et Facturation, Rendez-vous en lecture seule"
                >
                  🩺 Médecin
                </button>
                <button
                  type="button"
                  onClick={() => setRoleOverride('secretaire')}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: roleOverride === 'secretaire' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: roleOverride === 'secretaire' ? '#34d399' : 'var(--text-muted)',
                    transition: 'all var(--transition-fast)',
                  }}
                  title="Vue Secrétaire : Masque Consultations et Ordonnances"
                >
                  🗂️ Secrétaire
                </button>
              </div>
            )}

            <Link href="/chat" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
              <Bot size={16} />
              Assistant IA
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
