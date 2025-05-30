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
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { useProjectData } from "@/hooks/useProjectData";

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
  const { getMilestonesForProject } = useProjectData();

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
    totalReportedSpendCAD: projects.reduce((sum, p) => {
      if (p.currency === 'USD') {
        return sum + convertUsdToCad(p.reportedSpend);
      }
      return sum + p.reportedSpend;
    }, 0),
  };

  const utilizationRate = metrics.totalBudgetCAD > 0 ? (metrics.totalDisbursedCAD / metrics.totalBudgetCAD) * 100 : 0;

  // Calculate recent notes for the report
  const recentNotes = notes.filter(note => {
    const noteDate = new Date(note.dateOfNote);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return noteDate >= thirtyDaysAgo;
  }).sort((a, b) => new Date(b.dateOfNote).getTime() - new Date(a.dateOfNote).getTime());

  // Country breakdown
  const countryBreakdown = projects.reduce((acc, project) => {
    const country = project.country || 'Unspecified';
    if (!acc[country]) {
      acc[country] = { count: 0, disbursed: 0, budget: 0, reportedSpend: 0 };
    }
    acc[country].count++;
    if (project.currency === 'USD') {
      acc[country].disbursed += convertUsdToCad(project.amountDisbursed);
      acc[country].budget += project.totalCost ? convertUsdToCad(project.totalCost) : 0;
      acc[country].reportedSpend += convertUsdToCad(project.reportedSpend);
    } else {
      acc[country].disbursed += project.amountDisbursed;
      acc[country].budget += project.totalCost || 0;
      acc[country].reportedSpend += project.reportedSpend;
    }
    return acc;
  }, {} as Record<string, { count: number; disbursed: number; budget: number; reportedSpend: number }>);

  // Impact area breakdown
  const impactAreaBreakdown = projects.reduce((acc, project) => {
    const area = project.impactArea;
    if (!acc[area]) {
      acc[area] = { count: 0, disbursed: 0, budget: 0 };
    }
    acc[area].count++;
    if (project.currency === 'USD') {
      acc[area].disbursed += convertUsdToCad(project.amountDisbursed);
      acc[area].budget += project.totalCost ? convertUsdToCad(project.totalCost) : 0;
    } else {
      acc[area].disbursed += project.amountDisbursed;
      acc[area].budget += project.totalCost || 0;
    }
    return acc;
  }, {} as Record<string, { count: number; disbursed: number; budget: number }>);

  // Project details with milestones and timeline
  const projectDetails = projects.map(project => {
    const milestones = getMilestonesForProject(project.id);
    const projectNotes = notes.filter(note => note.projectId === project.id);
    
    // Calculate timeline metrics
    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    
    // Milestone completion rate
    const completedMilestones = milestones.filter(m => m.status === "Completed").length;
    const milestoneCompletionRate = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
    
    // Financial variance
    const budgetCAD = project.currency === 'USD' && project.totalCost ? 
      convertUsdToCad(project.totalCost) : (project.totalCost || 0);
    const disbursedCAD = project.currency === 'USD' ? 
      convertUsdToCad(project.amountDisbursed) : project.amountDisbursed;
    const reportedSpendCAD = project.currency === 'USD' ? 
      convertUsdToCad(project.reportedSpend) : project.reportedSpend;
    
    const disbursementRate = budgetCAD > 0 ? (disbursedCAD / budgetCAD) * 100 : 0;
    const variance = disbursedCAD - reportedSpendCAD;
    
    return {
      ...project,
      milestones,
      projectNotes,
      timeline: {
        totalDays,
        elapsedDays,
        progressPercentage: Math.round(progressPercentage),
        milestoneCompletionRate: Math.round(milestoneCompletionRate)
      },
      financials: {
        budgetCAD,
        disbursedCAD,
        reportedSpendCAD,
        disbursementRate: Math.round(disbursementRate),
        variance,
        variancePercentage: disbursedCAD > 0 ? Math.round((variance / disbursedCAD) * 100) : 0
      }
    };
  });

  // Formal notes summary
  const generateFormalNotesSummary = (projectNotes: typeof notes) => {
    if (projectNotes.length === 0) return "No project notes recorded during this reporting period.";
    
    const recentProjectNotes = projectNotes.filter(note => {
      const noteDate = new Date(note.dateOfNote);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return noteDate >= thirtyDaysAgo;
    }).sort((a, b) => new Date(b.dateOfNote).getTime() - new Date(a.dateOfNote).getTime());

    if (recentProjectNotes.length === 0) return "No recent project activity recorded in the last 30 days.";
    
    return recentProjectNotes.map(note => 
      `${new Date(note.dateOfNote).toLocaleDateString()}: ${note.content}`
    ).join('. ');
  };

  // Key insights
  const insights = [
    `${((metrics.completedProjects / metrics.totalProjects) * 100).toFixed(1)}% project completion rate`,
    `${utilizationRate.toFixed(1)}% budget utilization across portfolio`,
    `${metrics.delayedProjects} projects currently experiencing delays`,
    `CAD $${(metrics.totalDisbursedCAD - metrics.totalReportedSpendCAD).toLocaleString()} variance between disbursed and reported spending`,
    `${Math.round(projectDetails.reduce((sum, p) => sum + p.timeline.milestoneCompletionRate, 0) / projectDetails.length)}% average milestone completion rate`
  ];

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString();

    // Add company logo
    const logoImg = new Image();
    logoImg.onload = function() {
      // Add centered logo to PDF with reduced height for better proportions
      const logoWidth = 80;
      const logoHeight = 25;
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = (pageWidth - logoWidth) / 2;
      
      doc.addImage(logoImg, 'PNG', logoX, 15, logoWidth, logoHeight);
      
      // Title (adjusted position to account for centered logo)
      doc.setFontSize(16);
      doc.text('COMPREHENSIVE PROJECT STATUS REPORT', 105, 50, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated: ${reportDate}`, 105, 60, { align: 'center' });

      let yPosition = 80;

      // Executive Summary
      doc.setFontSize(14);
      doc.text('EXECUTIVE SUMMARY', 20, yPosition);
      yPosition += 10;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Active Projects', metrics.activeProjects.toString()],
          ['Total Budget Allocated', `CAD $${metrics.totalBudgetCAD.toLocaleString()}`],
          ['Total Funds Disbursed', `CAD $${metrics.totalDisbursedCAD.toLocaleString()}`],
          ['Total Reported Spend', `CAD $${metrics.totalReportedSpendCAD.toLocaleString()}`],
          ['Budget Utilization', `${utilizationRate.toFixed(1)}%`],
          ['Financial Variance', `CAD $${(metrics.totalDisbursedCAD - metrics.totalReportedSpendCAD).toLocaleString()}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Detailed Project Analysis
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('DETAILED PROJECT ANALYSIS', 20, yPosition);
      yPosition += 10;

      autoTable(doc, {
        startY: yPosition,
        head: [['Project', 'Country', 'Status', 'Total Cost (CAD)', 'Disbursed (CAD)', 'Reported Spend (CAD)', 'Budget Utilization', 'Variance', 'Timeline Progress', 'Milestone Progress']],
        body: projectDetails.map(project => [
          project.projectName,
          project.country || 'N/A',
          project.status,
          `CAD $${project.financials.budgetCAD.toLocaleString()}`,
          `CAD $${project.financials.disbursedCAD.toLocaleString()}`,
          `CAD $${project.financials.reportedSpendCAD.toLocaleString()}`,
          `${project.financials.disbursementRate}%`,
          `CAD $${project.financials.variance.toLocaleString()}`,
          `${project.timeline.progressPercentage}%`,
          `${project.timeline.milestoneCompletionRate}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
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

      autoTable(doc, {
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

      autoTable(doc, {
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

      doc.save(`FFTP_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Handle error if logo fails to load
    logoImg.onerror = function() {
      console.warn('Logo failed to load, generating PDF without logo');
      
      // Title without logo
      doc.setFontSize(16);
      doc.text('COMPREHENSIVE PROJECT STATUS REPORT', 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated: ${reportDate}`, 105, 40, { align: 'center' });

      // Continue with rest of PDF generation using original positions
      let yPosition = 60;

      // Executive Summary
      doc.setFontSize(14);
      doc.text('EXECUTIVE SUMMARY', 20, yPosition);
      yPosition += 10;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Active Projects', metrics.activeProjects.toString()],
          ['Total Budget Allocated', `CAD $${metrics.totalBudgetCAD.toLocaleString()}`],
          ['Total Funds Disbursed', `CAD $${metrics.totalDisbursedCAD.toLocaleString()}`],
          ['Total Reported Spend', `CAD $${metrics.totalReportedSpendCAD.toLocaleString()}`],
          ['Budget Utilization', `${utilizationRate.toFixed(1)}%`],
          ['Financial Variance', `CAD $${(metrics.totalDisbursedCAD - metrics.totalReportedSpendCAD).toLocaleString()}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Detailed Project Analysis
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('DETAILED PROJECT ANALYSIS', 20, yPosition);
      yPosition += 10;

      autoTable(doc, {
        startY: yPosition,
        head: [['Project', 'Country', 'Status', 'Total Cost (CAD)', 'Disbursed (CAD)', 'Reported Spend (CAD)', 'Budget Utilization', 'Variance', 'Timeline Progress', 'Milestone Progress']],
        body: projectDetails.map(project => [
          project.projectName,
          project.country || 'N/A',
          project.status,
          `CAD $${project.financials.budgetCAD.toLocaleString()}`,
          `CAD $${project.financials.disbursedCAD.toLocaleString()}`,
          `CAD $${project.financials.reportedSpendCAD.toLocaleString()}`,
          `${project.financials.disbursementRate}%`,
          `CAD $${project.financials.variance.toLocaleString()}`,
          `${project.timeline.progressPercentage}%`,
          `${project.timeline.milestoneCompletionRate}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
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

      autoTable(doc, {
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

      autoTable(doc, {
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

      doc.save(`FFTP_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Load the logo image
    logoImg.src = '/lovable-uploads/af3d9a60-0267-4a1b-bf2d-e92b594a9ba7.png';
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
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <FileText className="w-4 h-4 mr-2" />
          Generate Status Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Comprehensive Executive Status Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Executive Summary */}
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
                    <TableCell className="font-bold">CAD $${metrics.totalBudgetCAD.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Funds Disbursed</TableCell>
                    <TableCell className="font-bold">CAD $${metrics.totalDisbursedCAD.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Reported Spend</TableCell>
                    <TableCell className="font-bold">CAD ${metrics.totalReportedSpendCAD.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Budget Utilization</TableCell>
                    <TableCell className="font-bold">{utilizationRate.toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Financial Variance</TableCell>
                    <TableCell className="font-bold">CAD ${(metrics.totalDisbursedCAD - metrics.totalReportedSpendCAD).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed Project Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Project Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost (CAD)</TableHead>
                    <TableHead>Disbursed (CAD)</TableHead>
                    <TableHead>Reported Spend (CAD)</TableHead>
                    <TableHead>Budget Utilization</TableHead>
                    <TableHead>Financial Variance</TableHead>
                    <TableHead>Timeline Progress</TableHead>
                    <TableHead>Milestone Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectDetails.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{project.country || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'On-Track' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>CAD ${project.financials.budgetCAD.toLocaleString()}</TableCell>
                      <TableCell>CAD ${project.financials.disbursedCAD.toLocaleString()}</TableCell>
                      <TableCell>CAD ${project.financials.reportedSpendCAD.toLocaleString()}</TableCell>
                      <TableCell>{project.financials.disbursementRate}%</TableCell>
                      <TableCell className={project.financials.variance < 0 ? 'text-red-600' : 'text-green-600'}>
                        CAD ${project.financials.variance.toLocaleString()}
                      </TableCell>
                      <TableCell>{project.timeline.progressPercentage}%</TableCell>
                      <TableCell>{project.timeline.milestoneCompletionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Milestone Summary by Project */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Progress Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectDetails.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{project.projectName}</h4>
                      <Badge>{project.milestones.length} Milestones</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-1 font-medium">
                          {project.milestones.filter(m => m.status === 'Completed').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">In Progress:</span>
                        <span className="ml-1 font-medium">
                          {project.milestones.filter(m => m.status === 'In Progress').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Overdue:</span>
                        <span className="ml-1 font-medium text-red-600">
                          {project.milestones.filter(m => m.status === 'Overdue').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completion Rate:</span>
                        <span className="ml-1 font-medium">
                          {project.timeline.milestoneCompletionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formal Notes Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Notes Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectDetails.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{project.projectName}</h4>
                    <p className="text-sm text-gray-700">
                      {generateFormalNotesSummary(project.projectNotes)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Analysis by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Budget (CAD)</TableHead>
                    <TableHead>Disbursed (CAD)</TableHead>
                    <TableHead>Reported Spend (CAD)</TableHead>
                    <TableHead>Utilization Rate</TableHead>
                    <TableHead>Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(countryBreakdown).map(([country, data]) => (
                    <TableRow key={country}>
                      <TableCell className="font-medium">{country}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>CAD ${data.budget.toLocaleString()}</TableCell>
                      <TableCell>CAD ${data.disbursed.toLocaleString()}</TableCell>
                      <TableCell>CAD ${data.reportedSpend.toLocaleString()}</TableCell>
                      <TableCell>{data.budget > 0 ? ((data.disbursed / data.budget) * 100).toFixed(1) : '0'}%</TableCell>
                      <TableCell className={data.disbursed - data.reportedSpend < 0 ? 'text-red-600' : 'text-green-600'}>
                        CAD ${(data.disbursed - data.reportedSpend).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Key Strategic Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Strategic Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
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
              Download Comprehensive PDF
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
