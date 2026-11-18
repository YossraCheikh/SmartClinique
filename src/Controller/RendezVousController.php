<?php

namespace App\Controller;

use App\Entity\RendezVous;
use App\Form\RendezVousType;
use App\Repository\RendezVousRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mime\Address;

#[Route('/rendez-vous')]
class RendezVousController extends AbstractController
{
    #[Route('/', name: 'app_rendez_vous_index', methods: ['GET'])]
    public function index(RendezVousRepository $rendezVousRepository): Response
    {
        return $this->render('rendez_vous/index.html.twig', [
            'rendez_vous' => $rendezVousRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_rendez_vous_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, MailerInterface $mailer): Response
    {
        $rendezVous = new RendezVous();
        $form = $this->createForm(RendezVousType::class, $rendezVous);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($rendezVous);
            $entityManager->flush();

            if ($rendezVous->getPatient() && $rendezVous->getPatient()->getEmail()) {
                $email = (new TemplatedEmail())
                    ->from(new Address('medecin@clinique.com', 'Clinique'))
                    ->to($rendezVous->getPatient()->getEmail())
                    ->subject('Confirmation de votre rendez-vous')
                    ->htmlTemplate('emails/rendez_vous_reminder.html.twig')
                    ->context([
                        'rendez_vous' => $rendezVous,
                    ]);

                try {
                    $mailer->send($email);
                } catch (\Exception $e) {
                    $this->addFlash('warning', 'Rendez-vous créé, mais l\'e-mail de confirmation n\'a pas pu être envoyé.');
                }
            }

            $this->addFlash('success', 'Rendez-vous créé avec succès !');
            return $this->redirectToRoute('app_rendez_vous_index');
        }

        return $this->render('rendez_vous/new.html.twig', [
            'rendez_vous' => $rendezVous,
            'form' => $form,
        ]);
    }

    #[Route('/{id}/consult', name: 'app_rendez_vous_consult', methods: ['GET'])]
    public function consult(RendezVous $rendezVous): Response
    {
        return $this->render('rendez_vous/consult.html.twig', [
            'rendez_vous' => $rendezVous,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_rendez_vous_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RendezVous $rendezVous, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(RendezVousType::class, $rendezVous);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Rendez-vous modifié avec succès !');
            return $this->redirectToRoute('app_rendez_vous_index');
        }

        return $this->render('rendez_vous/edit.html.twig', [
            'rendez_vous' => $rendezVous,
            'form' => $form,
        ]);
    }

    #[Route('/{id}/supp', name: 'app_rendez_vous_supp', methods: ['POST'])]
    public function supp(Request $request, RendezVous $rendezVous, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete' . $rendezVous->getId(), $request->request->get('_token'))) {
            $entityManager->remove($rendezVous);
            $entityManager->flush();
            $this->addFlash('success', 'Rendez-vous supprimé avec succès !');
        }

        return $this->redirectToRoute('app_rendez_vous_index');
    }
}
