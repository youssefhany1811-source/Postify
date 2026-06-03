<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\CommentResource;
use App\Models\Post;
use App\Services\Posts\PostService;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function store(StorePostRequest $request, PostService $postService)
    {

        $post = $postService->createPost($request);
        return response()->json([
            'message' => 'Report created successfully!',
            'post' => $post
        ], 201); // 201 for resource created
    }


    public function getUserPosts(PostService $postService)
    {
        $posts = $postService->getCurrentUserPosts();

        return response()->json([
            'posts' => $posts
        ], 200);
    }

    public function getSavedPosts(PostService $postService)
    {
        $posts = $postService->getCurrentUserSavedPosts();

        return response()->json([
            'posts' => $posts
        ], 200);
    }

    public function getPost($id, PostService $postService)
    {
        $result = $postService->getPost($id);

        if (!$result) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        return response()->json([
            'post' => $result['post'],
            'comments' => CommentResource::collection($result['comments']),
        ], 200);
    }

    public function getUserPost($id, PostService $postService)
    {
        $postArr = $postService->getUserPost($id);

        if (!$postArr) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        return response()->json($postArr);
    }

    public function getHomePosts(PostService $postService)
    {
        $home_posts = $postService->getHomePosts();

        return response()->json(['posts' => $home_posts], 200);
    }

    public function update(UpdatePostRequest $request, Post $post, PostService $postService)
    {
        $updatedPost = $postService->updatePost($request, $post);

        return response()->json([
            'message' => 'Report updated successfully!',
            'post' => $updatedPost,
        ], 200);
    }


    public function destroy(Post $post, PostService $postService)
    {
        $postService->deletePost($post);

        return response()->json([
            'message' => 'Report deleted successfully!',
        ], 200);
    }

    // TODO: use Laravel Scout instead of this
    public function postSearch(PostService $postService)
    {
        $query = request('query', '');
        $posts = $postService->searchPosts($query);

        return response()->json($posts); // Return JSON response
    }
}
