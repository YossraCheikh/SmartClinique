<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use App\Repository\ConsultationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(),
        new Put(),
        new Patch(),
        new Delete(),
    ],
    normalizationContext: ['groups' => ['consultation:read']],
    denormalizationContext: ['groups' => ['consultation:write']],
)]
#[ORM\Entity(repositoryClass: ConsultationRepository::class)]
class Consultation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['consultation:read', 'ordonnance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: RendezVous::class, inversedBy: 'consultations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?RendezVous $rendezVous = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?string $motif = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?string $symptomes = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?string $diagnostic = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?string $notes = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?float $tension = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?float $poids = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?float $temperature = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['consultation:read', 'consultation:write'])]
    private ?\DateTimeInterface $dateConsultation = null;

    public function __construct()
    {
        $this->dateConsultation = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getRendezVous(): ?RendezVous { return $this->rendezVous; }
    public function setRendezVous(?RendezVous $rendezVous): static { $this->rendezVous = $rendezVous; return $this; }

    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $motif): static { $this->motif = $motif; return $this; }

    public function getSymptomes(): ?string { return $this->symptomes; }
    public function setSymptomes(?string $symptomes): static { $this->symptomes = $symptomes; return $this; }

    public function getDiagnostic(): ?string { return $this->diagnostic; }
    public function setDiagnostic(?string $diagnostic): static { $this->diagnostic = $diagnostic; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getTension(): ?float { return $this->tension; }
    public function setTension(?float $tension): static { $this->tension = $tension; return $this; }

    public function getPoids(): ?float { return $this->poids; }
    public function setPoids(?float $poids): static { $this->poids = $poids; return $this; }

    public function getTemperature(): ?float { return $this->temperature; }
    public function setTemperature(?float $temperature): static { $this->temperature = $temperature; return $this; }

    public function getDateConsultation(): ?\DateTimeInterface { return $this->dateConsultation; }
    public function setDateConsultation(\DateTimeInterface $dateConsultation): static { $this->dateConsultation = $dateConsultation; return $this; }
}
