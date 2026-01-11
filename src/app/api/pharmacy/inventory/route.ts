/**
 * Inventory API Route
 * Handle pharmacy inventory management
 */

import { NextRequest, NextResponse } from "next/server";

// Mock inventory database
const inventory: any[] = [
  {
    id: "inv_001",
    drugId: "drug_001",
    drug: {
      id: "drug_001",
      ndc: "00378-1805-10",
      name: "Lisinopril",
      genericName: "Lisinopril",
      strength: "10mg",
      dosageForm: "Tablet",
      manufacturer: "Mylan Pharmaceuticals",
      category: "Cardiovascular",
      therapeutic_class: "ACE Inhibitor",
    },
    lotNumber: "LOT123456",
    expirationDate: "2026-12-31",
    quantity: 500,
    location: "Shelf A-12",
    reorderLevel: 200,
    reorderQuantity: 1000,
    costPerUnit: 0.15,
    wholesaler: "McKesson",
    lastRestocked: "2025-11-15",
    status: "in-stock",
  },
  {
    id: "inv_002",
    drugId: "drug_002",
    drug: {
      id: "drug_002",
      ndc: "00093-0058-01",
      name: "Hydrocodone/Acetaminophen",
      genericName: "Hydrocodone Bitartrate and Acetaminophen",
      strength: "5mg/325mg",
      dosageForm: "Tablet",
      manufacturer: "Teva Pharmaceuticals",
      deaSchedule: "II",
      category: "Analgesics",
      therapeutic_class: "Opioid Analgesic",
    },
    lotNumber: "LOT789012",
    expirationDate: "2026-06-30",
    quantity: 45,
    location: "Controlled-Safe-1",
    reorderLevel: 100,
    reorderQuantity: 500,
    costPerUnit: 0.85,
    wholesaler: "Cardinal Health",
    lastRestocked: "2025-12-01",
    status: "low-stock",
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const lowStock = searchParams.get("lowStock") === "true";
    const expiringSoon = searchParams.get("expiringSoon") === "true";

    let filtered = [...inventory];

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    if (lowStock) {
      filtered = filtered.filter((item) => item.quantity <= item.reorderLevel);
    }

    if (expiringSoon) {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      filtered = filtered.filter((item) => {
        const expirationDate = new Date(item.expirationDate);
        return (
          expirationDate <= ninetyDaysFromNow && expirationDate > new Date()
        );
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const newItem = {
      id: `inv_${Date.now()}`,
      ...data,
      status: "in-stock",
      lastRestocked: new Date().toISOString().split("T")[0] || "",
    };

    inventory.push(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    const index = inventory.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }

    inventory[index] = {
      ...inventory[index],
      ...updates,
    };

    // Update status based on quantity
    if (inventory[index].quantity <= 0) {
      inventory[index].status = "out-of-stock";
    } else if (inventory[index].quantity <= inventory[index].reorderLevel) {
      inventory[index].status = "low-stock";
    } else {
      inventory[index].status = "in-stock";
    }

    return NextResponse.json(inventory[index]);
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 },
    );
  }
}
