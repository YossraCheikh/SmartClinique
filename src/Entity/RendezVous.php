<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\RendezVousRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(uriTemplate: '/rendez-vous'),
        new Get(uriTemplate: '/rendez-vous/{id}'),
        new Post(uriTemplate: '/rendez-vous'),
        new Put(uriTemplate: '/rendez-vous/{id}'),
        new Patch(uriTemplate: '/rendez-vous/{id}'),
        new Delete(uriTemplate: '/rendez-vous/{id}'),
    ],
    normalizationContext: ['groups' => ['rendezvous:read']],
    denormalizationContext: ['groups' => ['rendezvous:write']],
)]
#[ORM\Entity(repositoryClass: RendezVousRepository::class)]
class RendezVous
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['rendezvous:read', 'ordonnance:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La date est obligatoire')]
    #[Groups(['rendezvous:read', 'rendezvous:write', 'ordonnance:read'])]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    #[Assert\NotBlank(message: "L'heure est obligatoire")]
    #[Groups(['rendezvous:read', 'rendezvous:write'])]
    private ?\DateTimeInterface $heure = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le motif est obligatoire')]
    #[Groups(['rendezvous:read', 'rendezvous:write'])]
    private ?string $motif = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'Le statut est obligatoire')]
    #[Groups(['rendezvous:read', 'rendezvous:write'])]
    private ?string $statut = 'En attente';

    #[ORM\ManyToOne(inversedBy: 'rendezVous')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotBlank(message: 'Le patient est obligatoire')]
    #[Groups(['rendezvous:read', 'rendezvous:write', 'ordonnance:read'])]
    private ?Patient $patient = null;

    #[ORM\ManyToOne(inversedBy: 'rendezVous')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotBlank(message: 'Le médecin est obligatoire')]
    #[Groups(['rendezvous:read', 'rendezvous:write', 'ordonnance:read'])]
    private ?Medecin $medecin = null;

    #[ORM\OneToOne(mappedBy: 'rendezVous', cascade: ['persist', 'remove'])]
    #[Groups(['rendezvous:read'])]
    private ?Ordonnance $ordonnance = null;

    /**
     * @var Collection<int, Consultation>
     */
    #[ORM\OneToMany(targetEntity: Consultation::class, mappedBy: 'rendezVous', cascade: ['persist', 'remove'])]
    #[Groups(['rendezvous:read'])]
    private Collection $consultations;

    public function __construct()
    {
        $this->consultations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getHeure(): ?\DateTimeInterface
    {
        return $this->heure;
    }

    public function setHeure(\DateTimeInterface $heure): static
    {
        $this->heure = $heure;
        return $this;
    }

    public function getMotif(): ?string
    {
        return $this->motif;
    }

    public function setMotif(string $motif): static
    {
        $this->motif = $motif;
        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getPatient(): ?Patient
    {
        return $this->patient;
    }

    public function setPatient(?Patient $patient): static
    {
        $this->patient = $patient;
        return $this;
    }

    public function getMedecin(): ?Medecin
    {
        return $this->medecin;
    }

    public function setMedecin(?Medecin $medecin): static
    {
        $this->medecin = $medecin;
        return $this;
    }

    public function getOrdonnance(): ?Ordonnance
    {
        return $this->ordonnance;
    }

    public function setOrdonnance(?Ordonnance $ordonnance): static
    {
        // unset the owning side of the relation if necessary
        if ($ordonnance === null && $this->ordonnance !== null) {
            $this->ordonnance->setRendezVous(null);
        }

        // set the owning side of the relation if necessary
        if ($ordonnance !== null && $ordonnance->getRendezVous() !== $this) {
            $ordonnance->setRendezVous($this);
        }

        $this->ordonnance = $ordonnance;
        return $this;
    }

    /**
     * @return Collection<int, Consultation>
     */
    public function getConsultations(): Collection
    {
        return $this->consultations;
    }

    public function addConsultation(Consultation $consultation): static
    {
        if (!$this->consultations->contains($consultation)) {
            $this->consultations->add($consultation);
            $consultation->setRendezVous($this);
        }
        return $this;
    }

    public function removeConsultation(Consultation $consultation): static
    {
        if ($this->consultations->removeElement($consultation)) {
            if ($consultation->getRendezVous() === $this) {
                $consultation->setRendezVous(null);
            }
        }
        return $this;
    }

    public function __toString(): string
    {
        return 'RDV #' . $this->id . ' - ' . ($this->date ? $this->date->format('d/m/Y') : '');
    }
}
