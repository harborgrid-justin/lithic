'use client'

import { useEffect, useState } from 'react'
import { Problem, Allergy, Medication, VitalSigns, Order } from '@/types/clinical'
import { ClinicalSummary } from '@/components/clinical/ClinicalSummary'
import { OrdersPanel } from '@/components/clinical/OrdersPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Activity, ClipboardList, Stethoscope } from 'lucide-react'
import Link from 'next/link'

export default function ClinicalPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [vitals, setVitals] = useState<VitalSigns[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // In production, pass actual patient ID
      const patientId = 'P001'

      const [problemsRes, allergiesRes, medicationsRes, vitalsRes, ordersRes] = await Promise.all([
        fetch(`/api/clinical/problems?patientId=${patientId}`),
        fetch(`/api/clinical/allergies?patientId=${patientId}`),
        fetch(`/api/clinical/medications?patientId=${patientId}`),
        fetch(`/api/clinical/vitals?patientId=${patientId}`),
        fetch(`/api/clinical/orders?patientId=${patientId}`),
      ])

      setProblems(await problemsRes.json())
      setAllergies(await allergiesRes.json())
      setMedications(await medicationsRes.json())
      setVitals(await vitalsRes.json())
      setOrders(await ordersRes.json())
    } catch (error) {
      console.error('Failed to load clinical data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading clinical data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Documentation</h1>
            <p className="text-gray-600 mt-1">Electronic Health Records & Clinical Notes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/clinical/encounters">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Encounters</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View All</div>
                <p className="text-xs text-gray-500">Patient encounters & visits</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/clinical/notes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clinical Notes</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View All</div>
                <p className="text-xs text-gray-500">SOAP & Progress Notes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/clinical/vitals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vital Signs</CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track</div>
                <p className="text-xs text-gray-500">Monitor patient vitals</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/clinical/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-gray-500">Active orders</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <ClinicalSummary
          problems={problems}
          allergies={allergies}
          medications={medications}
          latestVitals={vitals[0]}
        />

        <OrdersPanel orders={orders.slice(0, 10)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/clinical/problems">
            <Button className="w-full" variant="outline">
              View Problem List
            </Button>
          </Link>
          <Link href="/clinical/allergies">
            <Button className="w-full" variant="outline">
              View Allergies
            </Button>
          </Link>
          <Link href="/clinical/medications">
            <Button className="w-full" variant="outline">
              View Medications
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
