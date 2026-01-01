"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";

export default function UsersPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users in your organization
          </p>
        </div>
        <Button onClick={() => router.push("/admin/users/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <UserManagement />
    </div>
  );
}
