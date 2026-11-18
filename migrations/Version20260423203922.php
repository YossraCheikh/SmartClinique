<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260423203922 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE medecin ADD COLUMN image VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__medecin AS SELECT id, nom, prenom, specialite, telephone, email, disponibilite FROM medecin');
        $this->addSql('DROP TABLE medecin');
        $this->addSql('CREATE TABLE medecin (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, prenom VARCHAR(100) NOT NULL, specialite VARCHAR(100) NOT NULL, telephone VARCHAR(20) NOT NULL, email VARCHAR(180) NOT NULL, disponibilite VARCHAR(50) DEFAULT NULL)');
        $this->addSql('INSERT INTO medecin (id, nom, prenom, specialite, telephone, email, disponibilite) SELECT id, nom, prenom, specialite, telephone, email, disponibilite FROM __temp__medecin');
        $this->addSql('DROP TABLE __temp__medecin');
    }
}
