'use client';

import { useRouter } from 'next/navigation';
import { reportingService } from '@/services/reporting.service';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';

export default function ReportBuilderPage() {
  const router = useRouter();

  const handleSave = async (reportData: any) => {
    try {
      const newReport = await reportingService.createReport(reportData);
      alert('Report created successfully!');
      router.push(`/analytics/reports/${newReport.id}`);
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to create report');
    }
  };

  const handleCancel = () => {
    router.push('/analytics/reports');
  };

  return (
    <ReportBuilder
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
