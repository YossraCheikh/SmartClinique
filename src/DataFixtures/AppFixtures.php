<?php

namespace App\DataFixtures;

use App\Entity\Chirurgie;
use App\Entity\Consultation;
use App\Entity\Disponibilite;
use App\Entity\Document;
use App\Entity\Facture;
use App\Entity\Medecin;
use App\Entity\Ordonnance;
use App\Entity\Patient;
use App\Entity\RendezVous;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function load(ObjectManager $manager): void
    {
        // 1. UTILISATEURS DU SYSTÈME (Admin, Médecin, Secrétaire, Patient)
        $admin = new User();
        $admin->setEmail('admin@clinique.com');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setNom('Ben Mahmoud');
        $admin->setPrenom('Youssef');
        $admin->setTelephone('+216 71 842 001');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password'));
        $manager->persist($admin);

        $secretaire = new User();
        $secretaire->setEmail('secretaire@clinique.com');
        $secretaire->setRoles(['ROLE_SECRETAIRE']);
        $secretaire->setNom('Trabelsi');
        $secretaire->setPrenom('Sarra');
        $secretaire->setTelephone('+216 71 842 002');
        $secretaire->setPassword($this->passwordHasher->hashPassword($secretaire, 'password'));
        $manager->persist($secretaire);

        $medecinUser = new User();
        $medecinUser->setEmail('dr.bensalem@clinique.com');
        $medecinUser->setRoles(['ROLE_MEDECIN']);
        $medecinUser->setNom('Ben Salem');
        $medecinUser->setPrenom('Mohamed');
        $medecinUser->setTelephone('+216 71 842 101');
        $medecinUser->setPassword($this->passwordHasher->hashPassword($medecinUser, 'password'));
        $manager->persist($medecinUser);

        $patientUser = new User();
        $patientUser->setEmail('patient@clinique.com');
        $patientUser->setRoles(['ROLE_PATIENT']);
        $patientUser->setNom('Kallel');
        $patientUser->setPrenom('Mohamed');
        $patientUser->setTelephone('+216 98 123 456');
        $patientUser->setPassword($this->passwordHasher->hashPassword($patientUser, 'password'));
        $manager->persist($patientUser);

        // 2. MÉDECINS & DISPONIBILITÉS (Équipe Médicale Tunisienne - Tarifs en TND)
        $medecinsData = [
            [
                'nom' => 'Ben Salem',
                'prenom' => 'Mohamed',
                'specialite' => 'Cardiologue',
                'telephone' => '+216 71 842 101',
                'email' => 'dr.bensalem@clinique.com',
                'tarif' => 90.0,
                'duree' => 30,
            ],
            [
                'nom' => 'Ayari',
                'prenom' => 'Farès',
                'specialite' => 'Médecin Généraliste',
                'telephone' => '+216 71 842 102',
                'email' => 'dr.ayari@clinique.com',
                'tarif' => 45.0,
                'duree' => 20,
            ],
            [
                'nom' => 'Gharbi',
                'prenom' => 'Amina',
                'specialite' => 'Pédiatre',
                'telephone' => '+216 71 842 103',
                'email' => 'dr.gharbi@clinique.com',
                'tarif' => 65.0,
                'duree' => 30,
            ],
            [
                'nom' => 'Jaziri',
                'prenom' => 'Inès',
                'specialite' => 'Dermatologue',
                'telephone' => '+216 71 842 104',
                'email' => 'dr.jaziri@clinique.com',
                'tarif' => 75.0,
                'duree' => 25,
            ],
            [
                'nom' => 'Riahi',
                'prenom' => 'Meriem',
                'specialite' => 'Ophtalmologue',
                'telephone' => '+216 71 842 105',
                'email' => 'dr.riahi@clinique.com',
                'tarif' => 75.0,
                'duree' => 30,
            ],
            // --- CHIRURGIENS SPÉCIALISÉS & BLOC OPÉRATOIRE ---
            [
                'nom' => 'Trabelsi',
                'prenom' => 'Yassine',
                'specialite' => 'Chirurgien Orthopédique & Traumatologue',
                'telephone' => '+216 71 842 106',
                'email' => 'dr.trabelsi@clinique.com',
                'tarif' => 120.0,
                'duree' => 45,
            ],
            [
                'nom' => 'Bouazizi',
                'prenom' => 'Mehdi',
                'specialite' => 'Chirurgien Viscéral & Digestif',
                'telephone' => '+216 71 842 107',
                'email' => 'dr.bouazizi@clinique.com',
                'tarif' => 110.0,
                'duree' => 40,
            ],
            [
                'nom' => 'Ben Amor',
                'prenom' => 'Hichem',
                'specialite' => 'Chirurgien Cardiovasculaire & Thoracique',
                'telephone' => '+216 71 842 108',
                'email' => 'dr.benamor@clinique.com',
                'tarif' => 150.0,
                'duree' => 60,
            ],
            [
                'nom' => 'Mansour',
                'prenom' => 'Tarek',
                'specialite' => 'Neurochirurgien (Rachis & Crâne)',
                'telephone' => '+216 71 842 109',
                'email' => 'dr.mansour@clinique.com',
                'tarif' => 160.0,
                'duree' => 60,
            ],
            [
                'nom' => 'Khemir',
                'prenom' => 'Rim',
                'specialite' => 'Chirurgien Plastique & Reconstructeur',
                'telephone' => '+216 71 842 110',
                'email' => 'dr.khemir@clinique.com',
                'tarif' => 130.0,
                'duree' => 45,
            ],
            [
                'nom' => 'Chebbi',
                'prenom' => 'Salma',
                'specialite' => 'Chirurgien Gynécologique & Obstétrique',
                'telephone' => '+216 71 842 111',
                'email' => 'dr.chebbi@clinique.com',
                'tarif' => 110.0,
                'duree' => 40,
            ],
            [
                'nom' => 'Chaabane',
                'prenom' => 'Karim',
                'specialite' => 'Chirurgien Urologue',
                'telephone' => '+216 71 842 112',
                'email' => 'dr.chaabane@clinique.com',
                'tarif' => 110.0,
                'duree' => 35,
            ],
            // --- MÉDECINS SPÉCIALISTES ADDITIONNELS ---
            [
                'nom' => 'Mezni',
                'prenom' => 'Olfa',
                'specialite' => 'Neurologue',
                'telephone' => '+216 71 842 113',
                'email' => 'dr.mezni@clinique.com',
                'tarif' => 85.0,
                'duree' => 30,
            ],
            [
                'nom' => 'Zaier',
                'prenom' => 'Sonia',
                'specialite' => 'Endocrinologue & Diabétologue',
                'telephone' => '+216 71 842 114',
                'email' => 'dr.zaier@clinique.com',
                'tarif' => 80.0,
                'duree' => 30,
            ],
            [
                'nom' => 'Ben Romdhane',
                'prenom' => 'Zied',
                'specialite' => 'Pneumologue & Allergologue',
                'telephone' => '+216 71 842 115',
                'email' => 'dr.benromdhane@clinique.com',
                'tarif' => 80.0,
                'duree' => 30,
            ],
            [
                'nom' => 'Sellami',
                'prenom' => 'Walid',
                'specialite' => 'Rhumatologue',
                'telephone' => '+216 71 842 116',
                'email' => 'dr.sellami@clinique.com',
                'tarif' => 75.0,
                'duree' => 25,
            ],
            [
                'nom' => 'Karray',
                'prenom' => 'Anis',
                'specialite' => 'Médecin Généraliste & Urgentiste',
                'telephone' => '+216 71 842 117',
                'email' => 'dr.karray@clinique.com',
                'tarif' => 50.0,
                'duree' => 20,
            ],
        ];

        $medecinEntities = [];
        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

        foreach ($medecinsData as $data) {
            $m = new Medecin();
            $m->setNom($data['nom']);
            $m->setPrenom($data['prenom']);
            $m->setSpecialite($data['specialite']);
            $m->setTelephone($data['telephone']);
            $m->setEmail($data['email']);
            $m->setTarif($data['tarif']);
            $m->setDureeConsultation($data['duree']);
            $manager->persist($m);
            $medecinEntities[] = $m;

            // Ajouter disponibilités hebdomadaires
            foreach ($jours as $jour) {
                $dispMatin = new Disponibilite();
                $dispMatin->setMedecin($m);
                $dispMatin->setJourSemaine($jour);
                $dispMatin->setHeureDebut(new \DateTime('08:30:00'));
                $dispMatin->setHeureFin(new \DateTime('12:30:00'));
                $manager->persist($dispMatin);

                $dispAprem = new Disponibilite();
                $dispAprem->setMedecin($m);
                $dispAprem->setJourSemaine($jour);
                $dispAprem->setHeureDebut(new \DateTime('14:00:00'));
                $dispAprem->setHeureFin(new \DateTime('18:00:00'));
                $manager->persist($dispAprem);
            }
        }

        // 3. PATIENTS COMPLETS (Dossiers médicaux, antécédents, allergies)
        $patientsData = [
            [
                'nom' => 'Moreau',
                'prenom' => 'Alexandre',
                'dateNais' => '1985-04-12',
                'sexe' => 'M',
                'tel' => '0745678901',
                'email' => 'patient@clinique.com',
                'adresse' => '14 Rue de la Paix, Paris',
                'groupe' => 'O+',
                'allergies' => 'Pénicilline, Arachides',
                'antecedents' => 'Asthme modéré, Appendicectomie (2010)',
            ],
            [
                'nom' => 'Lambert',
                'prenom' => 'Élodie',
                'dateNais' => '1992-09-23',
                'sexe' => 'F',
                'tel' => '0711223344',
                'email' => 'elodie.lambert@example.com',
                'adresse' => '8 Avenue Victor Hugo, Lyon',
                'groupe' => 'A+',
                'allergies' => 'Aucune allergie connue',
                'antecedents' => 'Migraines ophtalmiques chroniques',
            ],
            [
                'nom' => 'Petit',
                'prenom' => 'Thomas',
                'dateNais' => '1978-11-05',
                'sexe' => 'M',
                'tel' => '0722334455',
                'email' => 'thomas.petit@example.com',
                'adresse' => '27 Boulevard Voltaire, Paris',
                'groupe' => 'B+',
                'allergies' => 'Aspirine',
                'antecedents' => 'Hypertension artérielle sous traitement',
            ],
            [
                'nom' => 'Girard',
                'prenom' => 'Sarah',
                'dateNais' => '2001-02-18',
                'sexe' => 'F',
                'tel' => '0733445566',
                'email' => 'sarah.girard@example.com',
                'adresse' => '5 Rue des Lilas, Nantes',
                'groupe' => 'AB-',
                'allergies' => 'Graminées, Pollen',
                'antecedents' => 'Aucun antécédent notable',
            ],
            [
                'nom' => 'Fontaine',
                'prenom' => 'David',
                'dateNais' => '1965-07-30',
                'sexe' => 'M',
                'tel' => '0744556677',
                'email' => 'david.fontaine@example.com',
                'adresse' => '12 Rue Garibaldi, Marseille',
                'groupe' => 'O-',
                'allergies' => 'Sulfamides',
                'antecedents' => 'Diabète de type 2, pontage coronarien (2018)',
            ],
            [
                'nom' => 'Chevalier',
                'prenom' => 'Julie',
                'dateNais' => '1996-12-14',
                'sexe' => 'F',
                'tel' => '0755667788',
                'email' => 'julie.chevalier@example.com',
                'adresse' => '33 Allée des Acacias, Bordeaux',
                'groupe' => 'A-',
                'allergies' => 'Latex',
                'antecedents' => 'Eczéma atopique',
            ],
        ];

        $patientEntities = [];
        $dossierIndex = 1001;
        foreach ($patientsData as $pData) {
            $p = new Patient();
            $p->setNumeroDossier('DOS-' . $dossierIndex++);
            $p->setNom($pData['nom']);
            $p->setPrenom($pData['prenom']);
            $p->setDateNaissance(new \DateTime($pData['dateNais']));
            $p->setSexe($pData['sexe']);
            $p->setTelephone($pData['tel']);
            $p->setEmail($pData['email']);
            $p->setAdresse($pData['adresse']);
            $p->setGroupeSanguin($pData['groupe']);
            $p->setAllergies($pData['allergies']);
            $p->setAntecedents($pData['antecedents']);
            $manager->persist($p);
            $patientEntities[] = $p;

            // Ajouter documents médicaux pour chaque patient
            $doc1 = new Document();
            $doc1->setPatient($p);
            $doc1->setNomFichier('Bilan_Biologique_' . $pData['nom'] . '.pdf');
            $doc1->setType('Analyse');
            $doc1->setUrl('/uploads/documents/bilan_' . strtolower($pData['nom']) . '.pdf');
            $doc1->setDescription('Bilan sanguin complet et numération formule sanguine.');
            $manager->persist($doc1);
        }

        // 4. RENDEZ-VOUS, CONSULTATIONS, FACTURES ET ORDONNANCES
        $heures = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
        $statutsRdv = ['Terminé', 'Confirmé', 'En attente', 'Terminé', 'Absent'];

        $today = new \DateTime('today');
        
        // Rendez-vous d'aujourd'hui pour la salle d'attente
        for ($i = 0; $i < 4; $i++) {
            $rdvAuj = new RendezVous();
            $rdvAuj->setPatient($patientEntities[$i % count($patientEntities)]);
            $rdvAuj->setMedecin($medecinEntities[$i % count($medecinEntities)]);
            $rdvAuj->setDate(clone $today);
            $rdvAuj->setHeure(new \DateTime($heures[$i]));
            $rdvAuj->setMotif('Consultation de suivi du jour');
            $rdvAuj->setStatut($i === 0 ? 'En attente' : ($i === 1 ? 'Confirmé' : 'Terminé'));
            $manager->persist($rdvAuj);

            if ($rdvAuj->getStatut() === 'Terminé') {
                $consult = new Consultation();
                $consult->setRendezVous($rdvAuj);
                $consult->setMotif($rdvAuj->getMotif());
                $consult->setSymptomes('Fatigue persistante, essoufflement modéré');
                $consult->setDiagnostic('Examen clinique normal, contrôle des constantes satisfaisant');
                $consult->setNotes('Patient rassuré, plan de surveillance annuel');
                $consult->setTension(12.7);
                $consult->setPoids(72.5);
                $consult->setTemperature(36.8);
                $manager->persist($consult);

                $ordo = new Ordonnance();
                $ordo->setRendezVous($rdvAuj);
                $ordo->setConsultation($consult);
                $ordo->setDate(clone $today);
                $ordo->setMedicaments("1. Paracétamol 1000mg (1 comprimé 3x/jour si douleur)\n2. Magnésium B6 (1 comprimé matin et soir, 1 mois)");
                $ordo->setDescription("Bien s'hydrater. Repos recommandé.");
                $manager->persist($ordo);

                $facture = new Facture();
                $facture->setConsultation($consult);
                $facture->setMontant($rdvAuj->getMedecin()->getTarif() ?? 50.0);
                $facture->setModePaiement('carte');
                $facture->setStatut('paye');
                $facture->setDateFacture(clone $today);
                $facture->setNotes('Règlement CB sans contact');
                $manager->persist($facture);
            }
        }

        // Rendez-vous passés et futurs sur les 30 derniers jours
        for ($d = -15; $d <= 15; $d++) {
            if ($d === 0) continue; // sauté car déjà créé au-dessus
            $dateJour = (clone $today)->modify("$d days");
            // Ne pas mettre le weekend
            if (in_array((int)$dateJour->format('N'), [6, 7])) continue;

            $rdv = new RendezVous();
            $p = $patientEntities[abs($d) % count($patientEntities)];
            $m = $medecinEntities[(abs($d) + 1) % count($medecinEntities)];
            $rdv->setPatient($p);
            $rdv->setMedecin($m);
            $rdv->setDate($dateJour);
            $rdv->setHeure(new \DateTime($heures[abs($d) % count($heures)]));
            $rdv->setMotif('Contrôle régulier et vérification');

            if ($d < 0) {
                // Passé : Terminé ou Absent
                $rdv->setStatut($d % 5 === 0 ? 'Absent' : 'Terminé');
            } else {
                // Futur : Confirmé ou En attente
                $rdv->setStatut($d % 2 === 0 ? 'Confirmé' : 'En attente');
            }
            $manager->persist($rdv);

            if ($rdv->getStatut() === 'Terminé') {
                $consult = new Consultation();
                $consult->setRendezVous($rdv);
                $consult->setMotif($rdv->getMotif());
                $consult->setSymptomes('Symptômes légers ou bilan de routine');
                $consult->setDiagnostic('État de santé stable');
                $consult->setNotes('Pas d\'anomalie détectée.');
                $consult->setTension(12.0 + ($d % 3) * 0.5);
                $consult->setPoids(68.0 + ($d % 10));
                $consult->setTemperature(37.0);
                $consult->setDateConsultation(clone $dateJour);
                $manager->persist($consult);

                if (abs($d) % 2 === 0) {
                    $ordo = new Ordonnance();
                    $ordo->setRendezVous($rdv);
                    $ordo->setConsultation($consult);
                    $ordo->setDate(clone $dateJour);
                    $ordo->setMedicaments("1. Amoxicilline 500mg (matin et soir pendant 6 jours)\n2. Probiotiques intestinaux");
                    $ordo->setDescription("Prise au cours des repas.");
                    $manager->persist($ordo);
                }

                $facture = new Facture();
                $facture->setConsultation($consult);
                $facture->setMontant($m->getTarif() ?? 45.0);
                $facture->setModePaiement(abs($d) % 2 === 0 ? 'carte' : 'especes');
                $facture->setStatut(abs($d) % 4 === 0 ? 'impaye' : 'paye');
                $facture->setDateFacture(clone $dateJour);
                $manager->persist($facture);
            }
        }

        // 5. INTERVENTIONS CHIRURGICALES (Fixées par le Docteur ou la Secrétaire)
        $chirurgiens = array_filter($medecinEntities, fn($m) => str_contains($m->getSpecialite(), 'Chirurgien') || str_contains($m->getSpecialite(), 'Neurochirurgien'));
        $chirurgiens = array_values($chirurgiens);

        if (count($chirurgiens) > 0 && count($patientEntities) > 0) {
            $interventions = [
                [
                    'patient' => $patientEntities[0],
                    'chirurgien' => $chirurgiens[0],
                    'titre' => 'Reconstruction du ligament croisé antérieur (LCA genou droit)',
                    'date' => (new \DateTime('+2 days')),
                    'heure' => new \DateTime('08:30:00'),
                    'duree' => 90,
                    'salle' => 'Bloc Opératoire 1 (Orthopédie)',
                    'anesthesie' => 'Rachianesthésie',
                    'statut' => 'Programmée',
                    'fixePar' => 'Dr. Alexandre Martin (Chirurgien)',
                    'notes' => 'Bilan pré-opératoire et consultation d\'anesthésie validés. À jeun strict dès 00h00.',
                ],
                [
                    'patient' => $patientEntities[1],
                    'chirurgien' => $chirurgiens[1] ?? $chirurgiens[0],
                    'titre' => 'Cholécystectomie par cœlioscopie (Ablation vésicule biliaire)',
                    'date' => (new \DateTime('+3 days')),
                    'heure' => new \DateTime('10:30:00'),
                    'duree' => 60,
                    'salle' => 'Bloc Opératoire 2 (Ambulatoire)',
                    'anesthesie' => 'Générale',
                    'statut' => 'Programmée',
                    'fixePar' => 'Sophie Martin (Secrétaire Médicale)',
                    'notes' => 'Programmée à la demande du patient après validation du dossier anesthésique.',
                ],
                [
                    'patient' => $patientEntities[2],
                    'chirurgien' => $chirurgiens[2] ?? $chirurgiens[0],
                    'titre' => 'Pontage aorto-coronarien double greffe',
                    'date' => (new \DateTime('+5 days')),
                    'heure' => new \DateTime('07:45:00'),
                    'duree' => 180,
                    'salle' => 'Bloc 3 (Cardiovasculaire & CEC)',
                    'anesthesie' => 'Générale',
                    'statut' => 'Programmée',
                    'fixePar' => 'Dr. Karim Mansouri (Chirurgien)',
                    'notes' => 'Patient hospitalisé la veille en unité de soins intensifs cardiologiques.',
                ],
            ];

            foreach ($interventions as $item) {
                $chir = new Chirurgie();
                $chir->setPatient($item['patient']);
                $chir->setChirurgien($item['chirurgien']);
                $chir->setTitreIntervention($item['titre']);
                $chir->setDateIntervention($item['date']);
                $chir->setHeureDebut($item['heure']);
                $chir->setDureeMinutes($item['duree']);
                $chir->setSalleOperation($item['salle']);
                $chir->setTypeAnesthesie($item['anesthesie']);
                $chir->setStatut($item['statut']);
                $chir->setFixePar($item['fixePar']);
                $chir->setNotesPreoperatoires($item['notes']);
                $manager->persist($chir);
            }
        }

        $manager->flush();
    }
}
