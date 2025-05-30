import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Milestone, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { ProjectMilestone } from "@/types/project";
import { useToast } from "@/hooks/use-toast";

interface ProjectMilestonesProps {
  projectId: string;
  milestones: ProjectMilestone[];
  onAddMilestone: (milestone: Omit<ProjectMilestone, "id">) => void;
  onUpdateMilestone: (id: string, updates: Partial<ProjectMilestone>) => void;
  onDeleteMilestone: (id: string) => void;
}

const ProjectMilestones = ({
  projectId,
  milestones,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}: ProjectMilestonesProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    dueDate: "",
    status: "Not Started" as ProjectMilestone["status"],
    priority: "Medium" as ProjectMilestone["priority"]
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in the required fields.",
        variant: "destructive"
      });
      return;
    }

    onAddMilestone({
      projectId,
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      status: formData.status,
      priority: formData.priority
    });

    setFormData({
      title: "",
      description: "",
      startDate: "",
      dueDate: "",
      status: "Not Started",
      priority: "Medium"
    });
    setOpen(false);

    toast({
      title: "Milestone Added",
      description: "New milestone has been created successfully."
    });
  };

  const getStatusColor = (status: ProjectMilestone["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: ProjectMilestone["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleMilestoneStatus = (milestone: ProjectMilestone) => {
    const newStatus = milestone.status === "Completed" ? "Not Started" : "Completed";
    const updates: Partial<ProjectMilestone> = { status: newStatus };
    
    if (newStatus === "Completed") {
      updates.completedDate = new Date().toISOString().split('T')[0];
    } else {
      updates.completedDate = undefined;
    }

    onUpdateMilestone(milestone.id, updates);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Milestone className="h-5 w-5" />
            Milestones ({milestones.length})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as ProjectMilestone["priority"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Milestone</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No milestones yet. Add your first milestone to track progress.</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMilestoneStatus(milestone)}
                        className="p-0 h-auto"
                      >
                        <CheckCircle2 
                          className={`h-5 w-5 ${
                            milestone.status === "Completed" ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <h4 className={`font-semibold ${
                        milestone.status === "Completed" ? "line-through text-gray-500" : ""
                      }`}>
                        {milestone.title}
                      </h4>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {new Date(milestone.startDate).toLocaleDateString()}</span>
                      <span>• Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                      {milestone.completedDate && (
                        <span className="text-green-600">
                          • Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                    <Badge className={getPriorityColor(milestone.priority)}>
                      {milestone.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectMilestones;
