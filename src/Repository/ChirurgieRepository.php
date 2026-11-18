<?php

namespace App\Repository;

use App\Entity\Chirurgie;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Chirurgie>
 */
class ChirurgieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Chirurgie::class);
    }

    /**
     * @return Chirurgie[]
     */
    public function findByDate(\DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.dateIntervention = :date')
            ->setParameter('date', $date->format('Y-m-d'))
            ->orderBy('c.heureDebut', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
