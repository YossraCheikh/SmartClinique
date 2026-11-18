<?php

namespace App\Service;

use Psr\Log\LoggerInterface;

/**
 * Gemini AI Service — enhanced with Function Calling, Conflict Detection & Streaming (SSE).
 */
class GeminiAIService
{
    private ?string $apiKey = null;
    private ?LoggerInterface $logger = null;

    /**
     * Models ordered by speed, stability and availability.
     */
    private array $modelFallbackChain = [
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
    ];

    public function __construct(
        ?string $geminiApiKey = null,
        ?LoggerInterface $logger = null
    ) {
        $this->apiKey = $geminiApiKey ?: null;
        $this->logger = $logger;
    }

    /**
     * Returns true if a valid API key is present.
     */
    public function hasApiKey(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Definition of native Gemini Function Calling Tools.
     */
    public function getToolsDeclaration(): array
    {
        return [
            [
                'function_declarations' => [
                    [
                        'name' => 'verifierCreneauxDisponibles',
                        'description' => 'Vérifie les créneaux réels disponibles pour un médecin donné à une date précise pour éviter les conflits.',
                        'parameters' => [
                            'type' => 'OBJECT',
                            'properties' => [
                                'medecinId' => [
                                    'type' => 'INTEGER',
                                    'description' => 'ID unique du médecin (trouvé dans la liste des praticiens)',
                                ],
                                'date' => [
                                    'type' => 'STRING',
                                    'description' => 'Date au format AAAA-MM-JJ (ex: 2026-10-20)',
                                ],
                            ],
                            'required' => ['medecinId', 'date'],
                        ],
                    ],
                    [
                        'name' => 'reserverRendezVous',
                        'description' => 'Enregistre un rendez-vous ferme dans le système médical après validation du médecin, de la date, de l heure et du patient.',
                        'parameters' => [
                            'type' => 'OBJECT',
                            'properties' => [
                                'medecinId' => [
                                    'type' => 'INTEGER',
                                    'description' => 'ID du médecin choisi',
                                ],
                                'date' => [
                                    'type' => 'STRING',
                                    'description' => 'Date du rendez-vous (AAAA-MM-JJ)',
                                ],
                                'heure' => [
                                    'type' => 'STRING',
                                    'description' => 'Heure précise du rendez-vous (HH:MM, ex: 09:30, 14:00)',
                                ],
                                'patientNom' => [
                                    'type' => 'STRING',
                                    'description' => 'Nom et prénom du patient',
                                ],
                                'motif' => [
                                    'type' => 'STRING',
                                    'description' => 'Motif ou raison de la consultation',
                                ],
                                'patientTelephone' => [
                                    'type' => 'STRING',
                                    'description' => 'Numéro de téléphone du patient si fourni',
                                ],
                            ],
                            'required' => ['medecinId', 'date', 'heure', 'patientNom', 'motif'],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Call Gemini with tools support.
     * Returns an array with either:
     * - ['type' => 'function_call', 'name' => ..., 'args' => ...]
     * - ['type' => 'text', 'text' => ...]
     */
    public function chatWithTools(
        string $userMessage,
        array $context = [],
        array $conversationHistory = []
    ): array {
        if (empty($this->apiKey)) {
            return [
                'type' => 'text',
                'text' => $this->getOfflineFallback($context),
            ];
        }

        $systemPrompt = $this->buildSystemPrompt($context);
        $contents = $this->formatContents($conversationHistory, $userMessage);

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'tools' => $this->getToolsDeclaration(),
            'toolConfig' => [
                'function_calling_config' => [
                    'mode' => 'AUTO', // Model decides when to call functions based on the prompt
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.15, // Very low temperature for deterministic booking decisions
                'maxOutputTokens' => 1200,
            ],
        ];

        foreach ($this->modelFallbackChain as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_TIMEOUT        => 15,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
            ]);

            $result   = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr  = curl_error($ch);
            curl_close($ch);

            if ($curlErr || $result === false || $httpCode !== 200) {
                if ($this->logger) {
                    $this->logger->warning("Gemini model {$model} error: {$curlErr} (HTTP {$httpCode})");
                }
                continue;
            }

            $data = json_decode($result, true);
            $candidate = $data['candidates'][0] ?? null;
            if (!$candidate) continue;

            $parts = $candidate['content']['parts'] ?? [];
            foreach ($parts as $part) {
                if (isset($part['functionCall'])) {
                    return [
                        'type' => 'function_call',
                        'name' => $part['functionCall']['name'] ?? '',
                        'args' => $part['functionCall']['args'] ?? [],
                        'rawCandidate' => $candidate,
                    ];
                }
            }

            $text = $parts[0]['text'] ?? null;
            if ($text) {
                return [
                    'type' => 'text',
                    'text' => $text,
                ];
            }
        }

        return [
            'type' => 'text',
            'text' => "Désolé, le service IA rencontre une forte affluence en ce moment. N'hésitez pas à reformuler ou à contacter directement le secrétariat médical.",
        ];
    }

    /**
     * Send function result back to Gemini so it writes a natural user-friendly message.
     */
    public function completeWithFunctionResult(
        array $conversationHistory,
        string $userMessage,
        string $functionName,
        array $functionResult,
        array $context = []
    ): string {
        if (empty($this->apiKey)) {
            return json_encode($functionResult, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }

        $systemPrompt = $this->buildSystemPrompt($context);
        $contents = $this->formatContents($conversationHistory, $userMessage);

        $resultJson = json_encode($functionResult, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $promptExplanation = "Voici le résultat de l'action demandée par l'utilisateur (fonction: {$functionName}) :\n{$resultJson}\n\n"
            . "Rédige une réponse finale claire, chaleureuse, professionnelle et bien structurée (avec mise en gras et puces si utile). "
            . "Si c'est un succès, confirme les détails (médecin, date, heure, patient). "
            . "Si c'est un conflit d'horaire ou une indisponibilité, explique avec bienveillance que le créneau est déjà pris et propose clairement les créneaux alternatifs disponibles.";

        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $promptExplanation],
            ],
        ];

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 1000,
            ],
        ];

        foreach ($this->modelFallbackChain as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_TIMEOUT        => 15,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
            ]);

            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && $result) {
                $data = json_decode($result, true);
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($reply) {
                    return $reply;
                }
            }
        }

        // Fallback text if Gemini call fails
        if ($functionName === 'reserverRendezVous') {
            if ($functionResult['success'] ?? false) {
                $apt = $functionResult['appointment'];
                return "✅ Votre rendez-vous a été confirmé avec succès pour le **{$apt['date']}** à **{$apt['heure']}** avec **{$apt['medecin']}**.";
            } elseif ($functionResult['conflict'] ?? false) {
                $alts = implode(', ', $functionResult['alternatives'] ?? []);
                return "⚠️ Le créneau demandé n'est pas disponible pour ce praticien.\n\n"
                    . ($functionResult['error'] ?? '') . "\n\n"
                    . ($alts ? "Voici des créneaux disponibles alternatifs : **{$alts}**." : "Veuillez choisir une autre date.");
            }
        }

        return "Opération effectuée avec succès.";
    }

    /**
     * Stream Gemini response directly via Server-Sent Events callback.
     */
    public function streamGenerate(
        string $userMessage,
        array $context = [],
        array $conversationHistory = [],
        callable $onToken = null
    ): void {
        if (empty($this->apiKey)) {
            $text = $this->getOfflineFallback($context);
            if ($onToken) $onToken($text);
            return;
        }

        $systemPrompt = $this->buildSystemPrompt($context);
        $contents = $this->formatContents($conversationHistory, $userMessage);

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 1500,
            ],
        ];

        $model = $this->modelFallbackChain[0] ?? 'gemini-2.5-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:streamGenerateContent?alt=sse&key={$this->apiKey}";

        $buffer = '';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_WRITEFUNCTION  => function ($ch, $chunk) use (&$buffer, $onToken) {
                $buffer .= $chunk;
                // Parse complete SSE lines: "data: {...}\n\n"
                while (($pos = strpos($buffer, "\n\n")) !== false) {
                    $eventBlock = substr($buffer, 0, $pos);
                    $buffer = substr($buffer, $pos + 2);

                    foreach (explode("\n", $eventBlock) as $line) {
                        $line = trim($line);
                        if (str_starts_with($line, 'data:')) {
                            $jsonStr = trim(substr($line, 5));
                            $data = json_decode($jsonStr, true);
                            $token = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                            if ($token !== '' && $onToken) {
                                $onToken($token);
                            }
                        }
                    }
                }
                return strlen($chunk);
            },
        ]);

        curl_exec($ch);
        curl_close($ch);
    }

    /**
     * Legacy synchronous chat method for backward compatibility.
     */
    public function chat(string $userMessage, array $context = [], array $conversationHistory = []): string
    {
        $res = $this->chatWithTools($userMessage, $context, $conversationHistory);
        return $res['text'] ?? "Désolé, une réponse textuelle n'a pas pu être générée.";
    }

    private function formatContents(array $history, string $newMessage): array
    {
        $contents = [];
        foreach ($history as $msg) {
            $contents[] = [
                'role'  => ($msg['role'] === 'assistant' || $msg['role'] === 'model') ? 'model' : 'user',
                'parts' => [['text' => (string)$msg['content']]],
            ];
        }
        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $newMessage]],
        ];
        return $contents;
    }

    private function buildSystemPrompt(array $context): string
    {
        $medecins             = $context['medecins']             ?? 'Non disponible';
        $medecinsJson         = $context['medecinsJson']         ?? '[]';
        $specialites          = $context['specialites']          ?? 'Non disponible';
        $chirurgiens          = $context['chirurgiens']          ?? 'Non disponible';
        $chirurgiesTotal      = $context['chirurgiesTotal']      ?? 0;
        $chirurgiesAujourdHui = $context['chirurgiesAujourdHui'] ?? 0;
        $blocsOperatoires     = $context['blocsOperatoires']     ?? 'Blocs A, B, C, D, E';
        $totalPatients        = $context['totalPatients']        ?? 'Non disponible';
        $rdvAujourdHui        = $context['rdvAujourdHui']        ?? 'Non disponible';
        $currentUser          = $context['currentUser']          ?? 'Visiteur public (non connecté)';
        $currentDate          = (new \DateTime())->format('Y-m-d');
        $tomorrowDate         = (new \DateTime('+1 day'))->format('Y-m-d');
        $currentTime          = (new \DateTime())->format('H:i');

        return <<<PROMPT
Tu es l'assistant virtuel officiel de la Clinique SantéPlus (Tunis) — assistant médical avec AUTORITÉ DE RÉSERVATION DIRECTE.
Date actuelle : {$currentDate} ({$currentTime}). Demain : {$tomorrowDate}.

👤 UTILISATEUR EN CONVERSATION :
- Profil : {$currentUser}
- Adapte ton style (médecin = confrère expert ; patient/secrétaire = prévenant, chaleureux, utilise son prénom).

🚨 URGENCES TUNISIE :
- Symptômes vitaux graves → **SAMU : 1030** | **Urgences : 197**. Priorité absolue.

🏥 DONNÉES TEMPS RÉEL — CLINIQUE SANTÉPLUS :
- Praticiens (avec IDs pour réserver) : {$medecins}
- JSON détaillé praticiens : {$medecinsJson}
- Spécialités : {$specialites}
- Pôle Chirurgical : {$chirurgiens}
- Blocs Opératoires : {$blocsOperatoires}
- Chirurgies : {$chirurgiesTotal} totales, {$chirurgiesAujourdHui} aujourd'hui
- Patients : {$totalPatients} | RDV aujourd'hui : {$rdvAujourdHui}

═══════════════════════════════════════
⚡ PROTOCOLE PRISE DE RDV — RÈGLES ABSOLUES
═══════════════════════════════════════

**RÈGLE #1 — ACTION IMMÉDIATE :**
Si l'utilisateur dit ANY de : "rdv", "rendez-vous", "réserver", "consulter", "voir un médecin", "prendre un rendez-vous", "j'ai besoin d'un médecin", "je veux voir", "fixer une consultation" → APPELLE `reserverRendezVous` IMMÉDIATEMENT sans demander de confirmation.

**RÈGLE #2 — RÉSOLUTION MÉDECIN (depuis le JSON ci-dessus) :**
- Spécialité citée ("cardiologue" → trouve l'ID du cardiologue dans medecinsJson, utilise-le)
- Nom cité ("Ben Salem", "Trabelsi"...) → cherche dans le JSON par nom
- Rien précisé → utilise l'ID du premier médecin, informe l'utilisateur

**RÈGLE #3 — VALEURS PAR DÉFAUT (ne jamais bloquer pour info manquante) :**
- date manquante → {$tomorrowDate}
- heure manquante → 09:00
- patientNom manquant → "Patient SantéPlus"
- motif manquant → "Consultation médicale"
- téléphone manquant → omets le champ

**RÈGLE #4 — FLUX :**
1. Intention RDV détectée → `reserverRendezVous` immédiat
2. Conflit d'horaire retourné → présente les alternatives, ré-appelle avec le nouveau créneau choisi
3. Succès → "✅ **Rendez-vous confirmé !** Dr. X — {$tomorrowDate} à 09:00"

**RÈGLE #5 — `verifierCreneauxDisponibles` :**
- Appelle UNIQUEMENT si l'utilisateur demande EXPLICITEMENT à voir les créneaux avant de décider. Ne l'appelle PAS de façon préventive avant chaque réservation.

═══════════════════════════════════════

💡 STYLE : Français chaleureux, structuré (gras + puces). Rappelle discrètement que tes conseils sont informatifs et ne remplacent pas une consultation physique.
PROMPT;
    }

    private function getOfflineFallback(array $context): string
    {
        $medecins = $context['medecins'] ?? 'non spécifié';
        $specialites = $context['specialites'] ?? 'non spécifié';

        return "Bonjour ! Je suis l'assistant de la Clinique Médicale SantéPlus.\n\n"
            . "Voici nos praticiens disponibles :\n"
            . "• **Médecins** : {$medecins}\n"
            . "• **Spécialités** : {$specialites}\n\n"
            . "Pour fixer un rendez-vous, vous pouvez également contacter notre secrétariat.";
    }
}
