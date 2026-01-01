import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-6">
          <Link href="/laboratory" className="font-bold text-xl">
            Lithic LIS
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/laboratory" className="hover:text-primary">
              Dashboard
            </Link>
            <Link href="/laboratory/orders" className="hover:text-primary">
              Orders
            </Link>
            <Link href="/laboratory/results" className="hover:text-primary">
              Results
            </Link>
            <Link href="/laboratory/specimens" className="hover:text-primary">
              Specimens
            </Link>
            <Link href="/laboratory/panels" className="hover:text-primary">
              Panels
            </Link>
            <Link href="/laboratory/reference" className="hover:text-primary">
              Reference
            </Link>
            <Link href="/laboratory/qc" className="hover:text-primary">
              QC
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
