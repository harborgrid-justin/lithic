'use client';

/**
 * Badge Gallery Component
 * Display badge collection with unlock progress and details modal
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Award, Trophy, Star, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BadgeGallery() {
  const [badges, setBadges] = useState<any[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/engagement/badges');
      const data = await response.json();
      setBadges(data.badges || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500';
      case 'uncommon':
        return 'bg-green-500';
      case 'rare':
        return 'bg-blue-500';
      case 'epic':
        return 'bg-purple-500';
      case 'legendary':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Trophy className="h-4 w-4" />;
      case 'epic':
        return <Sparkles className="h-4 w-4" />;
      case 'rare':
        return <Star className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const filteredBadges = badges.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return b.badge.category === filter;
  });

  const stats = {
    total: badges.length,
    unlocked: badges.filter((b) => b.unlocked).length,
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {stats.unlocked} / {stats.total}
              </p>
              <p className="text-sm text-muted-foreground">Badges Unlocked</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((stats.unlocked / stats.total) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Collection</p>
            </div>
          </div>
          <Progress
            value={(stats.unlocked / stats.total) * 100}
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
          <TabsTrigger value="health_tracking">Health</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredBadges.map((badgeData, index) => {
          const { badge, unlocked, unlockedAt } = badgeData;

          return (
            <Card
              key={badge.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                unlocked ? 'border-2 border-purple-500' : 'opacity-60'
              }`}
              onClick={() => setSelectedBadge(badgeData)}
            >
              <CardContent className="p-4">
                <div className="relative">
                  <div className="text-center">
                    <div className={`text-5xl ${unlocked ? '' : 'grayscale'}`}>
                      {unlocked ? badge.icon : '🔒'}
                    </div>
                    <p className="mt-2 text-xs font-medium line-clamp-2">
                      {badge.name}
                    </p>
                  </div>

                  {unlocked && (
                    <div
                      className={`absolute -top-2 -right-2 rounded-full p-1 ${getRarityColor(
                        badge.rarity
                      )}`}
                    >
                      {getRarityIcon(badge.rarity)}
                    </div>
                  )}

                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Badge Details Dialog */}
      {selectedBadge && (
        <Dialog
          open={!!selectedBadge}
          onOpenChange={() => setSelectedBadge(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="text-6xl">{selectedBadge.badge.icon}</div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl">
                    {selectedBadge.badge.name}
                  </DialogTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getRarityColor(selectedBadge.badge.rarity)}
                    >
                      {selectedBadge.badge.rarity}
                    </Badge>
                    <Badge variant="secondary">
                      {selectedBadge.badge.points} points
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBadge.badge.description}
                </p>
              </div>

              {selectedBadge.unlocked ? (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✓ Unlocked
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {formatDistanceToNow(new Date(selectedBadge.unlockedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/20">
                  <p className="text-sm font-medium">How to Unlock</p>
                  <p className="text-sm text-muted-foreground">
                    Complete the required criteria to unlock this badge
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Category</p>
                <Badge variant="outline">
                  {selectedBadge.badge.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
