<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\ChirurgieRepository;
use Doctrine\DBAL\Types\Types;
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
    normalizationContext: ['groups' => ['chirurgie:read']],
    denormalizationContext: ['groups' => ['chirurgie:write']],
)]
#[ORM\Entity(repositoryClass: ChirurgieRepository::class)]
class Chirurgie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['chirurgie:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le patient est obligatoire')]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?Patient $patient = null;

    #[ORM\ManyToOne(targetEntity: Medecin::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le chirurgien est obligatoire')]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?Medecin $chirurgien = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "L'intitulé de l'intervention est obligatoire")]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?string $titreIntervention = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\NotNull(message: 'La date de chirurgie est obligatoire')]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?\DateTimeInterface $dateIntervention = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    #[Assert\NotNull(message: "L'heure de début est obligatoire")]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?\DateTimeInterface $heureDebut = null;

    #[ORM\Column(type: 'integer')]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private int $dureeMinutes = 60;

    #[ORM\Column(length: 100)]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private string $salleOperation = 'Bloc Opératoire 1';

    #[ORM\Column(length: 50)]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private string $typeAnesthesie = 'Générale';

    #[ORM\Column(length: 50)]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private string $statut = 'Programmée'; // Programmée, En cours, Terminée, Reportée, Annulée

    #[ORM\Column(length: 150)]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private string $fixePar = 'Docteur'; // Fixée par le Docteur ou la Secrétaire

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['chirurgie:read', 'chirurgie:write'])]
    private ?string $notesPreoperatoires = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['chirurgie:read'])]
    private ?\DateTimeInterface $dateCreation = null;

    public function __construct()
    {
        $this->dateCreation = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getChirurgien(): ?Medecin
    {
        return $this->chirurgien;
    }

    public function setChirurgien(?Medecin $chirurgien): static
    {
        $this->chirurgien = $chirurgien;
        return $this;
    }

    public function getTitreIntervention(): ?string
    {
        return $this->titreIntervention;
    }

    public function setTitreIntervention(string $titreIntervention): static
    {
        $this->titreIntervention = $titreIntervention;
        return $this;
    }

    public function getDateIntervention(): ?\DateTimeInterface
    {
        return $this->dateIntervention;
    }

    public function setDateIntervention(\DateTimeInterface $dateIntervention): static
    {
        $this->dateIntervention = $dateIntervention;
        return $this;
    }

    public function getHeureDebut(): ?\DateTimeInterface
    {
        return $this->heureDebut;
    }

    public function setHeureDebut(\DateTimeInterface $heureDebut): static
    {
        $this->heureDebut = $heureDebut;
        return $this;
    }

    public function getDureeMinutes(): int
    {
        return $this->dureeMinutes;
    }

    public function setDureeMinutes(int $dureeMinutes): static
    {
        $this->dureeMinutes = $dureeMinutes;
        return $this;
    }

    public function getSalleOperation(): string
    {
        return $this->salleOperation;
    }

    public function setSalleOperation(string $salleOperation): static
    {
        $this->salleOperation = $salleOperation;
        return $this;
    }

    public function getTypeAnesthesie(): string
    {
        return $this->typeAnesthesie;
    }

    public function setTypeAnesthesie(string $typeAnesthesie): static
    {
        $this->typeAnesthesie = $typeAnesthesie;
        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getFixePar(): string
    {
        return $this->fixePar;
    }

    public function setFixePar(string $fixePar): static
    {
        $this->fixePar = $fixePar;
        return $this;
    }

    public function getNotesPreoperatoires(): ?string
    {
        return $this->notesPreoperatoires;
    }

    public function setNotesPreoperatoires(?string $notesPreoperatoires): static
    {
        $this->notesPreoperatoires = $notesPreoperatoires;
        return $this;
    }

    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function setDateCreation(?\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }
}
