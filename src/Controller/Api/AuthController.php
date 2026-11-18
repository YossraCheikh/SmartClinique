<?php

namespace App\Controller\Api;

use App\Entity\Patient;
use App\Entity\RendezVous;
use App\Entity\User;
use App\Repository\MedecinRepository;
use App\Repository\PatientRepository;
use App\Repository\RendezVousRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $userRepo,
        PatientRepository $patientRepo,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $nom = trim($data['nom'] ?? '');
        $prenom = trim($data['prenom'] ?? '');
        $telephone = trim($data['telephone'] ?? '');

        if (!$email || !$password || !$nom || !$prenom) {
            return $this->json(['error' => 'Champs obligatoires manquants (nom, prénom, email, mot de passe).'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Format d\'adresse email invalide.'], 400);
        }

        if (strlen($password) < 6) {
            return $this->json(['error' => 'Le mot de passe doit comporter au moins 6 caractères.'], 400);
        }

        // Vérifier si l'utilisateur existe déjà
        $existing = $userRepo->findOneBy(['email' => $email]);
        if ($existing) {
            return $this->json(['error' => 'Un compte existe déjà avec cette adresse email.'], 400);
        }

        // Créer l'utilisateur système Patient
        $user = new User();
        $user->setEmail($email);
        $user->setNom($nom);
        $user->setPrenom($prenom);
        $user->setTelephone($telephone ?: null);
        $user->setRoles(['ROLE_PATIENT']);
        $user->setPassword($passwordHasher->hashPassword($user, $password));
        $em->persist($user);

        // Créer ou associer le dossier Patient clinique
        $patient = $patientRepo->findOneBy(['email' => $email]);
        if (!$patient) {
            $patient = new Patient();
            $patient->setEmail($email);
            $patient->setNom($nom);
            $patient->setPrenom($prenom);
            $patient->setTelephone($telephone ?: '0600000000');
            $patient->setNumeroDossier('DOS-' . strtoupper(substr(uniqid(), -6)));

            if (!empty($data['dateNaissance'])) {
                $patient->setDateNaissance(new \DateTime($data['dateNaissance']));
            }
            if (!empty($data['sexe'])) {
                $patient->setSexe($data['sexe']);
            }
            if (!empty($data['adresse'])) {
                $patient->setAdresse($data['adresse']);
            }
            if (!empty($data['groupeSanguin'])) {
                $patient->setGroupeSanguin($data['groupeSanguin']);
            }
            if (!empty($data['allergies'])) {
                $patient->setAllergies($data['allergies']);
            }
            if (!empty($data['antecedents'])) {
                $patient->setAntecedents($data['antecedents']);
            }
            $em->persist($patient);
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Compte patient créé avec succès. Vous pouvez maintenant vous connecter.',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'patientId' => $patient->getId(),
                'numeroDossier' => $patient->getNumeroDossier(),
            ],
        ], 201);
    }

    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(PatientRepository $patientRepo, MedecinRepository $medecinRepo): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $patient = $patientRepo->findOneBy(['email' => $user->getEmail()]);
        $medecin = $medecinRepo->findOneBy(['email' => $user->getEmail()]);

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'fullName' => $user->getFullName(),
            'telephone' => $user->getTelephone(),
            'roles' => $user->getRoles(),
            'patientId' => $patient?->getId(),
            'numeroDossier' => $patient?->getNumeroDossier(),
            'medecinId' => $medecin?->getId(),
        ]);
    }

    /**
     * Espace Patient : Récupération du dossier médical et des RDVs du patient connecté
     */
    #[Route('/patient/me/data', name: 'api_patient_me_data', methods: ['GET'])]
    public function getPatientData(PatientRepository $patientRepo, RendezVousRepository $rdvRepo): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $patient = $patientRepo->findOneBy(['email' => $user->getEmail()]);

        if (!$patient) {
            return $this->json([
                'patient' => null,
                'rendezVous' => [],
                'consultations' => [],
            ]);
        }

        // Récupérer les RDVs du patient
        $rdvs = $rdvRepo->findBy(['patient' => $patient], ['date' => 'DESC', 'heure' => 'DESC']);

        $rdvsData = [];
        $consultationsData = [];

        foreach ($rdvs as $r) {
            $rdvsData[] = [
                'id' => $r->getId(),
                'date' => $r->getDate()?->format('Y-m-d'),
                'heure' => $r->getHeure()?->format('H:i'),
                'motif' => $r->getMotif(),
                'statut' => $r->getStatut(),
                'medecin' => $r->getMedecin() ? [
                    'id' => $r->getMedecin()->getId(),
                    'nom' => $r->getMedecin()->getNom(),
                    'prenom' => $r->getMedecin()->getPrenom(),
                    'specialite' => $r->getMedecin()->getSpecialite(),
                    'telephone' => $r->getMedecin()->getTelephone(),
                    'tarif' => $r->getMedecin()->getTarif(),
                ] : null,
            ];

            foreach ($r->getConsultations() as $c) {
                $consultationsData[] = [
                    'id' => $c->getId(),
                    'date' => $r->getDate()?->format('Y-m-d'),
                    'motif' => $c->getMotif() ?: $r->getMotif(),
                    'diagnostic' => $c->getDiagnostic(),
                    'symptomes' => $c->getSymptomes(),
                    'notes' => $c->getNotes(),
                    'tension' => $c->getTension(),
                    'poids' => $c->getPoids(),
                    'temperature' => $c->getTemperature(),
                    'medecin' => $r->getMedecin() ? [
                        'nom' => $r->getMedecin()->getNom(),
                        'prenom' => $r->getMedecin()->getPrenom(),
                        'specialite' => $r->getMedecin()->getSpecialite(),
                    ] : null,
                    'ordonnance' => $r->getOrdonnance() ? [
                        'id' => $r->getOrdonnance()->getId(),
                        'date' => $r->getOrdonnance()->getDate()?->format('Y-m-d'),
                        'medicaments' => $r->getOrdonnance()->getMedicaments(),
                        'description' => $r->getOrdonnance()->getDescription(),
                    ] : null,
                ];
            }
        }

        return $this->json([
            'patient' => [
                'id' => $patient->getId(),
                'numeroDossier' => $patient->getNumeroDossier(),
                'nom' => $patient->getNom(),
                'prenom' => $patient->getPrenom(),
                'email' => $patient->getEmail(),
                'telephone' => $patient->getTelephone(),
                'dateNaissance' => $patient->getDateNaissance()?->format('Y-m-d'),
                'sexe' => $patient->getSexe(),
                'adresse' => $patient->getAdresse(),
                'groupeSanguin' => $patient->getGroupeSanguin(),
                'allergies' => $patient->getAllergies(),
                'antecedents' => $patient->getAntecedents(),
            ],
            'rendezVous' => $rdvsData,
            'consultations' => $consultationsData,
        ]);
    }

    /**
     * Espace Patient : Prise de rendez-vous directe par le patient connecté
     */
    #[Route('/patient/rendez-vous', name: 'api_patient_creer_rdv', methods: ['POST'])]
    public function creerRendezVousPatient(
        Request $request,
        PatientRepository $patientRepo,
        MedecinRepository $medecinRepo,
        RendezVousRepository $rdvRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté pour réserver un rendez-vous.'], 401);
        }

        // Retrouver ou créer le dossier patient
        $patient = $patientRepo->findOneBy(['email' => $user->getEmail()]);
        if (!$patient) {
            $patient = new Patient();
            $patient->setEmail($user->getEmail());
            $patient->setNom($user->getNom());
            $patient->setPrenom($user->getPrenom());
            $patient->setTelephone($user->getTelephone() ?: '0600000000');
            $em->persist($patient);
            $em->flush();
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $medecinId = $data['medecinId'] ?? null;
        $dateStr = $data['date'] ?? null;
        $heureStr = $data['heure'] ?? null;
        $motif = trim($data['motif'] ?? 'Consultation');

        if (!$medecinId || !$dateStr || !$heureStr) {
            return $this->json(['error' => 'Médecin, date et heure sont obligatoires.'], 400);
        }

        $medecin = $medecinRepo->find($medecinId);
        if (!$medecin) {
            return $this->json(['error' => 'Médecin sélectionné introuvable.'], 404);
        }

        $date = new \DateTime($dateStr);
        $heure = new \DateTime($heureStr);

        // Vérifier si le créneau est déjà pris pour ce médecin
        $conflits = $rdvRepo->findBy([
            'medecin' => $medecin,
            'date' => $date,
        ]);
        foreach ($conflits as $c) {
            if ($c->getStatut() !== 'Annulé' && $c->getHeure() && $c->getHeure()->format('H:i') === $heure->format('H:i')) {
                return $this->json(['error' => 'Ce créneau est déjà réservé pour ce médecin. Veuillez choisir un autre horaire.'], 409);
            }
        }

        $rdv = new RendezVous();
        $rdv->setPatient($patient);
        $rdv->setMedecin($medecin);
        $rdv->setDate($date);
        $rdv->setHeure($heure);
        $rdv->setMotif($motif);
        $rdv->setStatut('En attente');

        $em->persist($rdv);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Votre demande de rendez-vous a été enregistrée avec succès. Statut : En attente de confirmation.',
            'rendezVous' => [
                'id' => $rdv->getId(),
                'date' => $rdv->getDate()?->format('Y-m-d'),
                'heure' => $rdv->getHeure()?->format('H:i'),
                'motif' => $rdv->getMotif(),
                'statut' => $rdv->getStatut(),
                'medecin' => [
                    'nom' => $medecin->getNom(),
                    'prenom' => $medecin->getPrenom(),
                    'specialite' => $medecin->getSpecialite(),
                ],
            ],
        ], 201);
    }

    /**
     * Espace Patient : Annulation d'un rendez-vous par le patient connecté
     */
    #[Route('/patient/rendez-vous/{id}/annuler', name: 'api_patient_annuler_rdv', methods: ['POST'])]
    public function annulerRendezVousPatient(
        int $id,
        PatientRepository $patientRepo,
        RendezVousRepository $rdvRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $patient = $patientRepo->findOneBy(['email' => $user->getEmail()]);
        if (!$patient) {
            return $this->json(['error' => 'Dossier patient introuvable.'], 404);
        }

        $rdv = $rdvRepo->find($id);
        if (!$rdv) {
            return $this->json(['error' => 'Rendez-vous introuvable.'], 404);
        }

        if ($rdv->getPatient() !== $patient) {
            return $this->json(['error' => 'Action non autorisée sur ce rendez-vous.'], 403);
        }

        if ($rdv->getStatut() === 'Annulé') {
            return $this->json(['message' => 'Ce rendez-vous est déjà annulé.'], 200);
        }

        $rdv->setStatut('Annulé');
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Votre rendez-vous a bien été annulé.',
            'id' => $rdv->getId(),
            'statut' => $rdv->getStatut(),
        ]);
    }
}
