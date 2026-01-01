"use client"

import { Patient, Demographics } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateAge, formatDate, formatPhone, maskSSN } from '@/lib/utils';
import { User, Calendar, Mail, Phone, MapPin, Heart } from 'lucide-react';

interface PatientDemographicsProps {
  patient: Patient;
}

export function PatientDemographics({ patient }: PatientDemographicsProps) {
  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <div className="font-medium">
                {patient.firstName} {patient.middleName} {patient.lastName}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">MRN</label>
              <div className="font-mono font-medium">{patient.mrn}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Date of Birth</label>
              <div className="font-medium">
                {formatDate(patient.dateOfBirth)} ({age} years old)
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Gender</label>
              <div className="font-medium capitalize">{patient.gender}</div>
            </div>
            {patient.ssn && (
              <div>
                <label className="text-sm text-gray-500">SSN</label>
                <div className="font-medium font-mono">{maskSSN(patient.ssn)}</div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div>
                <Badge variant={patient.status === 'active' ? 'success' : 'secondary'}>
                  {patient.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {patient.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <div className="font-medium">{formatPhone(patient.phone)}</div>
                </div>
              </div>
            )}
            {patient.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <div className="font-medium">{patient.email}</div>
                </div>
              </div>
            )}
          </div>
          {patient.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm text-gray-500">Address</label>
                <div className="font-medium">
                  {patient.address.street1}
                  {patient.address.street2 && <>, {patient.address.street2}</>}
                  <br />
                  {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {patient.demographics && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {patient.demographics.race && (
                <div>
                  <label className="text-sm text-gray-500">Race</label>
                  <div className="font-medium">{patient.demographics.race}</div>
                </div>
              )}
              {patient.demographics.ethnicity && (
                <div>
                  <label className="text-sm text-gray-500">Ethnicity</label>
                  <div className="font-medium">{patient.demographics.ethnicity}</div>
                </div>
              )}
              {patient.preferredLanguage && (
                <div>
                  <label className="text-sm text-gray-500">Preferred Language</label>
                  <div className="font-medium">{patient.preferredLanguage}</div>
                </div>
              )}
              {patient.maritalStatus && (
                <div>
                  <label className="text-sm text-gray-500">Marital Status</label>
                  <div className="font-medium capitalize">{patient.maritalStatus.replace('-', ' ')}</div>
                </div>
              )}
              {patient.demographics.occupation && (
                <div>
                  <label className="text-sm text-gray-500">Occupation</label>
                  <div className="font-medium">{patient.demographics.occupation}</div>
                </div>
              )}
              {patient.demographics.employer && (
                <div>
                  <label className="text-sm text-gray-500">Employer</label>
                  <div className="font-medium">{patient.demographics.employer}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {patient.emergencyContacts && patient.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.emergencyContacts.map((contact) => (
                <div key={contact.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-red-400 mt-1" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {contact.name}
                        {contact.isPrimary && (
                          <Badge variant="default" className="ml-2">Primary</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.relationship}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatPhone(contact.phone)}
                        {contact.email && <> • {contact.email}</>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
