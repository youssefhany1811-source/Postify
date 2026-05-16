<?php

namespace Database\Factories;

use App\Models\Comment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'post_id' => \App\Models\Post::factory(),
            'body' => $this->faker->sentence(rand(5, 20)),
            'like' => $this->faker->numberBetween(0, 100),
            'dislike' => $this->faker->numberBetween(0, 50),
            'love' => $this->faker->numberBetween(0, 80),
            'celebrate' => $this->faker->numberBetween(0, 30),
        ];
    }
}
