<?php

namespace App\Controller\Api;

use App\Repository\MedecinRepository;
use App\Repository\OrdonnanceRepository;
use App\Repository\PatientRepository;
use App\Repository\RendezVousRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class DashboardApiController extends AbstractController
{
    #[Route('/dashboard/stats', name: 'api_dashboard_stats', methods: ['GET'])]
    public function stats(
        PatientRepository $patientRepository,
        MedecinRepository $medecinRepository,
        RendezVousRepository $rendezVousRepository,
        OrdonnanceRepository $ordonnanceRepository,
    ): JsonResponse {
        $totalPatients = $patientRepository->count([]);
        $totalMedecins = $medecinRepository->count([]);
        $totalOrdonnances = $ordonnanceRepository->count([]);
        $totalRdv = $rendezVousRepository->count([]);
        $rdvDuJour = $rendezVousRepository->findTodayAppointments();

        $tousLesRdv = $rendezVousRepository->findAll();

        $currentMonth = (new \DateTime())->format('m');
        $currentYear = (new \DateTime())->format('Y');
        $daysInMonth = (int)(new \DateTime())->format('t');

        // Stats for Area Chart (RDV par jour pour le mois en cours)
        $rdvParJour = array_fill(1, $daysInMonth, 0);

        // Stats for Pie Chart (RDV par statut)
        $rdvParStatut = [
            'Confirmé' => 0,
            'En attente' => 0,
            'Annulé' => 0,
        ];

        foreach ($tousLesRdv as $rdv) {
            $statut = $rdv->getStatut();
            if (array_key_exists($statut, $rdvParStatut)) {
                $rdvParStatut[$statut]++;
            } else {
                $rdvParStatut[$statut] = 1;
            }

            if ($rdv->getDate() && $rdv->getDate()->format('Y-m') === "$currentYear-$currentMonth") {
                $jour = (int)$rdv->getDate()->format('j');
                $rdvParJour[$jour]++;
            }
        }

        // Serialize today's appointments
        $rdvDuJourData = array_map(function ($rdv) {
            return [
                'id' => $rdv->getId(),
                'date' => $rdv->getDate()?->format('Y-m-d'),
                'heure' => $rdv->getHeure()?->format('H:i'),
                'motif' => $rdv->getMotif(),
                'statut' => $rdv->getStatut(),
                'patient' => $rdv->getPatient() ? [
                    'id' => $rdv->getPatient()->getId(),
                    'nom' => $rdv->getPatient()->getNom(),
                    'prenom' => $rdv->getPatient()->getPrenom(),
                ] : null,
                'medecin' => $rdv->getMedecin() ? [
                    'id' => $rdv->getMedecin()->getId(),
                    'nom' => $rdv->getMedecin()->getNom(),
                    'prenom' => $rdv->getMedecin()->getPrenom(),
                    'specialite' => $rdv->getMedecin()->getSpecialite(),
                ] : null,
            ];
        }, $rdvDuJour);

        return $this->json([
            'totalPatients' => $totalPatients,
            'totalMedecins' => $totalMedecins,
            'totalOrdonnances' => $totalOrdonnances,
            'totalRdv' => $totalRdv,
            'rdvDuJour' => $rdvDuJourData,
            'chartLabelsJours' => range(1, $daysInMonth),
            'chartDataJours' => array_values($rdvParJour),
            'chartLabelsStatut' => array_keys($rdvParStatut),
            'chartDataStatut' => array_values($rdvParStatut),
        ]);
    }
}
