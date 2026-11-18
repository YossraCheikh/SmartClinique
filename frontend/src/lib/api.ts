import { DashboardStats, Medecin, Ordonnance, Patient, RendezVous, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        `Impossible de contacter le serveur Symfony. Assurez-vous que le backend tourne sur le port 8000 ("symfony server:start --port=8000 --no-tls" ou "php -S 127.0.0.1:8000 -t public").`
      );
    }
    throw err;
  }

  if (response.status === 401) {
    // Unauthorized
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      setStoredToken(null);
      window.location.href = '/login';
    }
    throw new Error('Identifiants incorrects ou session expirée.');
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || data.error || `Erreur HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string }> {
    const res = await request<{ token: string }>('/api/login_check', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    telephone?: string;
    dateNaissance?: string;
    sexe?: string;
    adresse?: string;
    groupeSanguin?: string;
    allergies?: string;
    antecedents?: string;
  }): Promise<any> {
    return request<any>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    setStoredToken(null);
  },

  async getMe(): Promise<User> {
    return request<User>('/api/me');
  },

  // Espace Patient
  async getPatientData(): Promise<{
    patient: Patient | null;
    rendezVous: any[];
    consultations: any[];
  }> {
    return request<{
      patient: Patient | null;
      rendezVous: any[];
      consultations: any[];
    }>('/api/patient/me/data');
  },

  async createPatientRendezVous(data: {
    medecinId: number;
    date: string;
    heure: string;
    motif: string;
  }): Promise<any> {
    return request<any>('/api/patient/rendez-vous', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelPatientRendezVous(id: number): Promise<any> {
    return request<any>(`/api/patient/rendez-vous/${id}/annuler`, {
      method: 'POST',
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/stats');
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    const res = await request<Patient[] | { 'hydra:member': Patient[] }>('/api/patients');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getPatient(id: number): Promise<Patient> {
    return request<Patient>(`/api/patients/${id}`);
  },

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    return request<Patient>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  },

  async updatePatient(id: number, patient: Partial<Patient>): Promise<Patient> {
    return request<Patient>(`/api/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(patient),
    });
  },

  async deletePatient(id: number): Promise<void> {
    return request<void>(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // Medecins
  async getMedecins(): Promise<Medecin[]> {
    const res = await request<Medecin[] | { 'hydra:member': Medecin[] }>('/api/medecins');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getMedecin(id: number): Promise<Medecin> {
    return request<Medecin>(`/api/medecins/${id}`);
  },

  async createMedecin(medecin: Omit<Medecin, 'id'>): Promise<Medecin> {
    return request<Medecin>('/api/medecins', {
      method: 'POST',
      body: JSON.stringify(medecin),
    });
  },

  async updateMedecin(id: number, medecin: Partial<Medecin>): Promise<Medecin> {
    return request<Medecin>(`/api/medecins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(medecin),
    });
  },

  async deleteMedecin(id: number): Promise<void> {
    return request<void>(`/api/medecins/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload image
  async uploadImage(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ filename: string; url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Rendez-vous
  async getRendezVous(): Promise<RendezVous[]> {
    const res = await request<RendezVous[] | { 'hydra:member': RendezVous[] }>('/api/rendez-vous');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getRendezVousById(id: number): Promise<RendezVous> {
    return request<RendezVous>(`/api/rendez-vous/${id}`);
  },

  async createRendezVous(data: {
    date: string;
    heure: string;
    motif: string;
    statut: string;
    patient: string; // IRI: /api/patients/1
    medecin: string; // IRI: /api/medecins/1
  }): Promise<RendezVous> {
    return request<RendezVous>('/api/rendez-vous', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRendezVous(
    id: number,
    data: {
      date?: string;
      heure?: string;
      motif?: string;
      statut?: string;
      patient?: string;
      medecin?: string;
    }
  ): Promise<RendezVous> {
    return request<RendezVous>(`/api/rendez-vous/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    });
  },

  async deleteRendezVous(id: number): Promise<void> {
    return request<void>(`/api/rendez-vous/${id}`, {
      method: 'DELETE',
    });
  },

  // Ordonnances
  async getOrdonnances(): Promise<Ordonnance[]> {
    const res = await request<Ordonnance[] | { 'hydra:member': Ordonnance[] }>('/api/ordonnances');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getOrdonnance(id: number): Promise<Ordonnance> {
    return request<Ordonnance>(`/api/ordonnances/${id}`);
  },

  async createOrdonnance(data: {
    medicaments: string;
    date: string;
    description?: string;
    rendezVous: string; // IRI: /api/rendez-vous/1
  }): Promise<Ordonnance> {
    return request<Ordonnance>('/api/ordonnances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrdonnance(
    id: number,
    data: {
      medicaments?: string;
      date?: string;
      description?: string;
      rendezVous?: string;
    }
  ): Promise<Ordonnance> {
    return request<Ordonnance>(`/api/ordonnances/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    });
  },

  async deleteOrdonnance(id: number): Promise<void> {
    return request<void>(`/api/ordonnances/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Chat
  async sendChatMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    response: string;
    appointment?: import('@/types').ChatAppointmentInfo | null;
    timestamp: string;
  }> {
    return request<{
      response: string;
      appointment?: import('@/types').ChatAppointmentInfo | null;
      timestamp: string;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  async streamChatMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    onToken: (token: string) => void,
    onAppointment?: (appointment: import('@/types').ChatAppointmentInfo) => void
  ): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Streaming non supporté par la réponse.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        for (const line of block.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              if (data.type === 'token' && typeof data.content === 'string') {
                onToken(data.content);
              } else if (data.type === 'appointment' && data.appointment && onAppointment) {
                onAppointment(data.appointment);
              }
            } catch {
              // Ignore partial chunk
            }
          }
        }
      }
    }
  },

  // Consultations
  async getConsultations(): Promise<import('@/types').Consultation[]> {
    const res = await request<import('@/types').Consultation[] | { 'hydra:member': import('@/types').Consultation[] }>('/api/consultations');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getConsultation(id: number): Promise<import('@/types').Consultation> {
    return request<import('@/types').Consultation>(`/api/consultations/${id}`);
  },

  async createConsultation(data: {
    rendezVous: string; // /api/rendez-vous/1
    motif?: string;
    symptomes?: string;
    diagnostic?: string;
    notes?: string;
    tension?: number;
    poids?: number;
    temperature?: number;
  }): Promise<import('@/types').Consultation> {
    return request<import('@/types').Consultation>('/api/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateConsultation(id: number, data: Partial<import('@/types').Consultation>): Promise<import('@/types').Consultation> {
    return request<import('@/types').Consultation>(`/api/consultations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    });
  },

  // Factures
  async getFactures(): Promise<import('@/types').Facture[]> {
    const res = await request<import('@/types').Facture[] | { 'hydra:member': import('@/types').Facture[] }>('/api/factures');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async getFacture(id: number): Promise<import('@/types').Facture> {
    return request<import('@/types').Facture>(`/api/factures/${id}`);
  },

  async createFacture(data: {
    consultation: string; // /api/consultations/1
    montant: number;
    modePaiement?: string;
    statut: string;
    dateFacture: string;
    notes?: string;
  }): Promise<import('@/types').Facture> {
    return request<import('@/types').Facture>('/api/factures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFacture(id: number, data: Partial<import('@/types').Facture>): Promise<import('@/types').Facture> {
    return request<import('@/types').Facture>(`/api/factures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    });
  },

  // Documents
  async getDocuments(): Promise<import('@/types').DocumentMedical[]> {
    const res = await request<import('@/types').DocumentMedical[] | { 'hydra:member': import('@/types').DocumentMedical[] }>('/api/documents');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async createDocument(data: {
    nomFichier: string;
    type: string;
    patient: string;
    description?: string;
    url?: string;
  }): Promise<import('@/types').DocumentMedical> {
    return request<import('@/types').DocumentMedical>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Smart Clinique features
  async getSmartCreneaux(medecinId: number, date?: string): Promise<{
    medecinId: number;
    medecin: string;
    specialite: string;
    date: string;
    dureeMinutes: number;
    creneaux: import('@/types').SmartCreneau[];
  }> {
    const q = date ? `?medecinId=${medecinId}&date=${date}` : `?medecinId=${medecinId}`;
    return request(`/api/smart/creneaux-disponibles${q}`);
  },

  async getSmartSuggestion(specialite?: string, medecinId?: number): Promise<import('@/types').SmartSuggestion> {
    const params = new URLSearchParams();
    if (specialite) params.append('specialite', specialite);
    if (medecinId) params.append('medecinId', String(medecinId));
    return request(`/api/smart/suggestion-prochain-creneau?${params.toString()}`);
  },

  async verifierAllergies(patientId: number, medicaments: string): Promise<{
    patient: string;
    allergiesEnregistrees: string;
    hasConflict: boolean;
    alertes: import('@/types').AllergieAlerte[];
  }> {
    return request('/api/smart/verifier-allergies', {
      method: 'POST',
      body: JSON.stringify({ patientId, medicaments }),
    });
  },

  async getSalleAttente(): Promise<import('@/types').SalleAttenteData> {
    return request<import('@/types').SalleAttenteData>('/api/smart/salle-attente');
  },

  async updateStatutSalleAttente(id: number, statut: string): Promise<{ success: boolean; id: number; statut: string }> {
    return request(`/api/smart/salle-attente/${id}/statut`, {
      method: 'POST',
      body: JSON.stringify({ statut }),
    });
  },

  async getStatistiquesAvancees(): Promise<import('@/types').StatistiquesAvancees> {
    return request<import('@/types').StatistiquesAvancees>('/api/smart/statistiques-avancees');
  },

  // Chirurgies & Bloc Opératoire
  async getChirurgies(): Promise<import('@/types').Chirurgie[]> {
    const res = await request<import('@/types').Chirurgie[] | { 'hydra:member': import('@/types').Chirurgie[] }>('/api/chirurgies');
    return Array.isArray(res) ? res : res['hydra:member'] || [];
  },

  async createChirurgie(data: {
    patient: string; // IRI '/api/patients/1'
    chirurgien: string; // IRI '/api/medecins/1'
    titreIntervention: string;
    dateIntervention: string;
    heureDebut: string;
    dureeMinutes: number;
    salleOperation: string;
    typeAnesthesie: string;
    statut: string;
    fixePar: string;
    notesPreoperatoires?: string;
  }): Promise<import('@/types').Chirurgie> {
    return request<import('@/types').Chirurgie>('/api/chirurgies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateChirurgie(id: number, data: Partial<{
    patient: string;
    chirurgien: string;
    titreIntervention: string;
    dateIntervention: string;
    heureDebut: string;
    dureeMinutes: number;
    salleOperation: string;
    typeAnesthesie: string;
    statut: string;
    fixePar: string;
    notesPreoperatoires?: string;
  }>): Promise<import('@/types').Chirurgie> {
    return request<import('@/types').Chirurgie>(`/api/chirurgies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    });
  },

  async deleteChirurgie(id: number): Promise<void> {
    return request<void>(`/api/chirurgies/${id}`, {
      method: 'DELETE',
    });
  },
};

