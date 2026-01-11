/**
 * Feedback Collection Form Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Star } from "lucide-react";
import type { FeedbackType, FeedbackCategory, SubmitFeedbackDto } from "@/types/engagement";

interface FeedbackFormProps {
  patientId: string;
  onSubmit?: (feedback: SubmitFeedbackDto) => void;
  className?: string;
}

export function FeedbackForm({ patientId, onSubmit, className }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState<FeedbackType>("SUGGESTION");
  const [category, setCategory] = useState<FeedbackCategory>("OTHER");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData: SubmitFeedbackDto = {
        patientId,
        type,
        category,
        rating,
        subject,
        description,
        isAnonymous,
      };

      await onSubmit?.(feedbackData);

      // Reset form
      setRating(0);
      setSubject("");
      setDescription("");
      setIsAnonymous(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Share Your Feedback</CardTitle>
          <CardDescription>
            Help us improve your healthcare experience
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Feedback Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLAINT">Complaint</SelectItem>
                <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                <SelectItem value="PRAISE">Praise</SelectItem>
                <SelectItem value="QUESTION">Question</SelectItem>
                <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROVIDER_CARE">Provider Care</SelectItem>
                <SelectItem value="STAFF_INTERACTION">Staff Interaction</SelectItem>
                <SelectItem value="FACILITY">Facility</SelectItem>
                <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                <SelectItem value="BILLING">Billing</SelectItem>
                <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                <SelectItem value="PORTAL">Patient Portal</SelectItem>
                <SelectItem value="ENGAGEMENT_PLATFORM">Engagement Platform</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your feedback"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details..."
              rows={5}
              required
            />
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous">Submit anonymously</Label>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !subject || !description || rating === 0} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
