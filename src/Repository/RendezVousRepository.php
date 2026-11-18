<?php

namespace App\Repository;

use App\Entity\RendezVous;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RendezVous>
 */
class RendezVousRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RendezVous::class);
    }

    /**
     * Find today's appointments — uses raw date string to bypass Doctrine DateType conversion
     */
    public function findTodayAppointments(): array
    {
        $today = (new \DateTime())->format('Y-m-d');
        return $this->createQueryBuilder('r')
            ->andWhere('r.date = :today')
            ->setParameter('today', $today)
            ->leftJoin('r.patient', 'p')
            ->addSelect('p')
            ->leftJoin('r.medecin', 'm')
            ->addSelect('m')
            ->orderBy('r.heure', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find appointments by date
     */
    public function findByDate(\DateTime $date): array
    {
        $dateStr = $date->format('Y-m-d');
        return $this->createQueryBuilder('r')
            ->andWhere('r.date = :date')
            ->setParameter('date', $dateStr)
            ->leftJoin('r.patient', 'p')
            ->addSelect('p')
            ->leftJoin('r.medecin', 'm')
            ->addSelect('m')
            ->orderBy('r.heure', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find appointments for a specific doctor and date — avoids DateType conversion issues with SQLite
     */
    public function findByMedecinAndDate(\App\Entity\Medecin $medecin, string $dateStr): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.medecin = :medecin')
            ->andWhere('r.date = :date')
            ->setParameter('medecin', $medecin)
            ->setParameter('date', $dateStr)
            ->getQuery()
            ->getResult();
    }
}
