"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Patient, EmergencyContact } from "@/types/patient";
import { patientService } from "@/services/patient.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/utils";
import { ArrowLeft, Plus, Heart, Phone, Mail, MapPin } from "lucide-react";

export default function PatientContactsPage() {
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

  const contacts = patient.emergencyContacts || [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={"/patients/" + patientId}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patient
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Emergency Contacts
            </h1>
            <p className="text-gray-500 mt-1">
              Manage emergency contact information
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No emergency contacts on file
        </div>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                  </div>
                  {contact.isPrimary && (
                    <Badge variant="default">Primary Contact</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Relationship</div>
                  <div className="font-medium">{contact.relationship}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="font-medium">
                    {formatPhone(contact.phone)}
                  </div>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div className="font-medium">{contact.email}</div>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="text-sm">
                      {contact.address.street1}
                      {contact.address.street2 && (
                        <>, {contact.address.street2}</>
                      )}
                      <br />
                      {contact.address.city}, {contact.address.state}{" "}
                      {contact.address.zipCode}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
