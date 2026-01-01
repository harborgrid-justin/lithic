'use client'

import { VitalSigns } from '@/types/clinical'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface VitalsChartProps {
  vitals: VitalSigns[]
  metric: 'bloodPressure' | 'heartRate' | 'weight' | 'temperature'
}

export function VitalsChart({ vitals, metric }: VitalsChartProps) {
  const chartData = vitals
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(v => ({
      date: format(new Date(v.recordedAt), 'MM/dd'),
      systolic: v.bloodPressureSystolic,
      diastolic: v.bloodPressureDiastolic,
      heartRate: v.heartRate,
      weight: v.weight,
      temperature: v.temperature,
    }))

  const getChartTitle = () => {
    const titles = {
      bloodPressure: 'Blood Pressure Trends',
      heartRate: 'Heart Rate Trends',
      weight: 'Weight Trends',
      temperature: 'Temperature Trends',
    }
    return titles[metric]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {metric === 'bloodPressure' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" strokeWidth={2} />
              <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" strokeWidth={2} />
            </LineChart>
          ) : metric === 'heartRate' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="heartRate" stroke="#ec4899" name="Heart Rate (bpm)" strokeWidth={2} />
            </LineChart>
          ) : metric === 'weight' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#8b5cf6" name="Weight" strokeWidth={2} />
            </LineChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temperature" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
