<?php

namespace App\EventListener;

use App\Entity\Medecin;
use App\Entity\Patient;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsDoctrineListener(event: Events::prePersist)]
class UserSyncListener
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof Medecin) {
            $this->syncMedecinUser($entity, $args);
        } elseif ($entity instanceof Patient) {
            $this->syncPatientUser($entity, $args);
        }
    }

    private function syncMedecinUser(Medecin $medecin, PrePersistEventArgs $args): void
    {
        // Assurer que les disponibilités par défaut sont initialisées
        if ($medecin->getDisponibilites()->isEmpty()) {
            $medecin->initDefaultDisponibilites();
        }

        $email = trim($medecin->getEmail() ?? '');
        if (!$email) {
            return;
        }

        $em = $args->getObjectManager();
        $userRepo = $em->getRepository(User::class);
        $existing = $userRepo->findOneBy(['email' => $email]);

        if (!$existing) {
            $user = new User();
            $user->setEmail($email);
            $user->setNom($medecin->getNom());
            $user->setPrenom($medecin->getPrenom());
            $user->setTelephone($medecin->getTelephone());
            $user->setRoles(['ROLE_MEDECIN']);
            $user->setPassword($this->passwordHasher->hashPassword($user, 'password'));
            $em->persist($user);
        }
    }

    private function syncPatientUser(Patient $patient, PrePersistEventArgs $args): void
    {
        // Assurer un numéro de dossier
        if (!$patient->getNumeroDossier()) {
            $patient->setNumeroDossier('DOS-' . strtoupper(substr(uniqid(), -6)));
        }

        $email = trim($patient->getEmail() ?? '');
        if (!$email) {
            return;
        }

        $em = $args->getObjectManager();
        $userRepo = $em->getRepository(User::class);
        $existing = $userRepo->findOneBy(['email' => $email]);

        if (!$existing) {
            $user = new User();
            $user->setEmail($email);
            $user->setNom($patient->getNom());
            $user->setPrenom($patient->getPrenom());
            $user->setTelephone($patient->getTelephone());
            $user->setRoles(['ROLE_PATIENT']);
            $user->setPassword($this->passwordHasher->hashPassword($user, 'password'));
            $em->persist($user);
        }
    }
}
