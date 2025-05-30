
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar, DollarSign, Target, AlertCircle, TrendingUp, Users, FileDown } from "lucide-react";
import { Project, ProjectNote } from "@/types/project";
import { formatWithExchange, convertUsdToCad } from "@/utils/currencyUtils";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(20);
    doc.text('FOOD FOR THE POOR CANADA', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('PROJECT STATUS REPORT', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated: ${reportDate}`, 105, 40, { align: 'center' });

    let yPosition = 60;

    // Executive Summary Table
    doc.setFontSize(14);
    doc.text('EXECUTIVE SUMMARY', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Active Projects', metrics.activeProjects.toString()],
        ['Total Budget Allocated', `CAD $${metrics.totalBudgetCAD.toLocaleString()}`],
        ['Total Funds Disbursed', `CAD $${metrics.totalDisbursedCAD.toLocaleString()}`],
        ['Budget Utilization', `${utilizationRate.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Project Status Table
    doc.setFontSize(14);
    doc.text('PROJECT STATUS OVERVIEW', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Status', 'Count']],
      body: [
        ['Completed', metrics.completedProjects.toString()],
        ['On-Track', projects.filter(p => p.status === "On-Track").length.toString()],
        ['Delayed', metrics.delayedProjects.toString()],
        ['Pending Start', metrics.pendingProjects.toString()],
        ['Needs Attention', metrics.needsAttentionProjects.toString()],
        ['Follow-up Required', metrics.followUpNeeded.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Geographic Distribution Table
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('GEOGRAPHIC DISTRIBUTION', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Country', 'Projects', 'Disbursed (CAD)']],
      body: Object.entries(countryBreakdown).map(([country, data]) => [
        country,
        data.count.toString(),
        `$${data.disbursed.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Impact Area Breakdown Table
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('IMPACT AREA BREAKDOWN', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Impact Area', 'Projects', 'Disbursed (CAD)']],
      body: Object.entries(impactAreaBreakdown).map(([area, data]) => [
        area,
        data.count.toString(),
        `$${data.disbursed.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`FFTP_Status_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateWordReport = () => {
    const reportDate = new Date().toLocaleDateString();
    
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>FFTP Status Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FOOD FOR THE POOR CANADA</h1>
            <h2>PROJECT STATUS REPORT</h2>
            <p>Generated: ${reportDate}</p>
          </div>

          <h2>EXECUTIVE SUMMARY</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Active Projects</td><td>${metrics.activeProjects}</td></tr>
            <tr><td>Total Budget Allocated</td><td>CAD $${metrics.totalBudgetCAD.toLocaleString()}</td></tr>
            <tr><td>Total Funds Disbursed</td><td>CAD $${metrics.totalDisbursedCAD.toLocaleString()}</td></tr>
            <tr><td>Budget Utilization</td><td>${utilizationRate.toFixed(1)}%</td></tr>
          </table>

          <h2>PROJECT STATUS OVERVIEW</h2>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Completed</td><td>${metrics.completedProjects}</td></tr>
            <tr><td>On-Track</td><td>${projects.filter(p => p.status === "On-Track").length}</td></tr>
            <tr><td>Delayed</td><td>${metrics.delayedProjects}</td></tr>
            <tr><td>Pending Start</td><td>${metrics.pendingProjects}</td></tr>
            <tr><td>Needs Attention</td><td>${metrics.needsAttentionProjects}</td></tr>
            <tr><td>Follow-up Required</td><td>${metrics.followUpNeeded}</td></tr>
          </table>

          <h2>GEOGRAPHIC DISTRIBUTION</h2>
          <table>
            <tr><th>Country</th><th>Projects</th><th>Disbursed (CAD)</th></tr>
            ${Object.entries(countryBreakdown).map(([country, data]) => 
              `<tr><td>${country}</td><td>${data.count}</td><td>$${data.disbursed.toLocaleString()}</td></tr>`
            ).join('')}
          </table>

          <h2>IMPACT AREA BREAKDOWN</h2>
          <table>
            <tr><th>Impact Area</th><th>Projects</th><th>Disbursed (CAD)</th></tr>
            ${Object.entries(impactAreaBreakdown).map(([area, data]) => 
              `<tr><td>${area}</td><td>${data.count}</td><td>$${data.disbursed.toLocaleString()}</td></tr>`
            ).join('')}
          </table>

          <h2>KEY INSIGHTS</h2>
          <ul>
            ${insights.map(insight => `<li>${insight}</li>`).join('')}
          </ul>

          <h2>RECENT ACTIVITY (Last 30 Days)</h2>
          <ul>
            <li>${recentNotes.length} new project notes recorded</li>
            <li>${metrics.needsAttentionProjects} projects need attention</li>
            <li>${metrics.followUpNeeded} projects require follow-up</li>
          </ul>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `FFTP_Status_Report_${new Date().toISOString().split('T')[0]}.doc`);
  };

  const generateTextReport = () => {
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Executive Status Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Active Projects</TableCell>
                    <TableCell className="font-bold">{metrics.activeProjects}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Budget Allocated</TableCell>
                    <TableCell className="font-bold">CAD ${metrics.totalBudgetCAD.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Funds Disbursed</TableCell>
                    <TableCell className="font-bold">CAD ${metrics.totalDisbursedCAD.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Budget Utilization</TableCell>
                    <TableCell className="font-bold">{utilizationRate.toFixed(1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Project Status Table */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Completed</TableCell>
                    <TableCell>{metrics.completedProjects}</TableCell>
                    <TableCell>{((metrics.completedProjects / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>On-Track</TableCell>
                    <TableCell>{projects.filter(p => p.status === "On-Track").length}</TableCell>
                    <TableCell>{((projects.filter(p => p.status === "On-Track").length / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Delayed</TableCell>
                    <TableCell>{metrics.delayedProjects}</TableCell>
                    <TableCell>{((metrics.delayedProjects / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pending Start</TableCell>
                    <TableCell>{metrics.pendingProjects}</TableCell>
                    <TableCell>{((metrics.pendingProjects / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Needs Attention</TableCell>
                    <TableCell>{metrics.needsAttentionProjects}</TableCell>
                    <TableCell>{((metrics.needsAttentionProjects / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Follow-up Required</TableCell>
                    <TableCell>{metrics.followUpNeeded}</TableCell>
                    <TableCell>{((metrics.followUpNeeded / metrics.totalProjects) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Geographic Distribution Table */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Disbursed (CAD)</TableHead>
                    <TableHead>% of Total Disbursed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(countryBreakdown).map(([country, data]) => (
                    <TableRow key={country}>
                      <TableCell className="font-medium">{country}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>CAD ${data.disbursed.toLocaleString()}</TableCell>
                      <TableCell>{((data.disbursed / metrics.totalDisbursedCAD) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Impact Areas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Area Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Impact Area</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Disbursed (CAD)</TableHead>
                    <TableHead>% of Total Disbursed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(impactAreaBreakdown).map(([area, data]) => (
                    <TableRow key={area}>
                      <TableCell className="font-medium">{area}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>CAD ${data.disbursed.toLocaleString()}</TableCell>
                      <TableCell>{((data.disbursed / metrics.totalDisbursedCAD) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

          {/* Export Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={generateTextReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Text
            </Button>
            <Button onClick={generatePDFReport} className="bg-red-600 hover:bg-red-700">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={generateWordReport} className="bg-blue-600 hover:bg-blue-700">
              <FileDown className="w-4 h-4 mr-2" />
              Download Word
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusReportDialog;
