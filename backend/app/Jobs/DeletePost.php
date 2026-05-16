<?php

namespace App\Jobs;

use App\Models\Post;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class DeletePost implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private Post $post
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Delete the associated image if it exists
        if ($this->post->image) {
            Storage::disk(config('filesystems.posts_disk', 'public'))->delete($this->post->image);
        }

        // Delete the post
        $this->post->delete();
    }
}
