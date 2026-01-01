"use client";

import React, { useEffect, useState } from "react";
import { LabOrder, OrderStatus } from "@/types/laboratory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { FileText, Eye, XCircle } from "lucide-react";
import LaboratoryService from "@/services/laboratory.service";

interface LabOrderListProps {
  filters?: {
    status?: OrderStatus;
    patientId?: string;
  };
  onViewOrder?: (order: LabOrder) => void;
}

export default function LabOrderList({
  filters,
  onViewOrder,
}: LabOrderListProps) {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await LaboratoryService.getOrders(filters);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, any> = {
      PENDING: "warning",
      COLLECTED: "default",
      IN_PROGRESS: "default",
      COMPLETED: "success",
      CANCELLED: "destructive",
      RESULTED: "success",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, any> = {
      STAT: "destructive",
      URGENT: "warning",
      ASAP: "warning",
      ROUTINE: "outline",
    };

    return <Badge variant={colors[priority] || "outline"}>{priority}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading orders...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Laboratory Orders ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>MRN</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Physician</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.patientName}</TableCell>
                  <TableCell>{order.patientMRN}</TableCell>
                  <TableCell>
                    {order.panels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {order.panels.map((panel) => (
                          <Badge
                            key={panel}
                            variant="outline"
                            className="text-xs"
                          >
                            {panel}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {order.tests.length} test(s)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(order.orderDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.orderingPhysician}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewOrder?.(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
