<?php

namespace App\Controller\Api;

use App\Entity\Medecin;
use App\Entity\Patient;
use App\Entity\RendezVous;
use App\Entity\Chirurgie;
use App\Repository\ChirurgieRepository;
use App\Repository\MedecinRepository;
use App\Repository\PatientRepository;
use App\Repository\RendezVousRepository;
use App\Service\GeminiAIService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class ChatController extends AbstractController
{
    /**
     * Synchronous Chat Endpoint (with Function Calling & Slot Conflict Check).
     */
    #[Route('/chat', name: 'api_chat', methods: ['POST'])]
    public function chat(
        Request $request,
        GeminiAIService $aiService,
        MedecinRepository $medecinRepository,
        PatientRepository $patientRepository,
        RendezVousRepository $rendezVousRepository,
        ChirurgieRepository $chirurgieRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $message = trim($data['message'] ?? '');
        $history = $data['history'] ?? [];

        if (empty($message)) {
            return $this->json(['error' => 'Le message est requis.'], 400);
        }

        $currentUser = $this->getUser();
        $context = $this->buildClinicContext($medecinRepository, $patientRepository, $rendezVousRepository, $chirurgieRepository, $currentUser);
        $result = $aiService->chatWithTools($message, $context, $history);

        $appointmentCreated = null;
        $finalText = '';

        if ($result['type'] === 'function_call') {
            $funcName = $result['name'];
            $args = $result['args'];

            if ($funcName === 'verifierCreneauxDisponibles') {
                $medecinId = (int)($args['medecinId'] ?? 0);
                $dateStr = $args['date'] ?? (new \DateTime('+1 day'))->format('Y-m-d');

                $doctor = $this->resolveDoctor($medecinId, $medecinRepository);
                if (!$doctor) {
                    $toolOutput = ['error' => 'Médecin non trouvé avec cet identifiant.'];
                } else {
                    $slotsData = $this->getRealDoctorSlots($doctor, $dateStr, $rendezVousRepository);
                    $toolOutput = [
                        'medecin' => "Dr. {$doctor->getPrenom()} {$doctor->getNom()}",
                        'specialite' => $doctor->getSpecialite(),
                        'date' => $dateStr,
                        'creneauxDisponibles' => $slotsData['disponibles'],
                        'creneauxOccupes' => $slotsData['occupes'],
                        'message' => count($slotsData['disponibles']) > 0
                            ? 'Voici les créneaux réellement libres.'
                            : 'Aucun créneau disponible pour cette journée.',
                    ];
                }

                $finalText = $aiService->completeWithFunctionResult($history, $message, $funcName, $toolOutput, $context);
            } elseif ($funcName === 'reserverRendezVous') {
                $medecinId = (int)($args['medecinId'] ?? 0);
                $dateStr = $args['date'] ?? (new \DateTime('+1 day'))->format('Y-m-d');
                $heureStr = $args['heure'] ?? '10:00';
                $patientNom = $args['patientNom'] ?? 'Patient Consultation';
                $motif = $args['motif'] ?? 'Consultation médicale';
                $telephone = $args['patientTelephone'] ?? null;

                $bookingResult = $this->executeBooking(
                    $medecinId,
                    $dateStr,
                    $heureStr,
                    $patientNom,
                    $motif,
                    $telephone,
                    $medecinRepository,
                    $patientRepository,
                    $rendezVousRepository,
                    $entityManager
                );

                if ($bookingResult['success']) {
                    $appointmentCreated = $bookingResult['appointment'];
                }

                $finalText = $aiService->completeWithFunctionResult($history, $message, $funcName, $bookingResult, $context);
            } else {
                $finalText = "Demande traitée.";
            }
        } else {
            $finalText = $result['text'] ?? "Désolé, je n'ai pas pu générer de réponse.";
        }

        return $this->json([
            'response' => $finalText,
            'appointment' => $appointmentCreated,
            'timestamp' => (new \DateTime())->format('c'),
        ]);
    }

    /**
     * Server-Sent Events (SSE) Streaming Endpoint.
     */
    #[Route('/chat/stream', name: 'api_chat_stream', methods: ['POST'])]
    public function chatStream(
        Request $request,
        GeminiAIService $aiService,
        MedecinRepository $medecinRepository,
        PatientRepository $patientRepository,
        RendezVousRepository $rendezVousRepository,
        ChirurgieRepository $chirurgieRepository,
        EntityManagerInterface $entityManager
    ): StreamedResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $message = trim($data['message'] ?? '');
        $history = $data['history'] ?? [];

        $currentUser = $this->getUser();
        $context = $this->buildClinicContext($medecinRepository, $patientRepository, $rendezVousRepository, $chirurgieRepository, $currentUser);

        $response = new StreamedResponse(function () use (
            $message,
            $history,
            $context,
            $currentUser,
            $aiService,
            $medecinRepository,
            $patientRepository,
            $rendezVousRepository,
            $chirurgieRepository,
            $entityManager
        ) {
            // Disable output buffering
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            // Step 1: Check if the message triggers a tool call (booking or slot check)
            $firstPass = $aiService->chatWithTools($message, $context, $history);

            if ($firstPass['type'] === 'function_call') {
                $funcName = $firstPass['name'];
                $args = $firstPass['args'];
                $appointment = null;

                if ($funcName === 'verifierCreneauxDisponibles') {
                    $medecinId = (int)($args['medecinId'] ?? 0);
                    $dateStr = $args['date'] ?? (new \DateTime('+1 day'))->format('Y-m-d');
                    $doctor = $this->resolveDoctor($medecinId, $medecinRepository);

                    $toolOutput = [];
                    if ($doctor) {
                        $slots = $this->getRealDoctorSlots($doctor, $dateStr, $rendezVousRepository);
                        $toolOutput = [
                            'medecin' => "Dr. {$doctor->getPrenom()} {$doctor->getNom()}",
                            'date' => $dateStr,
                            'creneauxDisponibles' => $slots['disponibles'],
                            'creneauxOccupes' => $slots['occupes'],
                        ];
                    } else {
                        $toolOutput = ['error' => 'Médecin non trouvé'];
                    }

                    $answer = $aiService->completeWithFunctionResult($history, $message, $funcName, $toolOutput, $context);
                } elseif ($funcName === 'reserverRendezVous') {
                    $booking = $this->executeBooking(
                        (int)($args['medecinId'] ?? 0),
                        $args['date'] ?? (new \DateTime('+1 day'))->format('Y-m-d'),
                        $args['heure'] ?? '10:00',
                        $args['patientNom'] ?? 'Patient',
                        $args['motif'] ?? 'Consultation',
                        $args['patientTelephone'] ?? null,
                        $medecinRepository,
                        $patientRepository,
                        $rendezVousRepository,
                        $entityManager
                    );

                    if ($booking['success']) {
                        $appointment = $booking['appointment'];
                        echo "data: " . json_encode(['type' => 'appointment', 'appointment' => $appointment]) . "\n\n";
                        flush();
                    }

                    $answer = $aiService->completeWithFunctionResult($history, $message, $funcName, $booking, $context);
                } else {
                    $answer = "Demande traitée.";
                }

                // Stream the natural answer word-by-word for high fluidity
                $words = preg_split('/(\s+)/u', $answer, -1, PREG_SPLIT_DELIM_CAPTURE);
                foreach ($words as $w) {
                    echo "data: " . json_encode(['type' => 'token', 'content' => $w]) . "\n\n";
                    flush();
                    usleep(15000); // 15ms typing simulation
                }
            } else {
                // Direct streaming from Gemini
                $aiService->streamGenerate($message, $context, $history, function ($token) {
                    echo "data: " . json_encode(['type' => 'token', 'content' => $token]) . "\n\n";
                    flush();
                });
            }

            echo "data: " . json_encode(['type' => 'done']) . "\n\n";
            flush();
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    /**
     * Compute real-time slots and check for conflicts in the database.
     */
    private function getRealDoctorSlots(Medecin $medecin, string $dateStr, RendezVousRepository $rdvRepo): array
    {
        $date = new \DateTime($dateStr);
        $joursFr = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi', 7 => 'Dimanche'];
        $jourSemaine = $joursFr[(int)$date->format('N')] ?? '';

        // Cabinet fermé le weekend par défaut
        if (in_array((int)$date->format('N'), [6, 7])) {
            return ['disponibles' => [], 'occupes' => [], 'ferme' => true];
        }

        // Récupérer les créneaux déclarés ou plages standards
        $dispos = $medecin->getDisponibilites()->filter(fn($d) => $d->getJourSemaine() === $jourSemaine);
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

        // Rendez-vous existants non annulés
        $rdvsPris = $rdvRepo->findByMedecinAndDate($medecin, $dateStr);
        $heuresPrises = [];
        foreach ($rdvsPris as $r) {
            if ($r->getStatut() !== 'Annulé' && $r->getHeure()) {
                $heuresPrises[] = $r->getHeure()->format('H:i');
            }
        }

        $duree = $medecin->getDureeConsultation() ?: 30;
        $creneauxLibres = [];

        foreach ($plages as $plage) {
            $start = new \DateTime($dateStr . ' ' . $plage['debut']);
            $end = new \DateTime($dateStr . ' ' . $plage['fin']);

            while ($start < $end) {
                $hStr = $start->format('H:i');
                if (!in_array($hStr, $heuresPrises)) {
                    $creneauxLibres[] = $hStr;
                }
                $start->modify("+{$duree} minutes");
            }
        }

        return [
            'disponibles' => $creneauxLibres,
            'occupes' => $heuresPrises,
            'ferme' => false,
        ];
    }

    /**
     * Executes appointment booking with automatic conflict detection.
     */
    private function executeBooking(
        mixed $medecinId,
        string $dateStr,
        string $heureStr,
        string $patientNom,
        string $motif,
        ?string $telephone,
        MedecinRepository $medecinRepo,
        PatientRepository $patientRepo,
        RendezVousRepository $rdvRepo,
        EntityManagerInterface $em
    ): array {
        $doctor = $this->resolveDoctor($medecinId, $medecinRepo);
        if (!$doctor) {
            return ['success' => false, 'error' => "Médecin introuvable."];
        }

        // 1. Conflict Check: verify if slot is truly available
        $slots = $this->getRealDoctorSlots($doctor, $dateStr, $rdvRepo);
        if (in_array($heureStr, $slots['occupes'])) {
            return [
                'success' => false,
                'conflict' => true,
                'error' => "Le créneau {$heureStr} du {$dateStr} est déjà réservé pour le Dr. {$doctor->getNom()}.",
                'alternatives' => array_slice($slots['disponibles'], 0, 4),
            ];
        }

        // 2. Find or create patient (with Tunisian details)
        $parts = explode(' ', trim($patientNom), 2);
        $prenom = $parts[0] ?? 'Patient';
        $nom = $parts[1] ?? 'Consultation';

        $patient = null;
        $existingPatients = $patientRepo->findAll();
        foreach ($existingPatients as $p) {
            if (
                (stripos($p->getNom(), $nom) !== false && stripos($p->getPrenom(), $prenom) !== false) ||
                ($telephone && $p->getTelephone() === $telephone)
            ) {
                $patient = $p;
                break;
            }
        }

        if (!$patient) {
            $patient = new Patient();
            $patient->setPrenom($prenom);
            $patient->setNom($nom);
            $patient->setDateNaissance(new \DateTime('1990-01-01'));
            $patient->setSexe('M');
            $patient->setTelephone($telephone ?: '+216 20 ' . rand(100, 999) . ' ' . rand(100, 999));
            $cleanPrenom = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $prenom));
            $cleanNom = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nom));
            $patient->setEmail("{$cleanPrenom}.{$cleanNom}@clinique-santeplus.tn");
            $patient->setAdresse('Tunis, Tunisie');
            $patient->setNumeroDossier('DOS-' . strtoupper(substr(uniqid(), -6)));
            $em->persist($patient);
        }

        // 3. Create appointment
        $dateObj = new \DateTime($dateStr);
        $heureObj = new \DateTime("{$dateStr} {$heureStr}");

        $rdv = new RendezVous();
        $rdv->setDate($dateObj);
        $rdv->setHeure($heureObj);
        $rdv->setMotif($motif ?: 'Consultation médicale');
        $rdv->setStatut('Confirmé');
        $rdv->setPatient($patient);
        $rdv->setMedecin($doctor);

        $em->persist($rdv);
        $em->flush();

        return [
            'success' => true,
            'appointment' => [
                'id' => $rdv->getId(),
                'date' => $dateObj->format('Y-m-d'),
                'heure' => $heureObj->format('H:i'),
                'motif' => $rdv->getMotif(),
                'statut' => 'Confirmé',
                'patient' => "{$patient->getPrenom()} {$patient->getNom()}",
                'medecin' => "Dr. {$doctor->getPrenom()} {$doctor->getNom()}",
                'specialite' => $doctor->getSpecialite(),
            ],
        ];
    }

    private function resolveDoctor(mixed $medecinId, MedecinRepository $medecinRepo): ?Medecin
    {
        $all = $medecinRepo->findAll();
        if (is_numeric($medecinId) && (int)$medecinId > 0) {
            $doc = $medecinRepo->find((int)$medecinId);
            if ($doc) return $doc;
        }

        if (is_string($medecinId) && trim($medecinId) !== '') {
            $cleanTerm = trim(preg_replace('/^Dr\.?\s*/i', '', $medecinId));
            // Check by name
            foreach ($all as $m) {
                if (stripos($m->getNom(), $cleanTerm) !== false || stripos($m->getPrenom(), $cleanTerm) !== false) {
                    return $m;
                }
            }
            // Check by specialty
            foreach ($all as $m) {
                if (stripos($m->getSpecialite(), $cleanTerm) !== false) {
                    return $m;
                }
            }
        }

        return $all[0] ?? null;
    }

    private function buildClinicContext(
        MedecinRepository $medecinRepository,
        PatientRepository $patientRepository,
        RendezVousRepository $rendezVousRepository,
        ChirurgieRepository $chirurgieRepository,
        $currentUser = null
    ): array {
        $medecins = $medecinRepository->findAll();
        $medecinsContext = array_map(function ($m) {
            $cleanNom = preg_replace('/^Dr\.?\s*/i', '', $m->getNom());
            $cleanPrenom = preg_replace('/^Dr\.?\s*/i', '', $m->getPrenom());
            return [
                'id' => $m->getId(),
                'nom' => $cleanNom,
                'prenom' => $cleanPrenom,
                'fullName' => "Dr. {$cleanPrenom} {$cleanNom}",
                'specialite' => $m->getSpecialite(),
                'tarif' => $m->getTarif(),
                'disponibilite' => $m->getDisponibilites()->isEmpty()
                    ? 'Lun-Ven 09:00 - 17:00'
                    : implode(', ', $m->getDisponibilites()->map(fn($d) => $d->getJourSemaine() . ' ' . $d->getHeureDebut()?->format('H:i') . '-' . $d->getHeureFin()?->format('H:i'))->toArray()),
            ];
        }, $medecins);

        $medecinsList = implode(', ', array_map(
            fn($m) => "{$m['fullName']} (ID: {$m['id']}, Spécialité: {$m['specialite']}, Tarif: {$m['tarif']} TND)",
            $medecinsContext
        ));

        $specialites = implode(', ', array_unique(array_map(fn($m) => $m->getSpecialite(), $medecins)));

        // Surgical information
        $chirurgiesTotal = $chirurgieRepository->count([]);
        $chirurgiesAujourdHui = count($chirurgieRepository->findByDate(new \DateTime()));
        $chirurgiens = array_filter($medecinsContext, fn($m) => stripos($m['specialite'], 'chirurgi') !== false || stripos($m['specialite'], 'urologi') !== false);
        $chirurgiensList = implode(', ', array_map(fn($c) => "{$c['fullName']} ({$c['specialite']})", $chirurgiens));

        $userDesc = 'Visiteur public (non connecté)';
        if ($currentUser && method_exists($currentUser, 'getEmail')) {
            $roles = implode(', ', $currentUser->getRoles());
            $userDesc = "Utilisateur connecté : {$currentUser->getPrenom()} {$currentUser->getNom()} (Email: {$currentUser->getEmail()}, Rôles: [{$roles}])";
        }

        return [
            'medecins' => $medecinsList,
            'medecinsJson' => json_encode($medecinsContext, JSON_UNESCAPED_UNICODE),
            'specialites' => $specialites,
            'chirurgiens' => $chirurgiensList,
            'chirurgiesTotal' => $chirurgiesTotal,
            'chirurgiesAujourdHui' => $chirurgiesAujourdHui,
            'blocsOperatoires' => 'Bloc A (Cardiovasculaire & Thoracique), Bloc B (Orthopédie & Traumatologie), Bloc C (Chirurgie Générale & Viscérale), Bloc D (Neurochirurgie), Bloc E (Ambulatoire & Plastique)',
            'totalPatients' => $patientRepository->count([]),
            'rdvAujourdHui' => count($rendezVousRepository->findTodayAppointments()),
            'currentUser' => $userDesc,
        ];
    }
}
