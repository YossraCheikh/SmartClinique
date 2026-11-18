'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  Heart,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowLeft,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    dateNaissance: '',
    sexe: 'M',
    adresse: '',
    groupeSanguin: 'O+',
    allergies: '',
    antecedents: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      await register({
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        password: formData.password,
        telephone: formData.telephone,
        dateNaissance: formData.dateNaissance,
        sexe: formData.sexe,
        adresse: formData.adresse,
        groupeSanguin: formData.groupeSanguin,
        allergies: formData.allergies,
        antecedents: formData.antecedents,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/login?registered=true&email=${encodeURIComponent(formData.email)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      position: 'relative',
      background: 'var(--bg-main)',
    }}>
      {/* Background glow circles */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '2.5rem',
          position: 'relative',
          zIndex: 10,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(2, 132, 199, 0.15)',
        }}
      >
        {/* Top Back Link */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textDecoration: 'none',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={16} />
          Retour à la page de connexion
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'var(--primary-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 25px var(--primary-glow)',
            marginBottom: '1rem',
          }}>
            <Stethoscope size={30} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Inscription <span className="gradient-text">Espace Patient</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Créez votre dossier médical sécurisé pour prendre rendez-vous et consulter nos spécialistes
          </p>
        </div>

        {success && (
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <CheckCircle2 size={22} />
            <div>
              <strong>Compte créé avec succès !</strong>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>Redirection vers l'espace de connexion...</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Informations Personnelles */}
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
          }}>
            1. Informations Personnelles
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input
                type="text"
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Ex: Alexandre"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Moreau"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Adresse Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@exemple.com"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone *</label>
              <input
                type="tel"
                name="telephone"
                required
                value={formData.telephone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 caractères"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez"
                className="form-input"
              />
            </div>
          </div>

          {/* Section 2: Profil Médical */}
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '1.5rem 0 1rem',
          }}>
            2. Dossier Médical Clinique
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date de Naissance</label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sexe</label>
              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
                className="form-select"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Groupe Sanguin</label>
              <select
                name="groupeSanguin"
                value={formData.groupeSanguin}
                onChange={handleChange}
                className="form-select"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse Domicile</label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Ex: 15 Avenue des Champs, Paris"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Allergies Connues (Crucial pour la prescription)</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="Ex: Pénicilline, Aspirine, Latex"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Antécédents Médicaux</label>
              <input
                type="text"
                name="antecedents"
                value={formData.antecedents}
                onChange={handleChange}
                placeholder="Ex: Asthme, Hypertension..."
                className="form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? 'Création de votre dossier...' : (
              <>
                Finaliser mon inscription patient
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginTop: '1.5rem',
        }}>
          Vous avez déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            Connectez-vous ici
          </Link>
        </p>
      </div>
    </div>
  );
}
