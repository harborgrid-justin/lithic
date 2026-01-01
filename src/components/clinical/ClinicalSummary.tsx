'use client'

import { Problem, Allergy, Medication, VitalSigns } from '@/types/clinical'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Pill, AlertCircle, Activity } from 'lucide-react'

interface ClinicalSummaryProps {
  problems: Problem[]
  allergies: Allergy[]
  medications: Medication[]
  latestVitals?: VitalSigns
}

export function ClinicalSummary({ problems, allergies, medications, latestVitals }: ClinicalSummaryProps) {
  const activeProblems = problems.filter(p => p.status === 'active' || p.status === 'chronic')
  const activeMedications = medications.filter(m => m.status === 'active')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5" />
            Active Problems
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeProblems.length > 0 ? (
            <div className="space-y-2">
              {activeProblems.slice(0, 5).map((problem) => (
                <div key={problem.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{problem.description}</p>
                    <p className="text-xs text-gray-500">ICD-10: {problem.icd10Code}</p>
                  </div>
                  <Badge variant={problem.status === 'chronic' ? 'warning' : 'danger'} className="ml-2">
                    {problem.status}
                  </Badge>
                </div>
              ))}
              {activeProblems.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{activeProblems.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active problems</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allergies.length > 0 ? (
            <div className="space-y-2">
              {allergies.slice(0, 5).map((allergy) => (
                <div key={allergy.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{allergy.allergen}</p>
                    <p className="text-xs text-gray-500">{allergy.reaction}</p>
                  </div>
                  <Badge
                    variant={allergy.severity === 'life-threatening' || allergy.severity === 'severe' ? 'danger' : 'warning'}
                    className="ml-2"
                  >
                    {allergy.severity}
                  </Badge>
                </div>
              ))}
              {allergies.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{allergies.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-green-600 font-medium">No Known Allergies</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5" />
            Active Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMedications.length > 0 ? (
            <div className="space-y-2">
              {activeMedications.slice(0, 5).map((medication) => (
                <div key={medication.id}>
                  <p className="text-sm font-medium">{medication.name}</p>
                  <p className="text-xs text-gray-500">
                    {medication.dosage} - {medication.frequency}
                  </p>
                </div>
              ))}
              {activeMedications.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{activeMedications.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active medications</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Latest Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestVitals ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {latestVitals.bloodPressureSystolic && (
                <div>
                  <p className="text-gray-500">BP</p>
                  <p className="font-medium">
                    {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                  </p>
                </div>
              )}
              {latestVitals.heartRate && (
                <div>
                  <p className="text-gray-500">HR</p>
                  <p className="font-medium">{latestVitals.heartRate} bpm</p>
                </div>
              )}
              {latestVitals.temperature && (
                <div>
                  <p className="text-gray-500">Temp</p>
                  <p className="font-medium">
                    {latestVitals.temperature}°{latestVitals.temperatureUnit}
                  </p>
                </div>
              )}
              {latestVitals.oxygenSaturation && (
                <div>
                  <p className="text-gray-500">O2 Sat</p>
                  <p className="font-medium">{latestVitals.oxygenSaturation}%</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No vitals recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
