"use client";

import React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Target,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ClusterAnalysis } from "./data-table-recommendation";

interface RecommendationDetailModalProps {
  details: ClusterAnalysis;
}

export function RecommendationDetailModal({
  details,
}: RecommendationDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSentimentColor = (percentage: number) => {
    if (percentage < 30) return "bg-green-100 text-green-800";
    if (percentage < 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "immediate":
        return "destructive";
      case "soon":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DialogContent className="max-w-6xl min-w-min max-h-[95vh] overflow-y-auto p-6">
      <DialogHeader className="pb-4">
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Target className="h-6 w-6" />
          Recommendation Details
        </DialogTitle>
        <DialogDescription className="text-base">
          Detailed information about the cluster analysis and recommendations
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 pr-2">
        {/* Add right padding for scrollbar */}
        {/* Cluster Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cluster Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                Cluster Label
              </h4>
              <p className="font-medium text-lg">{details.clusterLabel}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                Summary
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {details.clusterSummary}
                </p>
              </div>
            </div>

            {details.formTitle && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Form
                </h4>
                <p className="text-sm bg-muted/30 px-3 py-2 rounded-md inline-block">
                  {details.formTitle}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="w-lg">
          <CardHeader>
            <CardTitle className="text-lg">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-primary">
                  {details.clusterSize}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Insights</p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div
                    className={`w-5 h-5 rounded-full ${getSentimentColor(
                      details.sentimentPercentage
                    )}`}
                  />
                </div>
                <p className="text-3xl font-bold text-primary">
                  {details.sentimentPercentage.toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Sentiment</p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mb-2">
                  <Badge
                    variant={getImpactColor(details.impact)}
                    className="text-sm px-3 py-1"
                  >
                    {details.impact}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Impact</p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mb-2">
                  <Badge
                    variant={getUrgencyColor(details.urgency)}
                    className="text-sm px-3 py-1"
                  >
                    {details.urgency}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Urgency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        {details.recommendation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-sm leading-relaxed text-blue-900">
                  {details.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* JIRA Ticket Information */}
        {details.ticketCreated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Badge variant="default" className="bg-green-600">
                  Ticket Created
                </Badge>
                {details.lastTicketDate && (
                  <span className="text-sm text-green-700">
                    {formatDate(details.lastTicketDate)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.jiraTicketId && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      JIRA Ticket ID
                    </h4>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {details.jiraTicketId}
                    </p>
                  </div>
                )}

                {details.jiraTicketStatus && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      Status
                    </h4>
                    <Badge variant="outline" className="text-sm">
                      {details.jiraTicketStatus}
                    </Badge>
                  </div>
                )}
              </div>

              {details.jiraTicketUrl && (
                <div className="pt-2">
                  <a
                    href={details.jiraTicketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
                  >
                    View in JIRA
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-6" />

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Created At
                  </h4>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(details.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Updated At
                  </h4>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(details.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Cluster ID
                  </h4>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {details._id}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Insights Count
                  </h4>
                  <span className="text-sm font-medium">
                    {details.insightIds.length} insights
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
}
