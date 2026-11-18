<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use App\Repository\FactureRepository;
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
    normalizationContext: ['groups' => ['facture:read']],
    denormalizationContext: ['groups' => ['facture:write']],
)]
#[ORM\Entity(repositoryClass: FactureRepository::class)]
class Facture
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['facture:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Consultation::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['facture:read', 'facture:write'])]
    private ?Consultation $consultation = null;

    #[ORM\Column(type: 'float')]
    #[Groups(['facture:read', 'facture:write'])]
    private ?float $montant = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['facture:read', 'facture:write'])]
    private ?string $modePaiement = null; // especes, carte, virement

    #[ORM\Column(length: 20)]
    #[Groups(['facture:read', 'facture:write'])]
    private string $statut = 'impaye'; // paye, partiel, impaye

    #[ORM\Column(type: 'datetime')]
    #[Groups(['facture:read', 'facture:write'])]
    private ?\DateTimeInterface $dateFacture = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['facture:read', 'facture:write'])]
    private ?string $notes = null;

    public function __construct()
    {
        $this->dateFacture = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getConsultation(): ?Consultation { return $this->consultation; }
    public function setConsultation(?Consultation $consultation): static { $this->consultation = $consultation; return $this; }

    public function getMontant(): ?float { return $this->montant; }
    public function setMontant(float $montant): static { $this->montant = $montant; return $this; }

    public function getModePaiement(): ?string { return $this->modePaiement; }
    public function setModePaiement(?string $modePaiement): static { $this->modePaiement = $modePaiement; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getDateFacture(): ?\DateTimeInterface { return $this->dateFacture; }
    public function setDateFacture(\DateTimeInterface $dateFacture): static { $this->dateFacture = $dateFacture; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }
}
