<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\ReportWritingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportWritingController extends Controller
{
    public function enhance(Request $request, ReportWritingService $writingService)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:200'],
            'body' => ['required', 'string', 'min:20'],
            'tone' => ['required', 'string', Rule::in(['clear', 'polite', 'urgent', 'official'])],
        ]);

        try {
            return response()->json([
                'message' => 'Report writing improved.',
                'report' => $writingService->enhance($data),
            ]);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'AI writing is temporarily unavailable. Please try again later.',
            ], 503);
        }
    }
}
