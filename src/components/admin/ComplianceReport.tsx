'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ComplianceReport() {
  const [generating, setGenerating] = useState(false);

  const generateReport = async (reportType: string) => {
    setGenerating(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reportType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Report generated successfully');
        // Download report
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString()}.json`;
        a.click();
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const complianceStatus = [
    {
      name: 'HIPAA Compliance',
      status: 'compliant',
      description: 'Protected Health Information access logging',
      items: [
        { label: 'Audit logs enabled', status: 'pass' },
        { label: 'PHI access tracking', status: 'pass' },
        { label: 'Data encryption', status: 'pass' },
        { label: 'BAA signed', status: 'pass' },
      ],
    },
    {
      name: 'SOC 2 Type II',
      status: 'partial',
      description: 'Security and availability controls',
      items: [
        { label: 'Access controls', status: 'pass' },
        { label: 'MFA enforcement', status: 'warning' },
        { label: 'Security monitoring', status: 'pass' },
        { label: 'Incident response', status: 'pass' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {complianceStatus.map((compliance) => (
          <Card key={compliance.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{compliance.name}</CardTitle>
                <Badge
                  variant={compliance.status === 'compliant' ? 'default' : 'secondary'}
                  className={
                    compliance.status === 'compliant'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {compliance.status === 'compliant' ? 'Compliant' : 'Partial'}
                </Badge>
              </div>
              <CardDescription>{compliance.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {compliance.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    {item.status === 'pass' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Compliance Reports</CardTitle>
          <CardDescription>Export compliance documentation for audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => generateReport('HIPAA')}
              disabled={generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              HIPAA Report
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport('SOC2')}
              disabled={generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              SOC 2 Report
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport('GENERAL')}
              disabled={generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              General Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span>BAA agreement signed with XYZ Hospital</span>
              <span className="text-muted-foreground">2 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span>Quarterly security audit completed</span>
              <span className="text-muted-foreground">1 week ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>PHI access review performed</span>
              <span className="text-muted-foreground">2 weeks ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
