<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminDashboardController extends Controller
{
    private function ensureAdmin(): void
    {
        abort_unless(Auth::user()?->isAdmin(), 403, 'Admin access required');
    }

    public function index()
    {
        $this->ensureAdmin();

        $totalReports = Post::count();
        $resolvedReports = Post::where('status', 'resolved')->count();
        $openReports = Post::whereNotIn('status', ['resolved', 'rejected'])->count();
        $rejectedReports = Post::where('status', 'rejected')->count();
        $supportVotes = Like::count();
        $totalComments = Comment::count();
        $reportsWithImages = Post::whereNotNull('image')->count();
        $resolutionRate = $totalReports > 0
            ? round(($resolvedReports / $totalReports) * 100, 1)
            : 0;

        return response()->json([
            'stats' => [
                'total_reports' => $totalReports,
                'open_reports' => $openReports,
                'resolved_reports' => $resolvedReports,
                'rejected_reports' => $rejectedReports,
                'support_votes' => $supportVotes,
                'total_comments' => $totalComments,
                'reports_with_images' => $reportsWithImages,
                'resolution_rate' => $resolutionRate,
            ],
            'reports_by_category' => Post::selectRaw('category, count(*) as total')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get(),
            'reports_by_status' => Post::selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->orderBy('status')
                ->get(),
            'recent_reports' => Post::with('user')
                ->withCount('comments')
                ->latest()
                ->take(10)
                ->get(),
            'top_supported_reports' => Post::with('user')
                ->withCount([
                    'likedByUsers as supports_count',
                    'comments',
                ])
                ->orderByDesc('supports_count')
                ->orderByDesc('comments_count')
                ->latest()
                ->take(5)
                ->get(),
            'oldest_open_reports' => Post::with('user')
                ->withCount([
                    'likedByUsers as supports_count',
                    'comments',
                ])
                ->whereNotIn('status', ['resolved', 'rejected'])
                ->oldest()
                ->take(5)
                ->get(),
            'top_locations' => Post::selectRaw("COALESCE(NULLIF(location, ''), 'Unknown') as location, count(*) as total")
                ->groupBy('location')
                ->orderByDesc('total')
                ->take(6)
                ->get(),
            'map_reports' => Post::with('user')
                ->withCount([
                    'likedByUsers as supports_count',
                    'comments',
                ])
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->latest()
                ->take(250)
                ->get(),
        ]);
    }

    public function updateStatus(Request $request, Post $post)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'status' => 'required|string|in:' . implode(',', Post::STATUSES),
        ]);

        $post->update([
            'status' => $data['status'],
        ]);

        $post->load('user');

        return response()->json([
            'message' => 'Report status updated successfully.',
            'report' => $post,
        ]);
    }
}
