'use client';

/**
 * Lithic Enterprise Design System Documentation
 *
 * Living style guide showcasing all design system components,
 * tokens, patterns, and accessibility guidelines.
 */

import React, { useState } from 'react';
import { Palette, Type, Layout, Box, Zap, Shield, Heart, Activity } from 'lucide-react';

// Import components for examples
import { DataTable, Column } from '@/components/enterprise/data-display/DataTable';
import { StatCard } from '@/components/enterprise/data-display/StatCard';
import { MetricGrid } from '@/components/enterprise/data-display/MetricGrid';
import { Timeline } from '@/components/enterprise/data-display/Timeline';
import { SmartSearch } from '@/components/enterprise/inputs/SmartSearch';
import { MultiSelect } from '@/components/enterprise/inputs/MultiSelect';
import { DateRangePicker } from '@/components/enterprise/inputs/DateRangePicker';
import { AlertBanner } from '@/components/enterprise/feedback/AlertBanner';
import { ProgressTracker } from '@/components/enterprise/feedback/ProgressTracker';
import { LoadingSkeleton } from '@/components/enterprise/feedback/LoadingSkeleton';
import { EmptyState } from '@/components/enterprise/feedback/EmptyState';
import { Breadcrumb } from '@/components/enterprise/navigation/Breadcrumb';
import { TabNavigator } from '@/components/enterprise/navigation/TabNavigator';
import { CommandPalette } from '@/components/enterprise/navigation/CommandPalette';
import { PatientBanner } from '@/components/enterprise/healthcare/PatientBanner';
import { VitalSignsDisplay } from '@/components/enterprise/healthcare/VitalSignsDisplay';
import { AllergyBadge } from '@/components/enterprise/healthcare/AllergyBadge';
import { DiagnosisChip } from '@/components/enterprise/healthcare/DiagnosisChip';
import { designTokens } from '@/lib/design-system/tokens';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'tokens', label: 'Design Tokens', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'data-display', label: 'Data Display', icon: Box },
    { id: 'inputs', label: 'Input Components', icon: Zap },
    { id: 'navigation', label: 'Navigation', icon: Activity },
    { id: 'feedback', label: 'Feedback', icon: Shield },
    { id: 'healthcare', label: 'Healthcare', icon: Heart },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-bold mb-2">Lithic Enterprise Design System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive, accessible, and healthcare-optimized design system built for enterprise applications.
        </p>
      </div>

      {/* Navigation Tabs */}
      <TabNavigator
        tabs={sections.map(s => ({
          id: s.id,
          label: s.label,
          icon: <s.icon className="w-4 h-4" />,
        }))}
        activeId={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Content Sections */}
      <div className="space-y-12">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'tokens' && <TokensSection />}
        {activeTab === 'typography' && <TypographySection />}
        {activeTab === 'data-display' && <DataDisplaySection />}
        {activeTab === 'inputs' && <InputsSection />}
        {activeTab === 'navigation' && <NavigationSection />}
        {activeTab === 'feedback' && <FeedbackSection />}
        {activeTab === 'healthcare' && <HealthcareSection />}
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <div className="prose max-w-none">
          <p className="text-lg">
            The Lithic Enterprise Design System is a world-class component library designed specifically
            for healthcare applications, surpassing Epic&apos;s Hyperspace UI in functionality and accessibility.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'WCAG 2.1 AA Compliant', description: 'All components meet accessibility standards' },
              { title: 'Healthcare Optimized', description: 'Purpose-built for clinical workflows' },
              { title: 'Fully Responsive', description: 'Works seamlessly on all devices' },
              { title: 'Dark Mode Support', description: 'Reduces eye strain for 24/7 operations' },
              { title: 'TypeScript Native', description: 'Full type safety and IntelliSense' },
              { title: 'Keyboard First', description: 'Complete keyboard navigation support' },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Component Categories</h3>
          <ul className="space-y-2">
            <li><strong>Data Display:</strong> Tables, timelines, trees, metrics, charts</li>
            <li><strong>Input Components:</strong> Smart search, multi-select, date pickers, code inputs</li>
            <li><strong>Navigation:</strong> Mega menus, breadcrumbs, tabs, command palette</li>
            <li><strong>Feedback:</strong> Alerts, progress trackers, loading states, error boundaries</li>
            <li><strong>Layout:</strong> Enterprise layouts, split panes, modals, dashboards</li>
            <li><strong>Healthcare:</strong> Patient banners, vital signs, medications, allergies</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}

function TokensSection() {
  return (
    <div className="space-y-8">
      <Section title="Color Palette">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(designTokens.colors.semantic).map(([name, colors]) => (
                <div key={name} className="space-y-2">
                  <div className="text-sm font-medium capitalize">{name}</div>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: colors.light }} />
                  <code className="text-xs">{colors.light}</code>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Clinical Status Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(designTokens.colors.clinical).map(([name, color]) => (
                <div key={name} className="space-y-2">
                  <div className="text-sm font-medium capitalize">{name}</div>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: color }} />
                  <code className="text-xs">{color}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Typography Scale">
        <div className="space-y-4">
          {Object.entries(designTokens.typography.fontSize).map(([size, value]) => (
            <div key={size} className="flex items-center gap-4 border-b border-border pb-4">
              <code className="w-20 text-sm text-muted-foreground">{size}</code>
              <div style={{ fontSize: value }} className="font-semibold">
                The quick brown fox jumps over the lazy dog
              </div>
              <code className="ml-auto text-sm text-muted-foreground">{value}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing System">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 4, 6, 8, 12, 16, 24].map(size => (
            <div key={size} className="space-y-2">
              <code className="text-sm">{size}</code>
              <div className="bg-primary h-6" style={{ width: designTokens.spacing[size] }} />
              <code className="text-xs text-muted-foreground">{designTokens.spacing[size]}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function TypographySection() {
  return (
    <div className="space-y-8">
      <Section title="Headings">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold">Heading 1</h1>
          <h2 className="text-5xl font-bold">Heading 2</h2>
          <h3 className="text-4xl font-bold">Heading 3</h3>
          <h4 className="text-3xl font-bold">Heading 4</h4>
          <h5 className="text-2xl font-bold">Heading 5</h5>
          <h6 className="text-xl font-bold">Heading 6</h6>
        </div>
      </Section>

      <Section title="Body Text">
        <div className="space-y-4">
          <p className="text-lg">
            Large body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p>
            Normal body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p className="text-sm">
            Small body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p className="text-xs">
            Extra small body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
      </Section>
    </div>
  );
}

function DataDisplaySection() {
  const sampleData = [
    { id: '1', name: 'John Doe', age: 45, mrn: 'MRN-001', status: 'Active' },
    { id: '2', name: 'Jane Smith', age: 32, mrn: 'MRN-002', status: 'Active' },
    { id: '3', name: 'Bob Johnson', age: 58, mrn: 'MRN-003', status: 'Discharged' },
  ];

  const columns: Column<typeof sampleData[0]>[] = [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'age', header: 'Age', accessor: 'age', sortable: true },
    { id: 'mrn', header: 'MRN', accessor: 'mrn' },
    { id: 'status', header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="space-y-8">
      <Section title="Data Table">
        <DataTable data={sampleData} columns={columns} />
      </Section>

      <Section title="Metric Cards">
        <MetricGrid
          metrics={[
            { id: '1', title: 'Total Patients', value: 1248, icon: Activity, trend: 'up', change: 12 },
            { id: '2', title: 'Active Cases', value: 856, icon: Heart, trend: 'up', change: 5 },
            { id: '3', title: 'Completed Today', value: 42, icon: Shield, trend: 'down', change: -3 },
          ]}
          columns={3}
        />
      </Section>

      <Section title="Timeline">
        <Timeline
          events={[
            { id: '1', title: 'Lab results reviewed', description: 'All values within normal range', timestamp: new Date(), status: 'success' },
            { id: '2', title: 'Medication administered', description: 'Aspirin 81mg', timestamp: new Date(Date.now() - 3600000), status: 'info' },
            { id: '3', title: 'Vitals recorded', timestamp: new Date(Date.now() - 7200000), status: 'info' },
          ]}
        />
      </Section>
    </div>
  );
}

function InputsSection() {
  return (
    <div className="space-y-8">
      <Section title="Smart Search">
        <SmartSearch
          onSearch={(q) => console.log('Search:', q)}
          placeholder="Search patients, medications, procedures..."
        />
      </Section>

      <Section title="Multi Select">
        <MultiSelect
          options={[
            { value: 'diabetes', label: 'Diabetes' },
            { value: 'hypertension', label: 'Hypertension' },
            { value: 'asthma', label: 'Asthma' },
          ]}
          value={[]}
          onChange={() => {}}
        />
      </Section>

      <Section title="Date Range Picker">
        <DateRangePicker
          onChange={() => {}}
        />
      </Section>
    </div>
  );
}

function NavigationSection() {
  return (
    <div className="space-y-8">
      <Section title="Breadcrumb">
        <Breadcrumb
          items={[
            { label: 'Patients', href: '/patients' },
            { label: 'John Doe', href: '/patients/123' },
            { label: 'Chart' },
          ]}
        />
      </Section>

      <Section title="Command Palette">
        <CommandPalette
          commands={[
            { id: '1', label: 'New Patient', action: () => {}, category: 'Actions' },
            { id: '2', label: 'Search Records', action: () => {}, category: 'Actions' },
            { id: '3', label: 'View Dashboard', action: () => {}, category: 'Navigation' },
          ]}
        />
      </Section>
    </div>
  );
}

function FeedbackSection() {
  return (
    <div className="space-y-8">
      <Section title="Alert Banners">
        <div className="space-y-4">
          <AlertBanner type="info" message="This is an informational message" />
          <AlertBanner type="success" message="Operation completed successfully" />
          <AlertBanner type="warning" message="Please review the following items" />
          <AlertBanner type="error" message="An error occurred during processing" />
        </div>
      </Section>

      <Section title="Progress Tracker">
        <ProgressTracker
          steps={[
            { id: '1', label: 'Registration', status: 'completed' },
            { id: '2', label: 'Triage', status: 'current' },
            { id: '3', label: 'Examination', status: 'upcoming' },
            { id: '4', label: 'Discharge', status: 'upcoming' },
          ]}
        />
      </Section>

      <Section title="Loading Skeleton">
        <LoadingSkeleton variant="card" count={1} />
      </Section>

      <Section title="Empty State">
        <EmptyState
          title="No records found"
          description="There are no patient records matching your criteria"
          variant="search"
        />
      </Section>
    </div>
  );
}

function HealthcareSection() {
  return (
    <div className="space-y-8">
      <Section title="Patient Banner">
        <PatientBanner
          patient={{
            id: '1',
            mrn: 'MRN-12345',
            name: 'John Doe',
            dateOfBirth: new Date('1978-05-15'),
            age: 45,
            gender: 'M',
            phone: '(555) 123-4567',
            allergies: ['Penicillin', 'Latex'],
            alerts: ['Fall Risk'],
          }}
        />
      </Section>

      <Section title="Vital Signs Display">
        <VitalSignsDisplay
          vitals={[
            { type: 'bp', value: '120/80', unit: 'mmHg', status: 'normal' },
            { type: 'hr', value: 72, unit: 'bpm', status: 'normal' },
            { type: 'temp', value: 98.6, unit: '°F', status: 'normal' },
            { type: 'o2', value: 98, unit: '%', status: 'normal' },
          ]}
        />
      </Section>

      <Section title="Allergy Badges">
        <div className="flex flex-wrap gap-3">
          <AllergyBadge allergy={{ allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' }} variant="compact" />
          <AllergyBadge allergy={{ allergen: 'Latex', severity: 'moderate', reaction: 'Rash' }} variant="compact" />
          <AllergyBadge allergy={{ allergen: 'Pollen', severity: 'mild' }} variant="compact" />
        </div>
      </Section>

      <Section title="Diagnosis Chips">
        <div className="flex flex-wrap gap-3">
          <DiagnosisChip diagnosis={{ code: 'E11.9', description: 'Type 2 Diabetes', type: 'primary', status: 'active', isPrimary: true }} variant="compact" />
          <DiagnosisChip diagnosis={{ code: 'I10', description: 'Hypertension', type: 'secondary', status: 'active' }} variant="compact" />
          <DiagnosisChip diagnosis={{ code: 'J44.9', description: 'COPD', type: 'differential', status: 'active' }} variant="compact" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold border-b border-border pb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
