import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectData } from "@/hooks/useProjectData";

export const DebugProjectsPanel = () => {
  const { projects } = useProjectData();

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-700">🐛 Debug: Raw Project Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Total Projects:</strong> {projects.length}</p>
          {projects.length === 0 ? (
            <p className="text-red-600">No projects found in memory!</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div key={project.id || index} className="text-xs border p-2 rounded">
                  <div><strong>Name:</strong> {project.projectName || 'No name'}</div>
                  <div><strong>ID:</strong> {project.id || 'No ID'}</div>
                  <div><strong>Country:</strong> {project.country || 'No country'}</div>
                  <div><strong>Status:</strong> <Badge variant="outline">{project.status || 'No status'}</Badge></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};