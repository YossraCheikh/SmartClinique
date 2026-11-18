<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\MedecinRepository;
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
    normalizationContext: ['groups' => ['medecin:read']],
    denormalizationContext: ['groups' => ['medecin:write']],
)]
#[ORM\Entity(repositoryClass: MedecinRepository::class)]
class Medecin
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['medecin:read', 'rendezvous:read', 'disponibilite:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire')]
    #[Groups(['medecin:read', 'medecin:write', 'rendezvous:read', 'disponibilite:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire')]
    #[Groups(['medecin:read', 'medecin:write', 'rendezvous:read', 'disponibilite:read'])]
    private ?string $prenom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'La spécialité est obligatoire')]
    #[Groups(['medecin:read', 'medecin:write', 'rendezvous:read', 'disponibilite:read'])]
    private ?string $specialite = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Le téléphone est obligatoire')]
    #[Groups(['medecin:read', 'medecin:write'])]
    private ?string $telephone = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: "L'email est obligatoire")]
    #[Assert\Email(message: "L'email n'est pas valide")]
    #[Groups(['medecin:read', 'medecin:write'])]
    private ?string $email = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['medecin:read', 'medecin:write'])]
    private ?float $tarif = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['medecin:read', 'medecin:write'])]
    private ?int $dureeConsultation = 30; // en minutes

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['medecin:read', 'medecin:write', 'rendezvous:read'])]
    private ?string $image = null;

    /**
     * @var Collection<int, RendezVous>
     */
    #[ORM\OneToMany(targetEntity: RendezVous::class, mappedBy: 'medecin', orphanRemoval: true)]
    private Collection $rendezVous;

    /**
     * @var Collection<int, Disponibilite>
     */
    #[ORM\OneToMany(targetEntity: Disponibilite::class, mappedBy: 'medecin', orphanRemoval: true, cascade: ['persist', 'remove'])]
    #[Groups(['medecin:read'])]
    private Collection $disponibilites;

    public function __construct()
    {
        $this->rendezVous = new ArrayCollection();
        $this->disponibilites = new ArrayCollection();
        $this->initDefaultDisponibilites();
    }

    public function initDefaultDisponibilites(): void
    {
        if (!$this->disponibilites->isEmpty()) {
            return;
        }
        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        foreach ($jours as $j) {
            $dispMatin = new Disponibilite();
            $dispMatin->setJourSemaine($j);
            $dispMatin->setHeureDebut(new \DateTime('08:30:00'));
            $dispMatin->setHeureFin(new \DateTime('12:30:00'));
            $this->addDisponibilite($dispMatin);

            $dispAprem = new Disponibilite();
            $dispAprem->setJourSemaine($j);
            $dispAprem->setHeureDebut(new \DateTime('14:00:00'));
            $dispAprem->setHeureFin(new \DateTime('18:00:00'));
            $this->addDisponibilite($dispAprem);
        }
    }

    public function getId(): ?int { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }

    public function getSpecialite(): ?string { return $this->specialite; }
    public function setSpecialite(string $specialite): static { $this->specialite = $specialite; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getTarif(): ?float { return $this->tarif; }
    public function setTarif(?float $tarif): static { $this->tarif = $tarif; return $this; }

    public function getDureeConsultation(): ?int { return $this->dureeConsultation; }
    public function setDureeConsultation(?int $dureeConsultation): static { $this->dureeConsultation = $dureeConsultation; return $this; }

    public function getImage(): ?string { return $this->image; }
    public function setImage(?string $image): static { $this->image = $image; return $this; }

    /** @return Collection<int, RendezVous> */
    public function getRendezVous(): Collection { return $this->rendezVous; }

    public function addRendezVous(RendezVous $rendezVous): static
    {
        if (!$this->rendezVous->contains($rendezVous)) {
            $this->rendezVous->add($rendezVous);
            $rendezVous->setMedecin($this);
        }
        return $this;
    }

    public function removeRendezVous(RendezVous $rendezVous): static
    {
        if ($this->rendezVous->removeElement($rendezVous)) {
            if ($rendezVous->getMedecin() === $this) {
                $rendezVous->setMedecin(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, Disponibilite> */
    public function getDisponibilites(): Collection { return $this->disponibilites; }

    public function addDisponibilite(Disponibilite $disponibilite): static
    {
        if (!$this->disponibilites->contains($disponibilite)) {
            $this->disponibilites->add($disponibilite);
            $disponibilite->setMedecin($this);
        }
        return $this;
    }

    public function removeDisponibilite(Disponibilite $disponibilite): static
    {
        if ($this->disponibilites->removeElement($disponibilite)) {
            if ($disponibilite->getMedecin() === $this) {
                $disponibilite->setMedecin(null);
            }
        }
        return $this;
    }

    #[Groups(['medecin:read'])]
    public function getDisponibilite(): string
    {
        if ($this->disponibilites->isEmpty()) {
            return 'Sur rendez-vous (Lun-Ven 09:00 - 17:00)';
        }
        $parts = [];
        foreach ($this->disponibilites as $d) {
            $hDeb = $d->getHeureDebut() ? $d->getHeureDebut()->format('H:i') : '09:00';
            $hFin = $d->getHeureFin() ? $d->getHeureFin()->format('H:i') : '17:00';
            $parts[] = ucfirst((string)$d->getJourSemaine()) . ' ' . $hDeb . '-' . $hFin;
        }
        return implode(', ', $parts);
    }

    #[Groups(['medecin:write'])]
    public function setDisponibilite(?string $disp): static
    {
        // Allowed for write compatibility from API/frontend
        return $this;
    }

    public function getFullName(): string
    {
        return 'Dr. ' . $this->prenom . ' ' . $this->nom;
    }

    public function __toString(): string
    {
        return 'Dr. ' . $this->nom . ' ' . $this->prenom . ' (' . $this->specialite . ')';
    }
}
