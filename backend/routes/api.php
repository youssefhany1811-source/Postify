<?php

use App\Events\NewNotification;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Entity\GizaReportsController;
use App\Http\Controllers\FireController;
use App\Http\Controllers\Notifications\NotificationController;
use App\Http\Controllers\Posts\PostCommentsController;
use App\Http\Controllers\Reports\ReportWritingController;
use App\Http\Controllers\TestJobsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Posts\PostController;
use App\Http\Controllers\Posts\PostInteractionController;
use App\Http\Controllers\User\ProfileController;

// Broadcast routes are registered in App\Providers\BroadcastServiceProvider

// Public Auth Routes
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);
Route::get('/googleAuth', [LoginController::class, 'redirectToAuth']);
Route::get('/auth/callback', [LoginController::class, 'handleAuthCallback']);

// Token Validation
Route::middleware('auth:sanctum')->get('/auth/validate', function () {
    return response()->json(['message' => 'Token is valid'], 200);
});

// User Routes
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::patch('/', [ProfileController::class, 'updateUserData']);
    Route::delete('/', [ProfileController::class, 'deleteUserAccount']);
    Route::get('/posts', [PostController::class, 'getUserPosts']);
    Route::get('/posts/saved', [PostController::class, 'getSavedPosts']);
});

// Visited User Profile
Route::middleware('auth:sanctum')->get('/users/{user}', [ProfileController::class, 'getVisitedUser']);

// Post Routes
Route::middleware('auth:sanctum')->prefix('posts')->group(function () {
    Route::get('/home', [PostController::class, 'getHomePosts']);
    Route::get('/search', [PostController::class, 'postSearch']);
    Route::get('/{id}', [PostController::class, 'getPost']); // public view

    Route::post('/', [PostController::class, 'store']);
    Route::patch('/{post}', [PostController::class, 'update'])->middleware('can:update,post');
    Route::delete('/{post}', [PostController::class, 'destroy'])->middleware('can:delete,post');

    Route::post('/{post}/save', [PostInteractionController::class, 'togglePostSave']);
    Route::post('/{post}/like', [PostInteractionController::class, 'togglePostLike']);
});

Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/home', [PostController::class, 'getHomePosts']);
    Route::get('/search', [PostController::class, 'postSearch']);
    Route::post('/enhance', [ReportWritingController::class, 'enhance']);
    Route::get('/{id}', [PostController::class, 'getPost']);

    Route::post('/', [PostController::class, 'store']);
    Route::patch('/{post}', [PostController::class, 'update'])->middleware('can:update,post');
    Route::delete('/{post}', [PostController::class, 'destroy'])->middleware('can:delete,post');

    Route::post('/{post}/save', [PostInteractionController::class, 'togglePostSave']);
    Route::post('/{post}/support', [PostInteractionController::class, 'togglePostLike']);
    Route::post('/{post}/comments', [PostCommentsController::class, 'store']);
    Route::patch('/{post}/comments/{comment}', [PostCommentsController::class, 'update']);
    Route::patch('/{post}/comments/{comment}/reactions', [PostCommentsController::class, 'updateCommentReactions']);
    Route::delete('/{post}/comments/{comment}', [PostCommentsController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('posts')->group(function () {
    Route::post('{post}/comments', [PostCommentsController::class, 'store']);
    Route::patch('{post}/comments/{comment}', [PostCommentsController::class, 'update']);
    Route::patch('{post}/comments/{comment}/reactions', [PostCommentsController::class, 'updateCommentReactions']);
    Route::delete('{post}/comments/{comment}', [PostCommentsController::class, 'destroy']);
});

// Misc
Route::get('/img', fn() => response()->json([
    'img' => 'posts/deYx5CcsQ7amYYPxachEJQVRVpRktb4u1MoC8bpj.jpg.webp'
], 200));

// Test Route
Route::get('/test', function () {
    return response()->json(config('filesystems.default'));
});

Route::get('/test-s3', function () {
    $result = Storage::disk('s3')->put('test.txt', 'This is a test file.');
    return $result ? 'Success' : 'Failed';
});

// Test Job Routes (for testing Horizon)
Route::middleware('auth:sanctum')->prefix('test-jobs')->group(function () {
    Route::post('/image-processing', [TestJobsController::class, 'dispatchImageProcessing']);
    Route::post('/email-notifications', [TestJobsController::class, 'dispatchEmailNotifications']);
    Route::post('/mixed-jobs', [TestJobsController::class, 'dispatchMixedJobs']);
    Route::post('/delayed-jobs', [TestJobsController::class, 'dispatchDelayedJobs']);
});

Route::middleware('auth:sanctum')->prefix('/notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unReadCount']);
    Route::patch('/{id}', [NotificationController::class, 'markAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::patch('/reports/{post}/status', [AdminDashboardController::class, 'updateStatus']);
});

Route::middleware('auth:sanctum')->prefix('entity/giza')->group(function () {
    Route::get('/reports', [GizaReportsController::class, 'index']);
    Route::get('/reports/{post}', [GizaReportsController::class, 'show']);
    Route::patch('/reports/{post}/status', [GizaReportsController::class, 'updateStatus']);
});

Route::post('/fire', [FireController::class, 'sendAds']);
