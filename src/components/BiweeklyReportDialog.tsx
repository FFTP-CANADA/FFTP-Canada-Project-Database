
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, FileText, Download, FileDown } from "lucide-react";
import { Project, ProjectNote, ProjectMilestone } from "@/types/project";
import { convertUsdToCad } from "@/utils/currencyUtils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

interface BiweeklyReportDialogProps {
  projects: Project[];
  notes: ProjectNote[];
  milestones: ProjectMilestone[];
}

const BiweeklyReportDialog = ({ projects, notes, milestones }: BiweeklyReportDialogProps) => {
  const [open, setOpen] = useState(false);

  // Calculate reporting period (last 14 days)
  const reportDate = new Date();
  const reportingPeriodStart = new Date();
  reportingPeriodStart.setDate(reportingPeriodStart.getDate() - 14);

  // Filter recent notes (last 14 days)
  const recentNotes = notes.filter(note => {
    const noteDate = new Date(note.dateOfNote);
    return noteDate >= reportingPeriodStart;
  });

  // Calculate metrics
  const metrics = {
    totalActiveProjects: projects.filter(p => 
      p.status === "On-Track" || p.status === "Delayed" || p.status === "Pending Start" || p.status === "Needs Attention"
    ).length,
    completedThisPeriod: projects.filter(p => {
      if (p.status !== "Completed" || !p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate >= reportingPeriodStart;
    }).length,
    finalReportsDueNext30Days: projects.filter(p => {
      if (p.status === "Completed" || !p.endDate) return false;
      const endDate = new Date(p.endDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow;
    }).length
  };

  // Get projects needing attention (watchlist)
  const watchlistProjects = projects.filter(p => 
    p.status === "Delayed" || p.status === "Needs Attention" || p.followUpNeeded
  );

  // Get upcoming milestones (next 30 days)
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);
  
  const upcomingMilestones = milestones.filter(m => {
    const dueDate = new Date(m.dueDate);
    return dueDate >= new Date() && dueDate <= next30Days && m.status !== "Completed";
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Generate key updates
  const generateKeyUpdates = () => {
    const updates: string[] = [];
    
    // New projects (started in last 14 days)
    const newProjects = projects.filter(p => {
      const startDate = new Date(p.startDate);
      return startDate >= reportingPeriodStart;
    });
    
    newProjects.forEach(p => {
      updates.push(`🆕 New project started: "${p.projectName}" - ${p.country}`);
    });

    // Completed projects this period
    projects.forEach(p => {
      if (p.status === "Completed" && p.endDate) {
        const endDate = new Date(p.endDate);
        if (endDate >= reportingPeriodStart) {
          updates.push(`✅ Project completed: "${p.projectName}" - ${p.country}`);
        }
      }
    });

    // Recent disbursements (based on notes mentioning disbursement)
    recentNotes.forEach(note => {
      if (note.content.toLowerCase().includes('disbursement') || note.content.toLowerCase().includes('disbursed')) {
        const project = projects.find(p => p.id === note.projectId);
        if (project) {
          updates.push(`📤 Disbursement activity: "${project.projectName}" - ${project.country}`);
        }
      }
    });

    // Overdue or delayed items
    watchlistProjects.forEach(p => {
      if (p.status === "Delayed") {
        updates.push(`⌛ Project delayed: "${p.projectName}" - ${p.country}`);
      }
    });

    return updates;
  };

  const keyUpdates = generateKeyUpdates();

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "On-Track": return "bg-green-100 text-green-700";
      case "Delayed": return "bg-yellow-100 text-yellow-700";
      case "Needs Attention": return "bg-red-100 text-red-700";
      case "Completed": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Generate suggested follow-up actions
  const getSuggestedAction = (project: Project) => {
    if (project.status === "Delayed") return "Schedule partner check-in call";
    if (project.status === "Needs Attention") return "Review project documentation";
    if (project.followUpNeeded) return "Follow up with field coordinator";
    return "Monitor progress";
  };

  // Generate PDF report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const reportDateStr = reportDate.toLocaleDateString();
    const periodStart = reportingPeriodStart.toLocaleDateString();

    // Title and Header
    doc.setFontSize(20);
    doc.text('FOOD FOR THE POOR CANADA', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('BIWEEKLY PROJECT REPORT', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Date of Report: ${reportDateStr}`, 20, 50);
    doc.text(`Prepared by: Jo-Ann`, 20, 60);
    doc.text(`Reporting Period: ${periodStart} - ${reportDateStr}`, 20, 70);

    let yPosition = 90;

    // Summary metrics
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Active Projects', metrics.totalActiveProjects.toString()],
        ['Projects Completed This Period', metrics.completedThisPeriod.toString()],
        ['Final Reports Due (Next 30 Days)', metrics.finalReportsDueNext30Days.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Project Status Overview
    doc.setFontSize(14);
    doc.text('PROJECT STATUS OVERVIEW', 20, yPosition);
    yPosition += 10;

    const projectData = projects
      .filter(p => p.status !== "Cancelled")
      .map(p => {
        const projectNotes = recentNotes
          .filter(n => n.projectId === p.id)
          .map(n => `🔹 ${n.content}`)
          .join('; ');
        
        return [
          p.projectName,
          p.country || 'N/A',
          p.status,
          'Next milestone TBD', // This would be enhanced with actual milestone data
          p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A',
          projectNotes || 'No recent updates'
        ];
      });

    autoTable(doc, {
      startY: yPosition,
      head: [['Project Name', 'Country', 'Status', 'Next Milestone', 'Due Date', 'Recent Notes']],
      body: projectData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        5: { cellWidth: 40 } // Notes column wider
      }
    });

    if (keyUpdates.length > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('KEY UPDATES', 20, yPosition);
      yPosition += 10;

      keyUpdates.forEach((update, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(10);
        doc.text(`• ${update}`, 25, yPosition);
        yPosition += 8;
      });
    }

    doc.save(`FFTP_Biweekly_Report_${reportDate.toISOString().split('T')[0]}.pdf`);
  };

  // Generate Excel/Word report
  const generateExcelReport = () => {
    const reportDateStr = reportDate.toLocaleDateString();
    const periodStart = reportingPeriodStart.toLocaleDateString();
    
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>FFTP Biweekly Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
            th { background-color: #3b82f6; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { margin-bottom: 20px; }
            .status-on-track { background-color: #dcfce7; }
            .status-delayed { background-color: #fef3c7; }
            .status-attention { background-color: #fee2e2; }
            .status-completed { background-color: #dbeafe; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FOOD FOR THE POOR CANADA</h1>
            <h2>BIWEEKLY PROJECT REPORT</h2>
            <p><strong>Date of Report:</strong> ${reportDateStr}</p>
            <p><strong>Prepared by:</strong> Jo-Ann</p>
            <p><strong>Reporting Period:</strong> ${periodStart} - ${reportDateStr}</p>
          </div>

          <h2>EXECUTIVE SUMMARY</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Active Projects</td><td>${metrics.totalActiveProjects}</td></tr>
            <tr><td>Projects Completed This Period</td><td>${metrics.completedThisPeriod}</td></tr>
            <tr><td>Final Reports Due (Next 30 Days)</td><td>${metrics.finalReportsDueNext30Days}</td></tr>
          </table>

          <h2>PROJECT STATUS OVERVIEW</h2>
          <table>
            <tr>
              <th>Project Name</th>
              <th>Country</th>
              <th>Status</th>
              <th>Next Milestone</th>
              <th>Due Date</th>
              <th>Recent Notes (Last 14 Days)</th>
            </tr>
            ${projects.filter(p => p.status !== "Cancelled").map(p => {
              const projectNotes = recentNotes
                .filter(n => n.projectId === p.id)
                .map(n => `🔹 ${n.content}`)
                .join('<br>');
              
              return `<tr class="status-${p.status.toLowerCase().replace(' ', '-').replace('-', '')}">
                <td>${p.projectName}</td>
                <td>${p.country || 'N/A'}</td>
                <td>${p.status}</td>
                <td>Next milestone TBD</td>
                <td>${p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}</td>
                <td>${projectNotes || 'No recent updates'}</td>
              </tr>`;
            }).join('')}
          </table>

          ${keyUpdates.length > 0 ? `
          <h2>KEY UPDATES</h2>
          <ul>
            ${keyUpdates.map(update => `<li>${update}</li>`).join('')}
          </ul>
          ` : ''}

          ${watchlistProjects.length > 0 ? `
          <h2>WATCHLIST (NEEDS ATTENTION)</h2>
          <table>
            <tr><th>Project</th><th>Issue</th><th>Suggested Follow-Up Action</th></tr>
            ${watchlistProjects.map(p => `
              <tr>
                <td>${p.projectName}</td>
                <td>${p.status === "Delayed" ? "Project delayed" : p.followUpNeeded ? "Follow-up needed" : "Needs attention"}</td>
                <td>${getSuggestedAction(p)}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          ${upcomingMilestones.length > 0 ? `
          <h2>UPCOMING MILESTONES (NEXT 30 DAYS)</h2>
          <table>
            <tr><th>Project</th><th>Upcoming Milestone</th><th>Expected Date</th></tr>
            ${upcomingMilestones.map(m => {
              const project = projects.find(p => p.id === m.projectId);
              return `
                <tr>
                  <td>${project?.projectName || 'Unknown'}</td>
                  <td>${m.title}</td>
                  <td>${new Date(m.dueDate).toLocaleDateString()}</td>
                </tr>
              `;
            }).join('')}
          </table>
          ` : ''}

          <p><em>Report generated by Food For The Poor Canada Project Management System</em></p>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `FFTP_Biweekly_Report_${reportDate.toISOString().split('T')[0]}.doc`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Calendar className="w-4 h-4 mr-2" />
          Generate Biweekly Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Biweekly Project Report - Jo-Ann
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date of Report</p>
                  <p className="font-semibold">{reportDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prepared by</p>
                  <p className="font-semibold">Jo-Ann</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reporting Period</p>
                  <p className="font-semibold">{reportingPeriodStart.toLocaleDateString()} - {reportDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Active Projects</p>
                  <p className="font-semibold text-blue-600">{metrics.totalActiveProjects}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Projects Completed This Period</p>
                  <p className="font-semibold text-green-600">{metrics.completedThisPeriod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Final Reports Due (Next 30 Days)</p>
                  <p className="font-semibold text-orange-600">{metrics.finalReportsDueNext30Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Milestone</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Recent Notes (Last 14 Days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.filter(p => p.status !== "Cancelled").map(project => {
                    const projectNotes = recentNotes
                      .filter(note => note.projectId === project.id)
                      .map(note => `🔹 ${note.content}`)
                      .join(', ');

                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell>{project.country || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>Next milestone TBD</TableCell>
                        <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="text-sm">{projectNotes || 'No recent updates'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Key Updates */}
          {keyUpdates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {keyUpdates.map((update, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sm">{update}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Watchlist */}
          {watchlistProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Watchlist (Needs Attention)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Suggested Follow-Up Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchlistProjects.map(project => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell>
                          {project.status === "Delayed" ? "Project delayed" : 
                           project.followUpNeeded ? "Follow-up needed" : "Needs attention"}
                        </TableCell>
                        <TableCell>{getSuggestedAction(project)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Milestones */}
          {upcomingMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Milestones (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Upcoming Milestone</TableHead>
                      <TableHead>Expected Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingMilestones.map(milestone => {
                      const project = projects.find(p => p.id === milestone.projectId);
                      return (
                        <TableRow key={milestone.id}>
                          <TableCell className="font-medium">{project?.projectName || 'Unknown'}</TableCell>
                          <TableCell>{milestone.title}</TableCell>
                          <TableCell>{new Date(milestone.dueDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Export Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={generatePDFReport} className="bg-red-600 hover:bg-red-700">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={generateExcelReport} className="bg-blue-600 hover:bg-blue-700">
              <FileDown className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiweeklyReportDialog;
