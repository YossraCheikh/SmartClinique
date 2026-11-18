<?php

namespace App\Controller;

use App\Repository\MedecinRepository;
use App\Repository\OrdonnanceRepository;
use App\Repository\PatientRepository;
use App\Repository\RendezVousRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'app_dashboard')]
    public function index(
        PatientRepository $patientRepository,
        MedecinRepository $medecinRepository,
        RendezVousRepository $rendezVousRepository,
        OrdonnanceRepository $ordonnanceRepository
    ): Response {
        $totalPatients = $patientRepository->count([]);
        $totalMedecins = $medecinRepository->count([]);
        $totalOrdonnances = $ordonnanceRepository->count([]);
        $rdvDuJour = $rendezVousRepository->findTodayAppointments();
        $totalRdv = $rendezVousRepository->count([]);

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
            'Annulé' => 0
        ];
        
        foreach ($tousLesRdv as $rdv) {
            // Group by status
            $statut = $rdv->getStatut();
            if (array_key_exists($statut, $rdvParStatut)) {
                $rdvParStatut[$statut]++;
            } else {
                $rdvParStatut[$statut] = 1;
            }

            // Group by day (for current month and year)
            if ($rdv->getDate() && $rdv->getDate()->format('Y-m') === "$currentYear-$currentMonth") {
                $jour = (int)$rdv->getDate()->format('j'); // 1 to 31
                $rdvParJour[$jour]++;
            }
        }

        return $this->render('dashboard/index.html.twig', [
            'totalPatients' => $totalPatients,
            'totalMedecins' => $totalMedecins,
            'totalOrdonnances' => $totalOrdonnances,
            'totalRdv' => $totalRdv,
            'rdvDuJour' => $rdvDuJour,
            'chartLabelsJours' => range(1, $daysInMonth),
            'chartDataJours' => array_values($rdvParJour),
            'chartLabelsStatut' => array_keys($rdvParStatut),
            'chartDataStatut' => array_values($rdvParStatut),
        ]);
    }
}
