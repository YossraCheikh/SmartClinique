export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  fullName: string;
  telephone?: string | null;
  roles: string[];
  patientId?: number | null;
  numeroDossier?: string | null;
  medecinId?: number | null;
}

export interface DocumentMedical {
  id: number;
  nomFichier: string;
  type: string;
  dateAjout: string;
  url?: string | null;
  description?: string | null;
}

export interface Patient {
  id: number;
  numeroDossier?: string | null;
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  sexe?: string | null;
  age?: number;
  telephone: string;
  email: string;
  adresse?: string | null;
  groupeSanguin?: string | null;
  allergies?: string | null;
  antecedents?: string | null;
  documents?: DocumentMedical[];
}

export interface Disponibilite {
  id: number;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
}

export interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
  tarif?: number | null;
  dureeConsultation?: number | null;
  disponibilite?: string | null;
  image?: string | null;
  disponibilites?: Disponibilite[];
}

export interface Consultation {
  id: number;
  motif?: string | null;
  symptomes?: string | null;
  diagnostic?: string | null;
  notes?: string | null;
  tension?: number | null;
  poids?: number | null;
  temperature?: number | null;
  dateConsultation: string;
  rendezVous: RendezVous | string;
}

export interface Facture {
  id: number;
  montant: number;
  modePaiement?: 'especes' | 'carte' | 'virement' | string | null;
  statut: 'paye' | 'partiel' | 'impaye' | string;
  dateFacture: string;
  notes?: string | null;
  consultation: Consultation | string;
}

export interface RendezVous {
  id: number;
  date: string;
  heure: string;
  motif: string;
  statut: 'Confirmé' | 'En attente' | 'Terminé' | 'Annulé' | 'Absent' | string;
  patient: Patient | string;
  medecin: Medecin | string;
  ordonnance?: Ordonnance | null;
  consultations?: Consultation[];
}

export interface Ordonnance {
  id: number;
  medicaments: string;
  date: string;
  description?: string | null;
  rendezVous: RendezVous | string;
  consultation?: Consultation | null;
}

export interface DashboardStats {
  totalPatients: number;
  totalMedecins: number;
  totalOrdonnances: number;
  totalRdv: number;
  rdvDuJour: Array<{
    id: number;
    date: string;
    heure: string;
    motif: string;
    statut: string;
    patient?: { id: number; nom: string; prenom: string };
    medecin?: { id: number; nom: string; prenom: string; specialite: string };
  }>;
  chartLabelsJours: number[];
  chartDataJours: number[];
  chartLabelsStatut: string[];
  chartDataStatut: number[];
}

export interface SmartCreneau {
  heure: string;
  disponible: boolean;
  conflit: boolean;
}

export interface SmartSuggestion {
  trouve: boolean;
  date?: string;
  dateLisible?: string;
  heure?: string;
  medecin?: {
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
    tarif?: number;
  };
  motifSuggere?: string;
  message?: string;
}

export interface AllergieAlerte {
  allergie: string;
  substanceDetectee: string;
  severite: string;
  message: string;
}

export interface SalleAttentePatient {
  id: number;
  heure: string;
  statut: string;
  motif: string;
  patient: {
    id: number;
    nom: string;
    prenom: string;
    numeroDossier?: string;
    telephone: string;
    allergies?: string;
  };
  medecin: {
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
  };
}

export interface SalleAttenteData {
  date: string;
  dateLisible: string;
  totalAujourdhui: number;
  nbEnAttente: number;
  nbEnConsultation: number;
  nbTermines: number;
  patients: SalleAttentePatient[];
}

export interface StatistiquesAvancees {
  kpis: {
    totalPatients: number;
    totalMedecins: number;
    totalRdv: number;
    totalConsultations: number;
    totalRevenus: number;
    tauxAbsenteisme: number;
    tauxAnnulation: number;
    tauxRemplissage: number;
  };
  specialites: Record<string, number>;
  revenusParMedecin: Record<string, number>;
  revenusParMois: Record<string, number>;
  facturesParStatut: Record<string, number>;
  patientsSansSuivi: Array<{
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    numeroDossier: string;
  }>;
  nbPatientsSansSuivi: number;
}

export interface ChatAppointmentInfo {
  id: number;
  date: string;
  heure: string;
  motif: string;
  statut: string;
  patient: string;
  medecin: string;
  specialite?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  appointment?: ChatAppointmentInfo | null;
}

export interface Chirurgie {
  id: number;
  patient: Patient | { id: number; nom: string; prenom: string; telephone?: string; numeroDossier?: string } | string;
  chirurgien: Medecin | { id: number; nom: string; prenom: string; specialite: string } | string;
  titreIntervention: string;
  dateIntervention: string;
  heureDebut: string;
  dureeMinutes: number;
  salleOperation: string;
  typeAnesthesie: string;
  statut: 'Programmée' | 'En cours' | 'Terminée' | 'Reportée' | 'Annulée';
  fixePar: string;
  notesPreoperatoires?: string | null;
  dateCreation?: string;
}

