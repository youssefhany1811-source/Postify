<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable; // Update this line
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    protected $fillable = ['username', 'email', 'password', 'user_role', 'avatar', 'gender', 'description'];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function savedPosts()
    {
        return $this->belongsToMany(Post::class, 'saved_posts')->withTimestamps();
    }

    public function likedPosts()
    {
        return $this->belongsToMany(Post::class, 'liked_posts');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function commentReactions()
    {
        return $this->hasMany(CommentReaction::class);
    }

    public function isAdmin(): bool
    {
        return $this->user_role === 'admin';
    }
}
