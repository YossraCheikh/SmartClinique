/**
 * Helper utility to format names consistently and clean across the application.
 */

export function formatDoctorName(
  medecin?: { nom?: string | null; prenom?: string | null; specialite?: string | null } | string | null
): string {
  if (!medecin) return 'Dr. Non spécifié';
  if (typeof medecin === 'string') {
    const clean = medecin.replace(/^Dr\.?\s*/i, '').trim();
    return `Dr. ${clean}`;
  }

  const cleanNom = (medecin.nom || '').replace(/^Dr\.?\s*/i, '').trim();
  const cleanPrenom = (medecin.prenom || '').replace(/^Dr\.?\s*/i, '').trim();

  if (!cleanNom && !cleanPrenom) return 'Dr. Médecin';
  if (!cleanPrenom) return `Dr. ${cleanNom}`;
  if (!cleanNom) return `Dr. ${cleanPrenom}`;

  return `Dr. ${cleanPrenom} ${cleanNom}`;
}

export function formatPatientName(
  patient?: { nom?: string | null; prenom?: string | null } | string | null
): string {
  if (!patient) return 'Patient Non spécifié';
  if (typeof patient === 'string') return patient.trim();

  const prenom = (patient.prenom || '').trim();
  const nom = (patient.nom || '').trim();

  if (!prenom && !nom) return 'Patient';
  if (!prenom) return nom;
  if (!nom) return prenom;

  return `${prenom} ${nom}`;
}

export function formatAppointmentDate(dateStr?: string | null): string {
  if (!dateStr) return 'Date non spécifiée';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatAppointmentTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    return timeStr.split('T')[1].substring(0, 5);
  }
  return timeStr.substring(0, 5);
}
