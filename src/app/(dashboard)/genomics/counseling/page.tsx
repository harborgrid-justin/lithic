'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, Phone, MessageSquare, CheckCircle2, Heart } from 'lucide-react';

export default function GeneticCounselingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    consultationType: '',
    reason: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to API
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genetic Counseling</h1>
        <p className="text-muted-foreground mt-1">
          Schedule a consultation with our certified genetic counselors
        </p>
      </div>

      {/* Why Genetic Counseling */}
      <Alert>
        <Heart className="h-4 w-4" />
        <AlertDescription>
          Genetic counseling helps you understand your test results, discuss health implications, and make informed decisions about your healthcare and family planning.
        </AlertDescription>
      </Alert>

      {/* Consultation Options */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Video className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Video Consultation</CardTitle>
            <CardDescription>
              Secure video call from anywhere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              45-60 minutes • Most popular option
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Phone className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Phone Consultation</CardTitle>
            <CardDescription>
              Convenient phone discussion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              30-45 minutes • Quick and easy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">In-Person</CardTitle>
            <CardDescription>
              Face-to-face meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              60 minutes • Comprehensive review
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Your Consultation</CardTitle>
            <CardDescription>
              Fill out the form below and we'll contact you to confirm your appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationType">Consultation Type *</Label>
                  <Select
                    value={formData.consultationType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, consultationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Consultation</SelectItem>
                      <SelectItem value="phone">Phone Consultation</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="preferredDate"
                      type="date"
                      className="pl-9"
                      value={formData.preferredDate}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.preferredTime}
                      onValueChange={(value) =>
                        setFormData({ ...formData, preferredTime: value })
                      }
                    >
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Consultation *</Label>
                <Textarea
                  id="reason"
                  required
                  placeholder="Please describe what you'd like to discuss (e.g., understanding test results, family planning, cancer risk assessment)"
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto">
                Request Consultation
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for requesting a genetic counseling consultation. Our team will contact you within 1-2 business days to confirm your appointment.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle>What to Expect</CardTitle>
          <CardDescription>
            Here's what typically happens during a genetic counseling session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Personal and Family History</h4>
                <p className="text-sm text-muted-foreground">
                  We'll review your medical history, family health history, and reasons for genetic testing.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Results Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  Your counselor will explain your genetic test results in easy-to-understand terms.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Health Implications</h4>
                <p className="text-sm text-muted-foreground">
                  Discussion of what the results mean for your health, screening recommendations, and prevention strategies.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Family Impact</h4>
                <p className="text-sm text-muted-foreground">
                  Guidance on how results may affect family members and recommendations for family testing.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                5
              </div>
              <div>
                <h4 className="font-semibold mb-1">Next Steps</h4>
                <p className="text-sm text-muted-foreground">
                  Development of a personalized plan including medical management, lifestyle modifications, and follow-up care.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Who should consider genetic counseling?</h4>
              <p className="text-sm text-muted-foreground">
                Anyone with genetic test results, a family history of genetic conditions, planning a pregnancy, or concerned about inherited cancer or heart disease should consider genetic counseling.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Is genetic counseling covered by insurance?</h4>
              <p className="text-sm text-muted-foreground">
                Many insurance plans cover genetic counseling, especially when medically indicated. We recommend checking with your insurance provider about coverage.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">How long does a session last?</h4>
              <p className="text-sm text-muted-foreground">
                Initial consultations typically last 45-60 minutes. Follow-up sessions may be shorter, around 30 minutes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What should I bring to my appointment?</h4>
              <p className="text-sm text-muted-foreground">
                Bring your genetic test results, medical records, family health history information, and a list of questions you'd like to discuss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>
            Have questions? Reach out to our genetic counseling team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Phone: (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>Email: genetics@lithic.health</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Hours: Monday-Friday, 8 AM - 6 PM EST</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
