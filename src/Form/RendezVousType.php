<?php

namespace App\Form;

use App\Entity\Medecin;
use App\Entity\Patient;
use App\Entity\RendezVous;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TimeType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class RendezVousType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('date', DateType::class, [
                'label' => 'Date',
                'widget' => 'single_text',
                'attr' => ['class' => 'form-control']
            ])
            ->add('heure', TimeType::class, [
                'label' => 'Heure',
                'widget' => 'single_text',
                'attr' => ['class' => 'form-control']
            ])
            ->add('motif', TextType::class, [
                'label' => 'Motif',
                'attr' => ['class' => 'form-control', 'placeholder' => 'Motif du rendez-vous']
            ])
            ->add('statut', ChoiceType::class, [
                'label' => 'Statut',
                'choices' => [
                    'En attente' => 'En attente',
                    'Confirmé' => 'Confirmé',
                    'Annulé' => 'Annulé',
                    'Terminé' => 'Terminé',
                ],
                'attr' => ['class' => 'form-control']
            ])
            ->add('patient', EntityType::class, [
                'class' => Patient::class,
                'label' => 'Patient',
                'placeholder' => 'Sélectionner un patient',
                'attr' => ['class' => 'form-control']
            ])
            ->add('medecin', EntityType::class, [
                'class' => Medecin::class,
                'label' => 'Médecin',
                'placeholder' => 'Sélectionner un médecin',
                'attr' => ['class' => 'form-control']
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => RendezVous::class,
        ]);
    }
}
