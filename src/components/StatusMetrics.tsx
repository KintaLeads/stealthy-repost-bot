
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageCircle, RefreshCw, Clock } from "lucide-react";

interface MetricsData {
  totalMessages: number;
  processedMessages: number;
  lastUpdate: string;
  uptime: string;
}

interface StatusMetricsProps {
  metrics: MetricsData;
  isLoading: boolean;
}

const StatusMetrics: React.FC<StatusMetricsProps> = ({ metrics, isLoading }) => {
  const cards = [
    {
      title: "Total Messages",
      value: metrics.totalMessages,
      description: "Messages monitored",
      icon: <MessageCircle size={18} />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Processed",
      value: metrics.processedMessages,
      description: "Messages reposted",
      icon: <RefreshCw size={18} />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Last Update",
      value: metrics.lastUpdate,
      description: "Time since last check",
      icon: <Clock size={18} />,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Uptime",
      value: metrics.uptime,
      description: "Total running time",
      icon: <Activity size={18} />,
      color: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
      {cards.map((card, index) => (
        <Card key={index} className="glass-card hover-lift">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md font-medium">{card.title}</CardTitle>
              <div className={`${card.bgColor} ${card.color} p-2 rounded-md`}>
                {card.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-semibold">{card.value}</div>
                <CardDescription>{card.description}</CardDescription>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusMetrics;
