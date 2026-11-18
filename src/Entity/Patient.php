<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\PatientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
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
    normalizationContext: ['groups' => ['patient:read']],
    denormalizationContext: ['groups' => ['patient:write']],
)]
#[ORM\Entity(repositoryClass: PatientRepository::class)]
class Patient
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['patient:read', 'rendezvous:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 20, unique: true, nullable: true)]
    #[Groups(['patient:read', 'patient:write', 'rendezvous:read'])]
    private ?string $numeroDossier = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire')]
    #[Groups(['patient:read', 'patient:write', 'rendezvous:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire')]
    #[Groups(['patient:read', 'patient:write', 'rendezvous:read'])]
    private ?string $prenom = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?\DateTimeInterface $dateNaissance = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?string $sexe = null; // M, F

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Le téléphone est obligatoire')]
    #[Groups(['patient:read', 'patient:write', 'rendezvous:read'])]
    private ?string $telephone = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: "L'email est obligatoire")]
    #[Assert\Email(message: "L'email n'est pas valide")]
    #[Groups(['patient:read', 'patient:write', 'rendezvous:read'])]
    private ?string $email = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?string $adresse = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?string $groupeSanguin = null; // A+, A-, B+, B-, AB+, AB-, O+, O-

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?string $allergies = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    private ?string $antecedents = null;

    /**
     * @var Collection<int, RendezVous>
     */
    #[ORM\OneToMany(targetEntity: RendezVous::class, mappedBy: 'patient', orphanRemoval: true)]
    private Collection $rendezVous;

    /**
     * @var Collection<int, Document>
     */
    #[ORM\OneToMany(targetEntity: Document::class, mappedBy: 'patient', orphanRemoval: true)]
    #[Groups(['patient:read'])]
    private Collection $documents;

    public function __construct()
    {
        $this->rendezVous = new ArrayCollection();
        $this->documents = new ArrayCollection();
        $this->numeroDossier = 'DOS-' . strtoupper(substr(uniqid(), -6));
    }

    public function getId(): ?int { return $this->id; }

    public function getNumeroDossier(): ?string { return $this->numeroDossier; }
    public function setNumeroDossier(?string $numeroDossier): static { $this->numeroDossier = $numeroDossier; return $this; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }

    public function getDateNaissance(): ?\DateTimeInterface { return $this->dateNaissance; }
    public function setDateNaissance(?\DateTimeInterface $dateNaissance): static { $this->dateNaissance = $dateNaissance; return $this; }

    public function getSexe(): ?string { return $this->sexe; }
    public function setSexe(?string $sexe): static { $this->sexe = $sexe; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }

    public function getGroupeSanguin(): ?string { return $this->groupeSanguin; }
    public function setGroupeSanguin(?string $groupeSanguin): static { $this->groupeSanguin = $groupeSanguin; return $this; }

    public function getAllergies(): ?string { return $this->allergies; }
    public function setAllergies(?string $allergies): static { $this->allergies = $allergies; return $this; }

    public function getAntecedents(): ?string { return $this->antecedents; }
    public function setAntecedents(?string $antecedents): static { $this->antecedents = $antecedents; return $this; }

    /** @return Collection<int, RendezVous> */
    public function getRendezVous(): Collection { return $this->rendezVous; }

    public function addRendezVous(RendezVous $rendezVous): static
    {
        if (!$this->rendezVous->contains($rendezVous)) {
            $this->rendezVous->add($rendezVous);
            $rendezVous->setPatient($this);
        }
        return $this;
    }

    public function removeRendezVous(RendezVous $rendezVous): static
    {
        if ($this->rendezVous->removeElement($rendezVous)) {
            if ($rendezVous->getPatient() === $this) {
                $rendezVous->setPatient(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Document>
     */
    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setPatient($this);
        }
        return $this;
    }

    public function removeDocument(Document $document): static
    {
        if ($this->documents->removeElement($document)) {
            if ($document->getPatient() === $this) {
                $document->setPatient(null);
            }
        }
        return $this;
    }

    public function __toString(): string
    {
        return $this->nom . ' ' . $this->prenom;
    }
}
