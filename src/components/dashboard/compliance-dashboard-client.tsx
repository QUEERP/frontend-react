import React, { useEffect, useState } from "react";
import { useBusinessData } from "./business-data-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ComplianceDashboardClient() {
  const { business } = useBusinessData();
  const [summary, setSummary] = useState<any>({});
  const [stats, setStats] = useState({ pending: 0, completed: 0, percentage: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;

    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/compliance/summary', {
          headers: {
            'x-business-id': business.id,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setSummary(data.data.summary);
          setStats({
            pending: data.data.totalPending,
            completed: data.data.totalCompleted,
            percentage: data.data.completionPercentage
          });
        }
      } catch (error) {
        toast.error("Failed to fetch compliance data");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [business?.id]);

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl"></div>;
  }

  return (
    <Card className="border-red-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle>System Compliance</CardTitle>
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.percentage}%</span>
        </div>
        <CardDescription>Data integrity and mandatory requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={stats.percentage} className="h-2 mb-4" />
        
        <div className="flex justify-between text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{stats.completed} Complete</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-red-600">
            <ShieldAlert className="h-4 w-4" />
            <span>{stats.pending} Pending</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([model, count]: any) => (
            <div key={model} className="bg-red-50 rounded-lg p-3 border border-red-100 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-red-600">{count}</span>
              <span className="text-xs uppercase font-semibold text-muted-foreground">{model}s</span>
            </div>
          ))}
          {Object.keys(summary).length === 0 && (
            <div className="col-span-4 text-center text-emerald-600 text-sm font-medium py-2">
              All records are fully compliant!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
