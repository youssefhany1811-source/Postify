<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReportWritingService
{
    public function enhance(array $content): array
    {
        $apiKey = config('services.openrouter.key');

        if (!$apiKey) {
            throw new \RuntimeException('AI writing is not configured.');
        }

        $tone = $content['tone'] ?? 'clear';
        $toneInstruction = $this->toneInstruction($tone);

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(30)
                ->post(config('services.openrouter.url'), [
                    'model' => config('services.openrouter.moderation_model'),
                    'temperature' => 0.4,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You improve citizen community issue reports. Keep the exact same language as the user input. If the report is Arabic, respond in Arabic. If it mixes languages, preserve that mix. Keep the facts unchanged. Do not add new details. Return only JSON: {"title":"improved title","body":"improved description"}.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "Tone: {$tone}\nTone instruction: {$toneInstruction}\nTitle: {$content['title']}\nDescription: {$content['body']}",
                        ],
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('OpenRouter writing request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new \RuntimeException('AI writing request failed.');
            }

            $result = $this->parseResult(
                data_get($response->json(), 'choices.0.message.content', '')
            );

            if (!$result) {
                throw new \RuntimeException('AI writing response was invalid.');
            }

            return $result;
        } catch (\Throwable $e) {
            Log::warning('OpenRouter writing request errored', [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function parseResult(string $message): ?array
    {
        $cleanMessage = trim($message);
        $cleanMessage = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $cleanMessage);
        $decoded = json_decode($cleanMessage, true);

        if (!is_array($decoded)) {
            return null;
        }

        $title = trim((string) ($decoded['title'] ?? ''));
        $body = trim((string) ($decoded['body'] ?? ''));

        if ($title === '' || $body === '') {
            return null;
        }

        return [
            'title' => $title,
            'body' => $body,
        ];
    }

    private function toneInstruction(string $tone): string
    {
        return match ($tone) {
            'polite' => 'Rewrite with respectful, calm, courteous wording. Soften harsh phrasing while keeping the issue clear.',
            'urgent' => 'Rewrite with a stronger sense of urgency and importance without exaggerating or adding facts.',
            'official' => 'Rewrite in a formal civic report style suitable for municipal review.',
            default => 'Rewrite to be clearer, simpler, and easier to understand.',
        };
    }
}
