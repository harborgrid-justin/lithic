'use client'

import { useState } from 'react'
import { VitalSigns } from '@/types/clinical'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Heart, Thermometer, Wind, Droplets, Weight, Ruler } from 'lucide-react'

interface VitalsPanelProps {
  vitals: VitalSigns[]
  onAdd?: () => void
}

export function VitalsPanel({ vitals, onAdd }: VitalsPanelProps) {
  const latestVitals = vitals[0]

  if (!latestVitals) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vital Signs</CardTitle>
            {onAdd && (
              <Button onClick={onAdd} size="sm">
                Add Vitals
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No vitals recorded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vital Signs</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              Add Vitals
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Last recorded: {formatDateTime(latestVitals.recordedAt)} by {latestVitals.recordedBy}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {latestVitals.temperature && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Thermometer className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-lg font-semibold">
                  {latestVitals.temperature}°{latestVitals.temperatureUnit}
                </p>
              </div>
            </div>
          )}

          {latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Blood Pressure</p>
                <p className="text-lg font-semibold">
                  {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                </p>
              </div>
            </div>
          )}

          {latestVitals.heartRate && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-xs text-gray-500">Heart Rate</p>
                <p className="text-lg font-semibold">{latestVitals.heartRate} bpm</p>
              </div>
            </div>
          )}

          {latestVitals.respiratoryRate && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Wind className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-xs text-gray-500">Respiratory Rate</p>
                <p className="text-lg font-semibold">{latestVitals.respiratoryRate} /min</p>
              </div>
            </div>
          )}

          {latestVitals.oxygenSaturation && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Droplets className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">O2 Saturation</p>
                <p className="text-lg font-semibold">{latestVitals.oxygenSaturation}%</p>
              </div>
            </div>
          )}

          {latestVitals.weight && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Weight className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="text-lg font-semibold">
                  {latestVitals.weight} {latestVitals.weightUnit}
                </p>
              </div>
            </div>
          )}

          {latestVitals.height && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Ruler className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Height</p>
                <p className="text-lg font-semibold">
                  {latestVitals.height} {latestVitals.heightUnit}
                </p>
              </div>
            </div>
          )}

          {latestVitals.bmi && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Activity className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500">BMI</p>
                <p className="text-lg font-semibold">{latestVitals.bmi}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
