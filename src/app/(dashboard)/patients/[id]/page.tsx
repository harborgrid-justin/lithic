"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Patient } from "@/types/patient";
import { patientService } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAge, formatPhone } from "@/lib/utils";
import { ArrowLeft, Edit, User, Phone, Mail, MapPin } from "lucide-react";

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatient(patientId);
      setPatient(data);
    } catch (error) {
      console.error("Failed to load patient:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12">Patient not found</div>;
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">MRN: {patient.mrn}</span>
                <Badge
                  variant={
                    patient.status === "active" ? "success" : "secondary"
                  }
                >
                  {patient.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            onClick={() => router.push("/patients/" + patient.id + "/edit")}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href={"/patients/" + patient.id + "/demographics"}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Demographics
          </Link>
          <Link
            href={"/patients/" + patient.id + "/insurance"}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Insurance
          </Link>
          <Link
            href={"/patients/" + patient.id + "/contacts"}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Contacts
          </Link>
          <Link
            href={"/patients/" + patient.id + "/documents"}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Documents
          </Link>
          <Link
            href={"/patients/" + patient.id + "/history"}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            History
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Age</div>
              <div className="font-medium">{age} years old</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Gender</div>
              <div className="font-medium capitalize">{patient.gender}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Date of Birth</div>
              <div className="font-medium">{patient.dateOfBirth}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div className="font-medium">{formatPhone(patient.phone)}</div>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div className="font-medium">{patient.email}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.address ? (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div className="text-sm">
                  {patient.address.street1}
                  {patient.address.street2 && <>, {patient.address.street2}</>}
                  <br />
                  {patient.address.city}, {patient.address.state}{" "}
                  {patient.address.zipCode}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No address on file</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
