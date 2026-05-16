<?php

namespace App\Jobs;

use App\Events\PostPublished;
use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CreatePost implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private string $title,
        private string $body,
        private ?string $imagePath,
    ) {}

    public static function fromRequest(StorePostRequest $request)
    {

        $imagePath = null;

        if ($request->hasFile('image')) {
            // Get the uploaded image
            $image = $request->file('image');

            try {
                $postsDisk = config('filesystems.posts_disk', 'public');
                $imagePath = $image->store('posts/images', $postsDisk);
                Log::info('Image uploaded successfully', [
                    'path' => $imagePath,
                    'disk' => $postsDisk,
                    'original_name' => $image->getClientOriginalName(),
                    'size' => $image->getSize()
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to upload image', [
                    'error' => $e->getMessage(),
                    'original_name' => $image->getClientOriginalName()
                ]);
                throw $e;
            }

            if (!$imagePath) {
                Log::error('Image upload returned null/false', [
                    'original_name' => $image->getClientOriginalName()
                ]);
                throw new \Exception('Failed to upload image');
            }
        }

        return new self(
            $request->title,
            $request->body,
            $imagePath
        );
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {

        $post = Post::create([
            'user_id' => Auth::id(),
            'title' => $this->title,
            'body' => $this->body,
            'image' => $this->imagePath,
        ]);

        event(new PostPublished($post));
    }
}
