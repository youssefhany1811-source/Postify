<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ContentModerationService
{
    public function checkReport(array $content): array
    {
        $apiKey = config('services.openrouter.key');

        if (!$apiKey) {
            return $this->allowed();
        }

        $text = trim(implode("\n", array_filter([
            'Title: ' . ($content['title'] ?? ''),
            'Description: ' . ($content['body'] ?? ''),
            'Location: ' . ($content['location'] ?? ''),
        ])));

        if ($text === '') {
            return $this->allowed();
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(20)
                ->post(config('services.openrouter.url'), [
                    'model' => config('services.openrouter.moderation_model'),
                    'temperature' => 0,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a content safety classifier for a community problem-reporting app. Check for profanity, hate, harassment, threats, sexual content, illegal activity, and violent or abusive language. Return only JSON: {"allowed":true,"reason":""} or {"allowed":false,"reason":"short reason"}.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $text,
                        ],
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('OpenRouter moderation request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $this->allowed();
            }

            return $this->parseModerationResult(
                data_get($response->json(), 'choices.0.message.content', '')
            ) ?? $this->allowed();
        } catch (\Throwable $e) {
            Log::warning('OpenRouter moderation request errored', [
                'error' => $e->getMessage(),
            ]);

            return $this->allowed();
        }
    }

    private function parseModerationResult(string $message): ?array
    {
        $cleanMessage = trim($message);
        $cleanMessage = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $cleanMessage);
        $decoded = json_decode($cleanMessage, true);

        if (!is_array($decoded) || !array_key_exists('allowed', $decoded)) {
            return null;
        }

        return [
            'allowed' => (bool) $decoded['allowed'],
            'reason' => (string) ($decoded['reason'] ?? ''),
        ];
    }

    private function allowed(): array
    {
        return [
            'allowed' => true,
            'reason' => '',
        ];
    }
}
