/**
 * Quality Gap Card Component
 * Display care gaps and quality measure opportunities
 */

'use client';

import React from 'react';
import { TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface QualityGap {
  id: string;
  measureId: string;
  measureName: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
  dueDate?: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  estimatedImpact: {
    qualityScore: number; // 0-100
    reimbursementImpact?: number;
  };
}

interface QualityGapCardProps {
  gap: QualityGap;
  onAction?: (gapId: string, action: 'close' | 'start' | 'complete') => void;
  showActions?: boolean;
}

export function QualityGapCard({ gap, onAction, showActions = true }: QualityGapCardProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700',
        };
      case 'MEDIUM':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
        };
      case 'LOW':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          borderColor: 'border-blue-300 dark:border-blue-700',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN':
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          icon: <AlertCircle className="h-4 w-4" />,
        };
      case 'IN_PROGRESS':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      case 'COMPLETED':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case 'CLOSED':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  };

  const priorityConfig = getPriorityConfig(gap.priority);
  const statusConfig = getStatusConfig(gap.status);

  const isOverdue = gap.dueDate && new Date(gap.dueDate) < new Date();

  return (
    <Card className={`border-l-4 ${priorityConfig.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={priorityConfig.color}>{gap.priority} Priority</Badge>
              <Badge className={statusConfig.color}>
                <span className="flex items-center space-x-1">
                  {statusConfig.icon}
                  <span>{gap.status.replace('_', ' ')}</span>
                </span>
              </Badge>
              <Badge variant="outline">{gap.category}</Badge>
            </div>
            <CardTitle className="text-base">{gap.measureName}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">{gap.description}</p>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
            Recommended Action:
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">{gap.recommendation}</p>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Quality Impact
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                +{gap.estimatedImpact.qualityScore}
              </div>
              <Progress value={gap.estimatedImpact.qualityScore} className="h-2" />
            </div>
          </div>

          {gap.estimatedImpact.reimbursementImpact !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Financial Impact
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${gap.estimatedImpact.reimbursementImpact.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {gap.dueDate && (
          <div
            className={`flex items-center space-x-2 text-sm ${
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {new Date(gap.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {showActions && gap.status !== 'COMPLETED' && gap.status !== 'CLOSED' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {gap.status === 'OPEN' && onAction && (
              <Button
                size="sm"
                onClick={() => onAction(gap.id, 'start')}
                className="flex-1"
              >
                Start Action
              </Button>
            )}
            {gap.status === 'IN_PROGRESS' && onAction && (
              <Button
                size="sm"
                onClick={() => onAction(gap.id, 'complete')}
                className="flex-1"
              >
                Mark Complete
              </Button>
            )}
            {onAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(gap.id, 'close')}
              >
                Close Gap
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quality Gap List Component
 */
interface QualityGapListProps {
  gaps: QualityGap[];
  onAction?: (gapId: string, action: 'close' | 'start' | 'complete') => void;
  filterStatus?: QualityGap['status'];
}

export function QualityGapList({ gaps, onAction, filterStatus }: QualityGapListProps) {
  const filteredGaps = filterStatus
    ? gaps.filter(gap => gap.status === filterStatus)
    : gaps;

  const sortedGaps = [...filteredGaps].sort((a, b) => {
    // Sort by priority first
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by quality score impact
    return b.estimatedImpact.qualityScore - a.estimatedImpact.qualityScore;
  });

  if (sortedGaps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">No Quality Gaps</p>
            <p className="text-sm mt-2">All quality measures are being met</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Quality Gaps ({sortedGaps.length})
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Total Impact:</span>
          <span className="font-semibold">
            +
            {sortedGaps.reduce((sum, gap) => sum + gap.estimatedImpact.qualityScore, 0)}{' '}
            points
          </span>
        </div>
      </div>

      {sortedGaps.map(gap => (
        <QualityGapCard key={gap.id} gap={gap} onAction={onAction} />
      ))}
    </div>
  );
}
