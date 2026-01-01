"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/types/billing";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvoiceStatusColor } from "@/lib/billing-utils";
import { ArrowLeft, Printer, Send, DollarSign } from "lucide-react";

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        router.push("/billing/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      router.push("/billing/invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push("/billing/invoices")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoices
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          {invoice && invoice.status === "draft" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Send className="w-5 h-5" />
              Send Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      ) : invoice ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">INVOICE</h1>
                <p className="mt-2 text-primary-100">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-100">Date</p>
                <p className="font-semibold">
                  {formatDate(invoice.dateOfService)}
                </p>
                <p className="text-sm text-primary-100 mt-2">Due Date</p>
                <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">BILL TO</h3>
            <p className="text-lg font-semibold text-gray-900">
              {invoice.patientName}
            </p>
            <p className="text-sm text-gray-600">
              Patient ID: {invoice.patientId}
            </p>
          </div>

          {/* Items */}
          <div className="p-8">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      {item.code || "-"}
                    </td>
                    <td className="py-4 text-sm text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-sm text-right text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 px-8 py-6">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.tax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-primary-600">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Balance Due:</span>
                <span className="text-orange-600">
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="px-8 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getInvoiceStatusColor(invoice.status)}`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Created: {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Invoice not found</p>
        </div>
      )}
    </div>
  );
}
