/**
 * Order Set Builder Component
 * Interactive clinical order set selection and customization
 */

'use client';

import React, { useState } from 'react';
import { FileText, Plus, Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ClinicalOrder {
  id: string;
  type: 'MEDICATION' | 'LAB' | 'IMAGING' | 'PROCEDURE' | 'CONSULTATION' | 'NURSING';
  priority: 'STAT' | 'URGENT' | 'ROUTINE' | 'PRN';
  name: string;
  description: string;
  instructions: string;
  selected: boolean;
  required: boolean;
  category: string;
  safetyChecks: {
    passed: boolean;
    warnings: string[];
  };
  evidence?: {
    guideline: string;
    strengthOfRecommendation: 'STRONG' | 'MODERATE' | 'WEAK';
  };
}

export interface OrderGroup {
  id: string;
  name: string;
  description: string;
  orders: ClinicalOrder[];
  required: boolean;
  selectAll: boolean;
  selectMax?: number;
}

interface OrderSetBuilderProps {
  orderGroups: OrderGroup[];
  orderSetName: string;
  orderSetDescription: string;
  onOrderToggle: (orderId: string) => void;
  onSubmit: (selectedOrders: ClinicalOrder[]) => void;
  onCancel: () => void;
}

export function OrderSetBuilder({
  orderGroups,
  orderSetName,
  orderSetDescription,
  onOrderToggle,
  onSubmit,
  onCancel,
}: OrderSetBuilderProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(orderGroups.map(g => g.id))
  );

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getSelectedOrders = (): ClinicalOrder[] => {
    return orderGroups.flatMap(group => group.orders.filter(order => order.selected));
  };

  const getTotalSelectedCount = (): number => {
    return getSelectedOrders().length;
  };

  const hasWarnings = (): boolean => {
    return getSelectedOrders().some(
      order => order.safetyChecks && order.safetyChecks.warnings.length > 0
    );
  };

  const handleSubmit = () => {
    const selected = getSelectedOrders();
    onSubmit(selected);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'STAT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ROUTINE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PRN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'MEDICATION':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'LAB':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'IMAGING':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-2">{orderSetName}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {orderSetDescription}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold">{getTotalSelectedCount()}</span> orders selected
            </div>
            {hasWarnings() && (
              <Badge variant="danger">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Safety Warnings
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Groups */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {orderGroups.map(group => {
            const isExpanded = expandedGroups.has(group.id);
            const selectedInGroup = group.orders.filter(o => o.selected).length;

            return (
              <Card key={group.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        {group.required && (
                          <Badge variant="danger" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {selectedInGroup}/{group.orders.length} selected
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3">
                    {group.orders.map(order => (
                      <div
                        key={order.id}
                        className={`border rounded-lg p-4 ${
                          order.selected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={order.selected}
                            onCheckedChange={() => onOrderToggle(order.id)}
                            disabled={order.required}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold text-sm">{order.name}</h4>
                                  {order.required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {order.description}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-2">
                                <Badge className={getPriorityBadgeColor(order.priority)}>
                                  {order.priority}
                                </Badge>
                                <Badge className={getTypeBadgeColor(order.type)}>
                                  {order.type}
                                </Badge>
                              </div>
                            </div>

                            {order.instructions && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mb-2">
                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Instructions:</span>{' '}
                                  {order.instructions}
                                </p>
                              </div>
                            )}

                            {order.evidence && (
                              <div className="flex items-center space-x-2 mb-2">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {order.evidence.guideline} -{' '}
                                  <span className="font-semibold">
                                    {order.evidence.strengthOfRecommendation}
                                  </span>{' '}
                                  recommendation
                                </span>
                              </div>
                            )}

                            {order.safetyChecks && !order.safetyChecks.passed && (
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
                                      Safety Warnings:
                                    </p>
                                    <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                                      {order.safetyChecks.warnings.map((warning, idx) => (
                                        <li key={idx}>• {warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}

                            {order.safetyChecks &&
                              order.safetyChecks.passed &&
                              order.safetyChecks.warnings.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                                  <div className="flex items-start space-x-2">
                                    <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                        Cautions:
                                      </p>
                                      <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                                        {order.safetyChecks.warnings.map((warning, idx) => (
                                          <li key={idx}>• {warning}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasWarnings() && (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Review safety warnings before submitting
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={getTotalSelectedCount() === 0}
                className="flex items-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit {getTotalSelectedCount()} Orders</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
