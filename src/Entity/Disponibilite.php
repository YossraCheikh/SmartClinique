<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use App\Repository\DisponibiliteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(),
        new Put(),
        new Patch(),
        new Delete(),
    ],
    normalizationContext: ['groups' => ['disponibilite:read']],
    denormalizationContext: ['groups' => ['disponibilite:write']],
)]
#[ORM\Entity(repositoryClass: DisponibiliteRepository::class)]
class Disponibilite
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['disponibilite:read', 'medecin:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Medecin::class, inversedBy: 'disponibilites')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['disponibilite:read', 'disponibilite:write'])]
    private ?Medecin $medecin = null;

    #[ORM\Column(length: 10)]
    #[Groups(['disponibilite:read', 'disponibilite:write', 'medecin:read'])]
    private ?string $jourSemaine = null; // lundi, mardi, mercredi, jeudi, vendredi, samedi

    #[ORM\Column(type: 'time')]
    #[Groups(['disponibilite:read', 'disponibilite:write', 'medecin:read'])]
    private ?\DateTimeInterface $heureDebut = null;

    #[ORM\Column(type: 'time')]
    #[Groups(['disponibilite:read', 'disponibilite:write', 'medecin:read'])]
    private ?\DateTimeInterface $heureFin = null;

    public function getId(): ?int { return $this->id; }

    public function getMedecin(): ?Medecin { return $this->medecin; }
    public function setMedecin(?Medecin $medecin): static { $this->medecin = $medecin; return $this; }

    public function getJourSemaine(): ?string { return $this->jourSemaine; }
    public function setJourSemaine(string $jourSemaine): static { $this->jourSemaine = $jourSemaine; return $this; }

    public function getHeureDebut(): ?\DateTimeInterface { return $this->heureDebut; }
    public function setHeureDebut(\DateTimeInterface $heureDebut): static { $this->heureDebut = $heureDebut; return $this; }

    public function getHeureFin(): ?\DateTimeInterface { return $this->heureFin; }
    public function setHeureFin(\DateTimeInterface $heureFin): static { $this->heureFin = $heureFin; return $this; }
}
