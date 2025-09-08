import { LocalStorageManager } from "@/utils/localStorageManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CurrentDataViewer = () => {
  const projects = LocalStorageManager.getItem('projects', []);
  const notes = LocalStorageManager.getItem('project-notes', []);
  const milestones = LocalStorageManager.getItem('project-milestones', []);
  const attachments = LocalStorageManager.getItem('project-attachments', []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Current Projects ({projects.length})</CardTitle>
          <CardDescription>All projects currently stored in your browser</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground">No projects found</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project: any, index: number) => (
                <div key={project.id || index} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{project.projectName || 'Unnamed Project'}</h3>
                    <Badge variant={project.status === 'On-Track' ? 'default' : 
                                 project.status === 'Delayed' ? 'destructive' : 'secondary'}>
                      {project.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>ID:</strong> {project.id}</p>
                    <p><strong>Impact Area:</strong> {project.impactArea || 'Not specified'}</p>
                    <p><strong>Total Cost:</strong> {project.totalCost ? `$${project.totalCost.toLocaleString()} ${project.currency || 'CAD'}` : 'Not specified'}</p>
                    <p><strong>Fund Type:</strong> {project.fundType || 'Not specified'}</p>
                    <p><strong>Start Date:</strong> {project.startDate || 'Not specified'}</p>
                    <p><strong>End Date:</strong> {project.endDate || 'Not specified'}</p>
                    {project.governanceNumber && (
                      <p><strong>Governance:</strong> {project.governanceType} #{project.governanceNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{notes.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{milestones.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attachments.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};