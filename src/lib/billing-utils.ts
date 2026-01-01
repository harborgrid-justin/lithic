// Billing-specific utility functions

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function generateClaimNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLM-${timestamp}${random}`;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}${random}`;
}

export function validateCPTCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

export function validateICDCode(code: string): boolean {
  return /^[A-Z]\d{2}\.?\d{0,4}$/.test(code);
}

export function validateNPI(npi: string): boolean {
  return /^\d{10}$/.test(npi);
}

export function calculateDaysInAR(
  claims: { dateOfService: string; paidAmount?: number }[],
): number {
  const unpaidClaims = claims.filter(
    (c) => !c.paidAmount || c.paidAmount === 0,
  );
  if (unpaidClaims.length === 0) return 0;

  const totalDays = unpaidClaims.reduce((sum, claim) => {
    const dos = new Date(claim.dateOfService);
    const today = new Date();
    const days = Math.floor(
      (today.getTime() - dos.getTime()) / (1000 * 60 * 60 * 24),
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / unpaidClaims.length);
}

export function getClaimStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    in_review: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    partially_paid: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    appealed: "bg-purple-100 text-purple-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    partial: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function calculateCollectionRate(
  totalCharges: number,
  totalPayments: number,
): number {
  if (totalCharges === 0) return 0;
  return Math.round((totalPayments / totalCharges) * 100);
}

export function calculateReimbursementRate(
  chargedAmount: number,
  paidAmount: number,
): number {
  if (chargedAmount === 0) return 0;
  return Math.round((paidAmount / chargedAmount) * 100);
}
