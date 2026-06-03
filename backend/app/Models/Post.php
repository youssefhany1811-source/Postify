<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class Post extends Model
{
    use HasFactory;
    public const CATEGORIES = [
        'waste',
        'roads',
        'street_lights',
        'water',
        'safety',
        'noise',
        'other',
    ];

    public const STATUSES = [
        'new',
        'under_review',
        'in_progress',
        'resolved',
        'rejected',
    ];

    protected $fillable = [
        'user_id',
        'title',
        'body',
        'image',
        'category',
        'location',
        'latitude',
        'longitude',
        'status',
    ];
    protected $appends = ['likes_count', 'supports_count', 'is_saved', 'image_url'];

    public function getIsSavedAttribute()
    {
        return $this->savedByUsers()->where('user_id', Auth::id())->exists();
    }

    public function getLikesCountAttribute()
    {
        return $this->likedByUsers()->count();
    }

    public function getSupportsCountAttribute()
    {
        return $this->likedByUsers()->count();
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null;
        }
        $disk = Storage::disk(config('filesystems.posts_disk', 'public'));
        $url = $disk->url($this->image);

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return rtrim(config('app.url'), '/') . '/' . ltrim($url, '/');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function savedByUsers()
    {
        return $this->belongsToMany(User::class, 'saved_posts')->withTimestamps();
    }

    public function likedByUsers()
    {
        return $this->belongsToMany(User::class, 'liked_posts')->withTimestamps();
    }

    static public function getHomePosts(int $page = 1)
    {
        return Post::with('user')
            ->withExists([
                'savedByUsers as is_saved' => fn($q) => $q->where('user_id', Auth::id())
            ])
            ->latest()
            ->paginate(5, ['*'], 'page', $page);
    }

    public function scopeForAuthenticatedUser($query)
    {
        return $query->where('user_id', Auth::id())
            ->withExists('savedByUsers as is_saved')
            ->latest();
    }
}
