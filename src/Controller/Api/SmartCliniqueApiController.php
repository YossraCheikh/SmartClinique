<?php

namespace App\Controller\Api;

use App\Entity\Consultation;
use App\Entity\Facture;
use App\Entity\Medecin;
use App\Entity\Patient;
use App\Entity\RendezVous;
use App\Repository\ConsultationRepository;
use App\Repository\DisponibiliteRepository;
use App\Repository\FactureRepository;
use App\Repository\MedecinRepository;
use App\Repository\PatientRepository;
use App\Repository\RendezVousRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/smart')]
class SmartCliniqueApiController extends AbstractController
{
    /**
     * 1. Suggestion de créneaux disponibles & détection de conflits
     */
    #[Route('/creneaux-disponibles', name: 'api_smart_creneaux', methods: ['GET'])]
    public function getCreneauxDisponibles(
        Request $request,
        MedecinRepository $medecinRepo,
        RendezVousRepository $rdvRepo
    ): JsonResponse {
        $medecinId = $request->query->get('medecinId');
        $dateStr = $request->query->get('date') ?? (new \DateTime())->format('Y-m-d');

        if (!$medecinId) {
            return $this->json(['error' => 'medecinId est obligatoire'], 400);
        }

        $medecin = $medecinRepo->find($medecinId);
        if (!$medecin) {
            return $this->json(['error' => 'Médecin non trouvé'], 404);
        }

        $date = new \DateTime($dateStr);
        $joursFr = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi', 7 => 'Dimanche'];
        $jourSemaine = $joursFr[(int)$date->format('N')] ?? '';

        // Récupérer les créneaux de travail du médecin pour ce jour
        $dispos = $medecin->getDisponibilites()->filter(function ($d) use ($jourSemaine) {
            return $d->getJourSemaine() === $jourSemaine;
        });

        // Tous les RDV déjà pris ce jour
        $rdvsPris = $rdvRepo->findBy([
            'medecin' => $medecin,
            'date' => $date,
        ]);

        $heuresPrises = [];
        foreach ($rdvsPris as $r) {
            if ($r->getStatut() !== 'Annulé' && $r->getHeure()) {
                $heuresPrises[] = $r->getHeure()->format('H:i');
            }
        }

        // Créer les créneaux par tranche de dureeConsultation (défaut 30 min)
        $duree = $medecin->getDureeConsultation() ?: 30;
        $creneaux = [];

        // Si le médecin n'a pas de plage définie le weekend
        if (in_array((int)$date->format('N'), [6, 7])) {
            return $this->json([
                'medecin' => $medecin->getPrenom() . ' ' . $medecin->getNom(),
                'date' => $dateStr,
                'disponible' => false,
                'message' => 'Le cabinet est fermé le weekend.',
                'creneaux' => [],
            ]);
        }

        // Plages par défaut si non configuré : 09:00 - 12:30 et 14:00 - 18:00
        $plages = [];
        if (count($dispos) > 0) {
            foreach ($dispos as $d) {
                $plages[] = [
                    'debut' => $d->getHeureDebut()->format('H:i'),
                    'fin' => $d->getHeureFin()->format('H:i'),
                ];
            }
        } else {
            $plages = [
                ['debut' => '09:00', 'fin' => '12:30'],
                ['debut' => '14:00', 'fin' => '18:00'],
            ];
        }

        foreach ($plages as $plage) {
            $start = new \DateTime($dateStr . ' ' . $plage['debut']);
            $end = new \DateTime($dateStr . ' ' . $plage['fin']);

            while ($start < $end) {
                $hStr = $start->format('H:i');
                $estOccupe = in_array($hStr, $heuresPrises);
                $creneaux[] = [
                    'heure' => $hStr,
                    'disponible' => !$estOccupe,
                    'conflit' => $estOccupe,
                ];
                $start->modify("+{$duree} minutes");
            }
        }

        return $this->json([
            'medecinId' => $medecin->getId(),
            'medecin' => 'Dr. ' . $medecin->getPrenom() . ' ' . $medecin->getNom(),
            'specialite' => $medecin->getSpecialite(),
            'date' => $dateStr,
            'dureeMinutes' => $duree,
            'creneaux' => $creneaux,
        ]);
    }

    /**
     * 2. Suggestion intelligente du prochain créneau disponible (par spécialité ou médecin)
     */
    #[Route('/suggestion-prochain-creneau', name: 'api_smart_suggestion', methods: ['GET'])]
    public function suggestProchainCreneau(
        Request $request,
        MedecinRepository $medecinRepo,
        RendezVousRepository $rdvRepo
    ): JsonResponse {
        $specialite = $request->query->get('specialite');
        $medecinId = $request->query->get('medecinId');

        $medecins = [];
        if ($medecinId) {
            $m = $medecinRepo->find($medecinId);
            if ($m) $medecins = [$m];
        } elseif ($specialite) {
            $medecins = $medecinRepo->findBy(['specialite' => $specialite]);
        } else {
            $medecins = $medecinRepo->findAll();
        }

        if (empty($medecins)) {
            return $this->json(['message' => 'Aucun médecin trouvé pour ce critère'], 404);
        }

        $now = new \DateTime();
        // Parcourir les 14 prochains jours ouvrés
        for ($i = 0; $i <= 14; $i++) {
            $dateTest = (clone $now)->modify("+$i days");
            if (in_array((int)$dateTest->format('N'), [6, 7])) continue; // Ignorer weekend

            $dateStr = $dateTest->format('Y-m-d');
            $heuresTest = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

            foreach ($medecins as $medecin) {
                $rdvsPris = $rdvRepo->findBy([
                    'medecin' => $medecin,
                    'date' => new \DateTime($dateStr),
                ]);

                $heuresPrises = array_map(fn($r) => $r->getHeure()?->format('H:i'), $rdvsPris);

                foreach ($heuresTest as $h) {
                    if ($i === 0 && $h <= $now->format('H:i')) {
                        continue; // Heure déjà passée aujourd'hui
                    }

                    if (!in_array($h, $heuresPrises)) {
                        return $this->json([
                            'trouve' => true,
                            'date' => $dateStr,
                            'dateLisible' => $dateTest->format('d/m/Y'),
                            'heure' => $h,
                            'medecin' => [
                                'id' => $medecin->getId(),
                                'nom' => $medecin->getNom(),
                                'prenom' => $medecin->getPrenom(),
                                'specialite' => $medecin->getSpecialite(),
                                'tarif' => $medecin->getTarif(),
                            ],
                            'motifSuggere' => 'Consultation ' . $medecin->getSpecialite(),
                        ]);
                    }
                }
            }
        }

        return $this->json([
            'trouve' => false,
            'message' => 'Aucun créneau disponible dans les 14 prochains jours.',
        ]);
    }

    /**
     * 3. Alertes médicales : Détection d'allergies lors de la rédaction d'une ordonnance
     */
    #[Route('/verifier-allergies', name: 'api_smart_allergies', methods: ['POST'])]
    public function verifierAllergies(
        Request $request,
        PatientRepository $patientRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $patientId = $data['patientId'] ?? null;
        $medicaments = strtolower($data['medicaments'] ?? '');

        if (!$patientId) {
            return $this->json(['error' => 'patientId est requis'], 400);
        }

        $patient = $patientRepo->find($patientId);
        if (!$patient) {
            return $this->json(['error' => 'Patient introuvable'], 404);
        }

        $allergiesPatient = strtolower($patient->getAllergies() ?? '');
        $alertes = [];

        // Familles et équivalences médicamenteuses courantes
        $allergyPatterns = [
            'pénicilline' => ['penicilline', 'amoxicilline', 'augmentin', 'clavulanique', 'ampicilline', 'oxacilline'],
            'penicilline' => ['penicilline', 'amoxicilline', 'augmentin', 'clavulanique'],
            'aspirine' => ['aspirine', 'acide acetylsalicylique', 'kardegic', 'aspégic', 'aspegic'],
            'anti-inflammatoires' => ['ibuprofene', 'ibuprofène', 'ketoprofene', 'advil', 'nurofen', 'voltarène', 'diclofenac'],
            'sulfamides' => ['bactrim', 'sulfamide', 'sulfamethoxazole'],
            'paracétamol' => ['doliprane', 'efferalgan', 'dafalgan', 'paracetamol', 'paracétamol'],
            'iode' => ['iode', 'betadine', 'bétadine', 'produit de contraste'],
            'arachides' => ['huile d\'arachide'],
        ];

        foreach ($allergyPatterns as $allergieKey => $substances) {
            if (str_contains($allergiesPatient, $allergieKey)) {
                foreach ($substances as $substance) {
                    if (str_contains($medicaments, $substance)) {
                        $alertes[] = [
                            'allergie' => ucfirst($allergieKey),
                            'substanceDetectee' => ucfirst($substance),
                            'severite' => 'CRITIQUE',
                            'message' => "Attention : Le patient est allergique à '{$allergieKey}'. La molécule prescrite '{$substance}' présente un risque majeur de choc allergique !",
                        ];
                    }
                }
            }
        }

        return $this->json([
            'patient' => $patient->getPrenom() . ' ' . $patient->getNom(),
            'allergiesEnregistrees' => $patient->getAllergies() ?: 'Aucune allergie connue',
            'hasConflict' => count($alertes) > 0,
            'alertes' => $alertes,
        ]);
    }

    /**
     * 4. Salle d'attente (File d'attente du jour)
     */
    #[Route('/salle-attente', name: 'api_smart_salle_attente', methods: ['GET'])]
    public function getSalleAttente(
        RendezVousRepository $rdvRepo
    ): JsonResponse {
        $today = new \DateTime('today');
        $rdvsAuj = $rdvRepo->findBy(['date' => $today], ['heure' => 'ASC']);

        $fileAttente = [];
        $nbEnAttente = 0;
        $nbEnConsultation = 0;
        $nbTermines = 0;

        foreach ($rdvsAuj as $r) {
            $statut = $r->getStatut();
            if ($statut === 'En attente') $nbEnAttente++;
            elseif ($statut === 'Confirmé') $nbEnConsultation++;
            elseif ($statut === 'Terminé') $nbTermines++;

            $fileAttente[] = [
                'id' => $r->getId(),
                'heure' => $r->getHeure()?->format('H:i') ?? '09:00',
                'statut' => $r->getStatut(),
                'motif' => $r->getMotif(),
                'patient' => [
                    'id' => $r->getPatient()?->getId(),
                    'nom' => $r->getPatient()?->getNom(),
                    'prenom' => $r->getPatient()?->getPrenom(),
                    'numeroDossier' => $r->getPatient()?->getNumeroDossier(),
                    'telephone' => $r->getPatient()?->getTelephone(),
                    'allergies' => $r->getPatient()?->getAllergies(),
                ],
                'medecin' => [
                    'id' => $r->getMedecin()?->getId(),
                    'nom' => $r->getMedecin()?->getNom(),
                    'prenom' => $r->getMedecin()?->getPrenom(),
                    'specialite' => $r->getMedecin()?->getSpecialite(),
                ],
            ];
        }

        return $this->json([
            'date' => $today->format('Y-m-d'),
            'dateLisible' => $today->format('d/m/Y'),
            'totalAujourdhui' => count($fileAttente),
            'nbEnAttente' => $nbEnAttente,
            'nbEnConsultation' => $nbEnConsultation,
            'nbTermines' => $nbTermines,
            'patients' => $fileAttente,
        ]);
    }

    /**
     * 5. Changement rapide de statut dans la file d'attente
     */
    #[Route('/salle-attente/{id}/statut', name: 'api_smart_changer_statut', methods: ['PATCH', 'POST'])]
    public function updateStatutSalleAttente(
        int $id,
        Request $request,
        RendezVousRepository $rdvRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $rdv = $rdvRepo->find($id);
        if (!$rdv) {
            return $this->json(['error' => 'Rendez-vous introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $nouveauStatut = $data['statut'] ?? null;

        if (!$nouveauStatut) {
            return $this->json(['error' => 'Statut manquant'], 400);
        }

        $rdv->setStatut($nouveauStatut);
        $em->flush();

        return $this->json([
            'success' => true,
            'id' => $rdv->getId(),
            'statut' => $rdv->getStatut(),
        ]);
    }

    /**
     * 6. Statistiques décisionnelles et financières avancées
     */
    #[Route('/statistiques-avancees', name: 'api_smart_stats_avancees', methods: ['GET'])]
    public function getStatistiquesAvancees(
        PatientRepository $patientRepo,
        MedecinRepository $medecinRepo,
        RendezVousRepository $rdvRepo,
        ConsultationRepository $consultRepo,
        FactureRepository $factureRepo
    ): JsonResponse {
        $totalPatients = $patientRepo->count([]);
        $totalMedecins = $medecinRepo->count([]);
        $totalConsultations = $consultRepo->count([]);
        $allRdv = $rdvRepo->findAll();
        $totalRdv = count($allRdv);

        // Taux d'absentéisme et d'annulation
        $nbAbsents = 0;
        $nbAnnules = 0;
        $nbTermines = 0;
        $specialiteStats = [];
        $medecinRevenus = [];

        foreach ($allRdv as $r) {
            $statut = $r->getStatut();
            if ($statut === 'Absent') $nbAbsents++;
            elseif ($statut === 'Annulé') $nbAnnules++;
            elseif ($statut === 'Terminé') $nbTermines++;

            $spec = $r->getMedecin()?->getSpecialite() ?? 'Autre';
            $specialiteStats[$spec] = ($specialiteStats[$spec] ?? 0) + 1;
        }

        $tauxAbsenteisme = $totalRdv > 0 ? round(($nbAbsents / $totalRdv) * 100, 1) : 0;
        $tauxAnnulation = $totalRdv > 0 ? round(($nbAnnules / $totalRdv) * 100, 1) : 0;
        $tauxRemplissage = $totalRdv > 0 ? round(($nbTermines / $totalRdv) * 100, 1) : 0;

        // Factures et revenus
        $allFactures = $factureRepo->findAll();
        $totalRevenus = 0.0;
        $revenusParMois = [];
        $facturesParStatut = ['paye' => 0, 'impaye' => 0, 'partiel' => 0];

        foreach ($allFactures as $f) {
            $montant = $f->getMontant() ?? 0.0;
            $statut = $f->getStatut();
            $facturesParStatut[$statut] = ($facturesParStatut[$statut] ?? 0) + 1;

            if ($statut === 'paye') {
                $totalRevenus += $montant;
            }

            $dateF = $f->getDateFacture();
            if ($dateF) {
                $cleMois = $dateF->format('Y-m');
                $revenusParMois[$cleMois] = ($revenusParMois[$cleMois] ?? 0.0) + $montant;
            }

            // Revenu par médecin
            $medecinNom = $f->getConsultation()?->getRendezVous()?->getMedecin()?->getFullName() ?? 'Dr. Général';
            $medecinRevenus[$medecinNom] = ($medecinRevenus[$medecinNom] ?? 0.0) + $montant;
        }

        // Patients sans consultation depuis plus de 6 mois (suivi préventif)
        $sixMoisAvant = (new \DateTime())->modify('-6 months');
        $patientsSansSuivi = [];
        $patients = $patientRepo->findAll();

        foreach ($patients as $p) {
            $hasRecent = false;
            foreach ($p->getRendezVous() as $r) {
                if ($r->getDate() && $r->getDate() >= $sixMoisAvant) {
                    $hasRecent = true;
                    break;
                }
            }
            if (!$hasRecent) {
                $patientsSansSuivi[] = [
                    'id' => $p->getId(),
                    'nom' => $p->getNom(),
                    'prenom' => $p->getPrenom(),
                    'telephone' => $p->getTelephone(),
                    'email' => $p->getEmail(),
                    'numeroDossier' => $p->getNumeroDossier(),
                ];
            }
        }

        return $this->json([
            'kpis' => [
                'totalPatients' => $totalPatients,
                'totalMedecins' => $totalMedecins,
                'totalRdv' => $totalRdv,
                'totalConsultations' => $totalConsultations,
                'totalRevenus' => $totalRevenus,
                'tauxAbsenteisme' => $tauxAbsenteisme,
                'tauxAnnulation' => $tauxAnnulation,
                'tauxRemplissage' => $tauxRemplissage,
            ],
            'specialites' => $specialiteStats,
            'revenusParMedecin' => $medecinRevenus,
            'revenusParMois' => $revenusParMois,
            'facturesParStatut' => $facturesParStatut,
            'patientsSansSuivi' => array_slice($patientsSansSuivi, 0, 5),
            'nbPatientsSansSuivi' => count($patientsSansSuivi),
        ]);
    }
}
