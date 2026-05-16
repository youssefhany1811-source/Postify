<?php

namespace App\Services\Posts;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Jobs\DeletePost;
use App\Jobs\UpdatePost;
use App\Models\CommentReaction;
use App\Models\Post;
use App\Notifications\PostPublished;
use Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class PostService
{
    private const HOME_CACHE_PREFIX = 'home_posts_page_';
    private const HOME_CACHE_PAGES_TO_CLEAR = 20;

    public function createPost(StorePostRequest $request): Post
    {
        $imagePath = null;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $postsDisk = config('filesystems.posts_disk', 'public');

            try {
                $imagePath = $image->store('posts/images', $postsDisk);
                Log::info('Image uploaded successfully', [
                    'path' => $imagePath,
                    'disk' => $postsDisk,
                    'original_name' => $image->getClientOriginalName(),
                    'size' => $image->getSize(),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to upload image', [
                    'error' => $e->getMessage(),
                    'original_name' => $image->getClientOriginalName(),
                ]);
                throw $e;
            }

            if (!$imagePath) {
                Log::error('Image upload returned null/false', [
                    'original_name' => $image->getClientOriginalName(),
                ]);
                throw new \Exception('Failed to upload image');
            }
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'title' => $request->title,
            'body' => $request->body,
            'image' => $imagePath,
        ]);

        $user = Auth::user();
        $user->notify(new PostPublished('Your post has been successfully published!'));
        event(new PostPublished($post));

        $this->clearHomePostsCache();

        $post->load('user');
        $post->setAttribute('canUpdate', Gate::allows('canEdit', $post));

        return $post;
    }

    public function getCurrentUserPosts()
    {
        return Post::forAuthenticatedUser()
            ->get()
            ->map(function ($post) {
                return $post;
            });
    }

    public function getCurrentUserSavedPosts()
    {
        return Auth::user()->savedPosts()->with('user')->latest()->get();
    }

    public function getPost(int $id): ?array
    {
        $post = Post::with(['user'])
            ->withExists([
                'likedByUsers as liked' => fn($q) => $q->where('user_id', Auth::id()),
            ])
            ->find($id);

        if (!$post) {
            return null;
        }

        $commentIds = $post->comments->pluck('id')->toArray();

        $reactionCounts = !empty($commentIds)
            ? CommentReaction::getReactionCountsForComments($commentIds)
            : collect();

        $post->comments->each(function ($comment) use ($reactionCounts) {
            $counts = $reactionCounts[$comment->id] ?? null;
            $comment->likes = $counts->likes ?? 0;
            $comment->dislikes = $counts->dislikes ?? 0;
            $comment->celebrates = $counts->celebrates ?? 0;
            $comment->loves = $counts->loves ?? 0;
        });

        return [
            'post' => $post,
            'comments' => $post->comments,
        ];
    }

    public function getUserPost(int $id): ?array
    {
        $post = Post::with('comments')->withExists(['likedByUsers as liked'])->find($id);
        if (!$post) {
            return null;
        }

        $postArr = $post->toArray();
        $postArr['likes_count'] = $post->likedByUsers()->count();
        return $postArr;
    }

    public function getHomePosts(?int $page = null)
    {
        $resolvedPage = max($page ?? (int) request()->query('page', 1), 1);
        $cacheKey = self::HOME_CACHE_PREFIX . $resolvedPage;
        $ttl = 60;

        return Cache::remember($cacheKey, $ttl, function () use ($resolvedPage) {
            $homePosts = Post::getHomePosts($resolvedPage);

            /** @var \Illuminate\Pagination\LengthAwarePaginator $homePosts */
            $posts = $homePosts->getCollection()->values();
            foreach ($posts as $p) {
                $p['canUpdate'] = Gate::allows('canEdit', $p);
            }

            return $homePosts->setCollection($posts);
        });
    }

    public function updatePost(UpdatePostRequest $request, Post $post): Post
    {
        dispatch_sync(UpdatePost::fromRequest($request, $post));
        $post->refresh();
        $this->clearHomePostsCache();
        return $post;
    }

    public function deletePost(Post $post): bool
    {
        dispatch_sync(new DeletePost($post));
        $this->clearHomePostsCache();
        return true;
    }

    public function searchPosts(string $query, int $perPage = 10)
    {
        Log::debug('Post search query', ['query' => $query]);
        return Post::where('title', 'LIKE', "%{$query}%")
            ->orWhere('body', 'LIKE', "%{$query}%")
            ->paginate($perPage);
    }

    private function clearHomePostsCache(): void
    {
        for ($page = 1; $page <= self::HOME_CACHE_PAGES_TO_CLEAR; $page++) {
            Cache::forget(self::HOME_CACHE_PREFIX . $page);
        }
    }
}
