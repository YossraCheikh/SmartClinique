<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api')]
class UploadController extends AbstractController
{
    #[Route('/upload', name: 'api_upload', methods: ['POST'])]
    public function upload(Request $request, SluggerInterface $slugger): JsonResponse
    {
        $file = $request->files->get('file') ?? $request->files->get('image');

        if (!$file) {
            return $this->json(['error' => 'Aucun fichier fourni.'], 400);
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $slugger->slug($originalFilename);
        $newFilename = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

        try {
            $uploadDir = $this->getParameter('medecin_photos_directory');
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $file->move($uploadDir, $newFilename);
        } catch (FileException $e) {
            return $this->json(['error' => 'Erreur lors de l\'enregistrement du fichier.'], 500);
        }

        return $this->json([
            'filename' => $newFilename,
            'url' => '/uploads/medecins/' . $newFilename,
        ]);
    }
}
