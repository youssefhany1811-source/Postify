<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResponsibleAccountsSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@postify.local';
    public const GIZA_ENTITY_EMAIL = 'giza.entity@postify.local';
    public const PASSWORD = 'Postify@123';

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'username' => 'Postify Admin',
                'password' => Hash::make(self::PASSWORD),
                'user_role' => User::ROLE_ADMIN,
                'description' => 'Platform administrator account.',
                'avatar' => '/panda.png',
            ]
        );

        User::updateOrCreate(
            ['email' => self::GIZA_ENTITY_EMAIL],
            [
                'username' => 'Giza Reform Entity',
                'password' => Hash::make(self::PASSWORD),
                'user_role' => User::ROLE_ENTITY_GIZA,
                'description' => 'Responsible entity for Giza-region reports.',
                'avatar' => '/jaguar.png',
            ]
        );

        $reporter = User::updateOrCreate(
            ['email' => 'giza.reporter@postify.local'],
            [
                'username' => 'Giza Reporter',
                'password' => Hash::make(self::PASSWORD),
                'user_role' => User::ROLE_USER,
                'description' => 'Seeded citizen reports for the Giza entity workflow.',
                'avatar' => '/turtle.png',
            ]
        );

        $reports = [
            [
                'title' => 'Broken street light near Giza Square',
                'body' => 'The street light near Giza Square has been off for several nights and the area is unsafe for pedestrians.',
                'category' => 'street_lights',
                'location' => 'Giza Square, Giza',
                'latitude' => 30.0106,
                'longitude' => 31.2070,
                'contact_phone' => '+201000000001',
            ],
            [
                'title' => 'Large road hole on Faisal Street',
                'body' => 'A large hole is blocking part of Faisal Street and cars are swerving suddenly to avoid it.',
                'category' => 'roads',
                'location' => 'Faisal Street, Giza',
                'latitude' => 30.0055,
                'longitude' => 31.1779,
                'contact_phone' => '+201000000002',
            ],
            [
                'title' => 'Waste pile beside Haram main road',
                'body' => 'Waste has been accumulating beside Haram main road and needs collection before it spreads further.',
                'category' => 'waste',
                'location' => 'Haram, Giza',
                'latitude' => 29.9870,
                'longitude' => 31.1681,
                'contact_phone' => '+201000000003',
            ],
        ];

        foreach ($reports as $report) {
            Post::updateOrCreate(
                ['title' => $report['title']],
                [
                    'user_id' => $reporter->id,
                    'body' => $report['body'],
                    'image' => null,
                    'category' => $report['category'],
                    'location' => $report['location'],
                    'latitude' => $report['latitude'],
                    'longitude' => $report['longitude'],
                    'status' => Post::STATUSES[0],
                    'contact_phone' => $report['contact_phone'],
                ]
            );
        }
    }
}
