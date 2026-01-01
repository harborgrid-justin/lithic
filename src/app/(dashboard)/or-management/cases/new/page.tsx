import { Metadata } from "next";
import { CaseForm } from "@/components/or/case-form";

export const metadata: Metadata = {
  title: "Schedule New Case | Lithic",
  description: "Schedule a new surgical case",
};

export default function NewCasePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule New Surgical Case</h1>
        <p className="text-gray-600">Complete the form to schedule a new surgical case</p>
      </div>
      <CaseForm />
    </div>
  );
}
