
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, DollarSign, Target, AlertCircle, TrendingUp, Users } from "lucide-react";
import { Project, ProjectNote } from "@/types/project";
import { formatWithExchange, convertUsdToCad } from "@/utils/currencyUtils";

interface StatusReportDialogProps {
  projects: Project[];
  notes: ProjectNote[];
}

const StatusReportDialog = ({ projects, notes }: StatusReportDialogProps) => {
  const [open, setOpen] = useState(false);

  // Calculate comprehensive metrics
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "On-Track" || p.status === "Delayed").length,
    completedProjects: projects.filter(p => p.status === "Completed").length,
    delayedProjects: projects.filter(p => p.status === "Delayed").length,
    pendingProjects: projects.filter(p => p.status === "Pending Start").length,
    needsAttentionProjects: projects.filter(p => p.status === "Needs Attention").length,
    followUpNeeded: projects.filter(p => p.followUpNeeded).length,
    totalDisbursedCAD: projects.reduce((sum, p) => {
      if (p.currency === 'USD') {
        return sum + convertUsdToCad(p.amountDisbursed);
      }
      return sum + p.amountDisbursed;
    }, 0),
    totalBudgetCAD: projects.reduce((sum, p) => {
      if (p.totalCost) {
        if (p.currency === 'USD') {
          return sum + convertUsdToCad(p.totalCost);
        }
        return sum + p.totalCost;
      }
      return sum;
    }, 0),
  };

  const utilizationRate = metrics.totalBudgetCAD > 0 ? (metrics.totalDisbursedCAD / metrics.totalBudgetCAD) * 100 : 0;

  // Country breakdown
  const countryBreakdown = projects.reduce((acc, project) => {
    const country = project.country || 'Unspecified';
    if (!acc[country]) {
      acc[country] = { count: 0, disbursed: 0 };
    }
    acc[country].count++;
    if (project.currency === 'USD') {
      acc[country].disbursed += convertUsdToCad(project.amountDisbursed);
    } else {
      acc[country].disbursed += project.amountDisbursed;
    }
    return acc;
  }, {} as Record<string, { count: number; disbursed: number }>);

  // Impact area breakdown
  const impactAreaBreakdown = projects.reduce((acc, project) => {
    const area = project.impactArea;
    if (!acc[area]) {
      acc[area] = { count: 0, disbursed: 0 };
    }
    acc[area].count++;
    if (project.currency === 'USD') {
      acc[area].disbursed += convertUsdToCad(project.amountDisbursed);
    } else {
      acc[area].disbursed += project.amountDisbursed;
    }
    return acc;
  }, {} as Record<string, { count: number; disbursed: number }>);

  // Recent notes summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentNotes = notes.filter(note => new Date(note.dateOfNote) >= thirtyDaysAgo);

  // Key insights
  const insights = [
    `${((metrics.completedProjects / metrics.totalProjects) * 100).toFixed(1)}% project completion rate`,
    `${utilizationRate.toFixed(1)}% budget utilization`,
    `${metrics.delayedProjects} projects currently delayed`,
    `${recentNotes.length} notes added in the last 30 days`,
  ];

  const generateReport = () => {
    const reportDate = new Date().toLocaleDateString();
    const reportContent = `
FOOD FOR THE POOR CANADA - PROJECT STATUS REPORT
Generated: ${reportDate}

EXECUTIVE SUMMARY
================
Total Active Projects: ${metrics.activeProjects}
Total Budget Allocated: CAD $${metrics.totalBudgetCAD.toLocaleString()}
Total Funds Disbursed: CAD $${metrics.totalDisbursedCAD.toLocaleString()}
Budget Utilization: ${utilizationRate.toFixed(1)}%

PROJECT STATUS OVERVIEW
======================
✓ Completed: ${metrics.completedProjects}
→ On-Track: ${projects.filter(p => p.status === "On-Track").length}
⚠ Delayed: ${metrics.delayedProjects}
⏳ Pending Start: ${metrics.pendingProjects}
🔴 Needs Attention: ${metrics.needsAttentionProjects}
📋 Follow-up Required: ${metrics.followUpNeeded}

GEOGRAPHIC DISTRIBUTION
======================
${Object.entries(countryBreakdown).map(([country, data]) => 
  `${country}: ${data.count} projects, CAD $${data.disbursed.toLocaleString()} disbursed`
).join('\n')}

IMPACT AREA BREAKDOWN
====================
${Object.entries(impactAreaBreakdown).map(([area, data]) => 
  `${area}: ${data.count} projects, CAD $${data.disbursed.toLocaleString()} disbursed`
).join('\n')}

KEY INSIGHTS
============
${insights.map(insight => `• ${insight}`).join('\n')}

RECENT ACTIVITY (Last 30 Days)
==============================
${recentNotes.length} new project notes recorded
Projects requiring immediate attention: ${metrics.needsAttentionProjects}
Projects needing follow-up: ${metrics.followUpNeeded}

RECOMMENDATIONS
===============
${metrics.delayedProjects > 0 ? `• Review and address ${metrics.delayedProjects} delayed project(s)` : ''}
${metrics.followUpNeeded > 0 ? `• Follow up on ${metrics.followUpNeeded} project(s) requiring attention` : ''}
${utilizationRate < 50 ? '• Consider accelerating disbursement pace' : ''}
${utilizationRate > 90 ? '• Review budget allocation for upcoming projects' : ''}

---
Report generated by Food For The Poor Canada Project Management System
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FFTP_Status_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <FileText className="w-4 h-4 mr-2" />
          Generate Status Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Executive Status Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{metrics.activeProjects}</div>
                <p className="text-xs text-blue-600">of {metrics.totalProjects} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Disbursed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  CAD ${metrics.totalDisbursedCAD.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">{utilizationRate.toFixed(1)}% utilization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{metrics.needsAttentionProjects + metrics.delayedProjects}</div>
                <p className="text-xs text-orange-600">delayed + attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {((metrics.completedProjects / metrics.totalProjects) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-purple-600">{metrics.completedProjects} completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  On-Track: {projects.filter(p => p.status === "On-Track").length}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Completed: {metrics.completedProjects}
                </Badge>
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Delayed: {metrics.delayedProjects}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Pending: {metrics.pendingProjects}
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  Needs Attention: {metrics.needsAttentionProjects}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(countryBreakdown).map(([country, data]) => (
                  <div key={country} className="flex justify-between items-center">
                    <span className="font-medium">{country}</span>
                    <div className="text-right">
                      <div>{data.count} projects</div>
                      <div className="text-sm text-gray-600">CAD ${data.disbursed.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Area Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(impactAreaBreakdown).map(([area, data]) => (
                  <div key={area} className="flex justify-between items-center">
                    <span className="font-medium">{area}</span>
                    <div className="text-right">
                      <div>{data.count} projects</div>
                      <div className="text-sm text-gray-600">CAD ${data.disbursed.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Recent Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>📝 {recentNotes.length} new project notes recorded</div>
                <div>⚠️ {metrics.needsAttentionProjects} projects need attention</div>
                <div>📞 {metrics.followUpNeeded} projects require follow-up</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={generateReport} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusReportDialog;
