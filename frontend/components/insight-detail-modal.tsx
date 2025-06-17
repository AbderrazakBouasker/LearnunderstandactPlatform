"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type Insight = {
  _id: string;
  feedbackId: string;
  formId: string;
  organization: string;
  formTitle: string;
  formDescription: string;
  sentiment: string;
  feedbackDescription: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

interface InsightDetailModalProps {
  details: Insight;
}

export function InsightDetailModal({ details }: InsightDetailModalProps) {
  // Add emoji mapping for sentiment values
  const sentimentEmojis: Record<string, string> = {
    "very dissatisfied": "😠",
    dissatisfied: "🙁",
    "somewhat dissatisfied": "😕",
    neutral: "😐",
    "somewhat satisfied": "🙂",
    satisfied: "😊",
    "very satisfied": "😄",
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Insight Details</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Insight Analysis */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Insight Analysis</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Feedback Description
              </label>
              <p className="text-sm bg-gray-50 p-3 rounded">
                {details.feedbackDescription}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Sentiment
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {sentimentEmojis[details.sentiment.toLowerCase()] ||
                    details.sentiment}
                </span>
                <Badge variant="outline" className="capitalize">
                  {details.sentiment}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Keywords
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {details.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Created At
                </label>
                <p className="text-sm">
                  {new Date(details.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Updated At
                </label>
                <p className="text-sm">
                  {new Date(details.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
