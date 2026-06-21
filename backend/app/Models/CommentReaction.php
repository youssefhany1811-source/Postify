<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CommentReaction extends Model
{
    protected $table = 'comments_reactions';

    protected $fillable = [
        'reaction_type',
        'user_id',
        'comment_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
    public static function getReactionCountsForComments(array $commentIds)
    {
        return DB::table('comments_reactions')
            ->whereIn('comment_id', $commentIds)
            ->select([
                'comment_id',
                DB::raw("SUM(reaction_type = 'like') as likes"),
                DB::raw("SUM(reaction_type = 'dislike') as dislikes"),
                DB::raw("SUM(reaction_type = 'celebrate') as celebrates"),
                DB::raw("SUM(reaction_type = 'love') as loves"),
            ])
            ->groupBy('comment_id')
            ->get()
            ->keyBy('comment_id');
    }
}
