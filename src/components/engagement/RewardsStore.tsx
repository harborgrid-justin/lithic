/**
 * Rewards Redemption Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Reward } from "@/types/engagement";
import { Gift, Star, Package } from "lucide-react";

interface RewardsStoreProps {
  rewards: Reward[];
  availablePoints: number;
  onRedeem?: (reward: Reward) => void;
  className?: string;
}

export function RewardsStore({
  rewards,
  availablePoints,
  onRedeem,
  className,
}: RewardsStoreProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rewards Store</CardTitle>
            <div className="flex items-center gap-2 text-lg font-bold text-yellow-600">
              <Star className="h-5 w-5" />
              {availablePoints.toLocaleString()} points
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const canAfford = availablePoints >= reward.pointCost;
          const isAvailable = reward.inventory === null || reward.inventory > 0;

          return (
            <Card key={reward.id} className={!canAfford || !isAvailable ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{reward.name}</CardTitle>
                  {reward.isFeatured && (
                    <Badge variant="default">Featured</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {reward.imageUrl && (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {reward.description}
                </p>

                <div className="flex items-center justify-between">
                  <Badge variant="outline">{reward.category}</Badge>
                  <div className="flex items-center gap-1 font-bold text-yellow-600">
                    <Gift className="h-4 w-4" />
                    {reward.pointCost.toLocaleString()}
                  </div>
                </div>

                {reward.inventory !== null && (
                  <div className="text-sm text-muted-foreground">
                    <Package className="h-4 w-4 inline mr-1" />
                    {reward.inventory} left
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => onRedeem?.(reward)}
                  disabled={!canAfford || !isAvailable}
                  className="w-full"
                >
                  {!isAvailable ? "Out of Stock" : !canAfford ? "Not Enough Points" : "Redeem"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
