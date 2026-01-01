"use client";

import { Order } from "@/types/clinical";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Beaker,
  Image,
  Activity,
  Pill,
  UserPlus,
} from "lucide-react";

interface OrdersPanelProps {
  orders: Order[];
  onAdd?: () => void;
  onView?: (order: Order) => void;
}

export function OrdersPanel({ orders, onAdd, onView }: OrdersPanelProps) {
  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "warning",
      "in-progress": "info",
      completed: "success",
      cancelled: "danger",
    };
    return colors[status] as "warning" | "info" | "success" | "danger";
  };

  const getPriorityColor = (priority: Order["priority"]) => {
    const colors = {
      routine: "secondary",
      urgent: "warning",
      stat: "danger",
    };
    return colors[priority] as "secondary" | "warning" | "danger";
  };

  const getTypeIcon = (type: Order["type"]) => {
    const icons = {
      lab: Beaker,
      imaging: Image,
      procedure: Activity,
      medication: Pill,
      referral: UserPlus,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Orders
          </CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              New Order
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Ordering Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ordered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(order.type)}
                    <span className="capitalize">{order.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {order.description}
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(order.priority)}>
                    {order.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{order.orderingProviderName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(order.orderedAt)}</TableCell>
                <TableCell>
                  {onView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(order)}
                    >
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">No orders found</div>
        )}
      </CardContent>
    </Card>
  );
}
