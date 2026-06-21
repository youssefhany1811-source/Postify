<?php

namespace App\Http\Controllers\Entity;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Post;
use App\Services\Posts\PostService;
use Illuminate\Http\Request;

class GizaReportsController extends Controller
{
    private function ensureGizaEntity(Request $request): void
    {
        abort_unless($request->user()?->isGizaEntity(), 403, 'Giza entity access required');
    }

    public function index(Request $request)
    {
        $this->ensureGizaEntity($request);

        $baseQuery = Post::inGizaRegion();
        $totalReports = (clone $baseQuery)->count();
        $resolvedReports = (clone $baseQuery)->where('status', 'resolved')->count();
        $openReports = (clone $baseQuery)->whereNotIn('status', ['resolved', 'rejected'])->count();
        $inProgressReports = (clone $baseQuery)->where('status', 'in_progress')->count();

        return response()->json([
            'region' => [
                'name' => 'Giza',
                'bounds' => Post::GIZA_BOUNDS,
            ],
            'stats' => [
                'total_reports' => $totalReports,
                'open_reports' => $openReports,
                'in_progress_reports' => $inProgressReports,
                'resolved_reports' => $resolvedReports,
            ],
            'reports' => Post::with('user')
                ->withCount([
                    'likedByUsers as supports_count',
                    'comments',
                ])
                ->inGizaRegion()
                ->latest()
                ->take(100)
                ->get(),
        ]);
    }

    public function updateStatus(Request $request, Post $post)
    {
        $this->ensureGizaEntity($request);

        abort_unless(Post::inGizaRegion()->whereKey($post->id)->exists(), 403, 'Report is outside the Giza entity area');

        $data = $request->validate([
            'status' => 'required|string|in:' . implode(',', Post::STATUSES),
        ]);

        $post->update([
            'status' => $data['status'],
        ]);

        $post->load('user')->loadCount([
            'likedByUsers as supports_count',
            'comments',
        ]);

        return response()->json([
            'message' => 'Report status updated successfully.',
            'report' => $post,
        ]);
    }

    public function show(Request $request, Post $post, PostService $postService)
    {
        $this->ensureGizaEntity($request);

        abort_unless(Post::inGizaRegion()->whereKey($post->id)->exists(), 403, 'Report is outside the Giza entity area');

        $result = $postService->getPost($post->id);

        if (!$result) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        return response()->json([
            'post' => $result['post'],
            'comments' => CommentResource::collection($result['comments']),
        ]);
    }
}
