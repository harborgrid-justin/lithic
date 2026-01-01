/**
 * Rewards Redemption Page
 * Redeem points for rewards and incentives
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Coins, ShoppingCart, Award, Percent } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rewards | Patient Portal',
  description: 'Redeem your points for rewards and benefits',
};

export default function RewardsPage() {
  const availablePoints = 12450;
  const currentLevel = 11;
  const discount = currentLevel >= 20 ? 10 : 0;

  const rewards = [
    {
      id: '1',
      name: '$10 Amazon Gift Card',
      points: 1000,
      discount: discount,
      category: 'Gift Cards',
      stock: 'In Stock',
      image: '🎁',
    },
    {
      id: '2',
      name: 'Fitbit Charge 5',
      points: 5000,
      discount: discount,
      category: 'Fitness Devices',
      stock: 'In Stock',
      image: '⌚',
    },
    {
      id: '3',
      name: 'Free Telehealth Consultation',
      points: 2500,
      discount: 0,
      category: 'Healthcare',
      stock: 'In Stock',
      image: '🩺',
    },
    {
      id: '4',
      name: 'Premium Gym Membership (1 Month)',
      points: 3000,
      discount: discount,
      category: 'Fitness',
      stock: 'Limited',
      image: '🏋️',
    },
    {
      id: '5',
      name: 'Healthy Meal Kit Delivery',
      points: 1500,
      discount: discount,
      category: 'Nutrition',
      stock: 'In Stock',
      image: '🥗',
    },
    {
      id: '6',
      name: 'Meditation App Premium (3 Months)',
      points: 800,
      discount: discount,
      category: 'Wellness',
      stock: 'In Stock',
      image: '🧘',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/patient-portal/engagement"
            className="text-muted-foreground hover:text-foreground"
          >
            Engagement
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Rewards</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Gift className="h-10 w-10" />
          Rewards Catalog
        </h1>
        <p className="text-muted-foreground mt-2">
          Redeem your hard-earned points for exciting rewards and benefits
        </p>
      </div>

      {/* Points Balance */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Points</p>
                <p className="text-4xl font-bold">{availablePoints.toLocaleString()}</p>
              </div>
              <Coins className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level Discount</p>
                <p className="text-4xl font-bold text-green-600">{discount}%</p>
              </div>
              <Percent className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Redeemed</p>
                <p className="text-4xl font-bold">8</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Benefits Banner */}
      {currentLevel >= 20 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold">Level {currentLevel} Benefit Active!</p>
                <p className="text-sm text-muted-foreground">
                  You're getting {discount}% off all reward redemptions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Rewards</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const finalPoints = discount > 0
              ? Math.floor(reward.points * (1 - discount / 100))
              : reward.points;
            const canAfford = availablePoints >= finalPoints;

            return (
              <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-6xl">{reward.image}</div>
                    <Badge variant={reward.stock === 'In Stock' ? 'default' : 'secondary'}>
                      {reward.stock}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground">{reward.category}</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      {discount > 0 && reward.discount > 0 && (
                        <span className="text-lg text-muted-foreground line-through">
                          {reward.points.toLocaleString()}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-purple-600">
                        {finalPoints.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>

                    {discount > 0 && reward.discount > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Save {reward.points - finalPoints} points ({discount}% off)
                      </Badge>
                    )}

                    <Button
                      className="w-full"
                      disabled={!canAfford}
                      variant={canAfford ? 'default' : 'secondary'}
                    >
                      {canAfford ? 'Redeem Now' : 'Not Enough Points'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Earn More Points CTA */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Want More Points?</h2>
          <p className="opacity-90 mb-6">
            Complete health activities, join challenges, and achieve your goals to earn more points!
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/patient-portal/engagement/goals">Set a Goal</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/patient-portal/engagement/challenges">Join Challenge</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
