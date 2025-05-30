
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectMilestone, FFTPMilestoneType } from "@/types/project";

const FFTP_MILESTONE_OPTIONS: FFTPMilestoneType[] = [
  "MOU Signed",
  "First Disbursement Sent",
  "Receipts Received & Verified (First Tranche)",
  "Second Disbursement Sent",
  "Receipts Received & Verified (Second Tranche)",
  "Third Disbursement Sent",
  "Receipts Received & Verified (Third Tranche)",
  "Final Disbursement Sent",
  "Final Report Pending (Due within 6 months)",
  "Final Report Submitted to Partnerships & Donor Engagement Officer"
];

const getMilestonePhaseColor = (milestoneType: FFTPMilestoneType) => {
  if (milestoneType === "MOU Signed") return "bg-blue-100 border-blue-300";
  if (milestoneType.includes("Disbursement")) return "bg-green-100 border-green-300";
  if (milestoneType.includes("Receipts")) return "bg-yellow-100 border-yellow-300";
  if (milestoneType.includes("Report")) return "bg-orange-100 border-orange-300";
  return "bg-gray-100 border-gray-300";
};

interface FFTPMilestoneManagerProps {
  projectId: string;
  milestones: ProjectMilestone[];
  onAddMilestone: (milestone: Omit<ProjectMilestone, "id">) => void;
  onUpdateMilestone: (id: string, updates: Partial<ProjectMilestone>) => void;
  onDeleteMilestone: (id: string) => void;
}

const FFTPMilestoneManager = ({
  projectId,
  milestones,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}: FFTPMilestoneManagerProps) => {
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    milestoneType: "" as FFTPMilestoneType,
    startDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    status: "Not Started" as const,
    priority: "Medium" as const
  });

  const handleAddMilestone = () => {
    if (!newMilestone.milestoneType || !newMilestone.startDate || !newMilestone.dueDate) return;

    onAddMilestone({
      projectId,
      title: newMilestone.milestoneType,
      milestoneType: newMilestone.milestoneType,
      startDate: newMilestone.startDate.toISOString().split('T')[0],
      dueDate: newMilestone.dueDate.toISOString().split('T')[0],
      status: newMilestone.status,
      priority: newMilestone.priority
    });

    setNewMilestone({
      milestoneType: "" as FFTPMilestoneType,
      startDate: undefined,
      dueDate: undefined,
      status: "Not Started",
      priority: "Medium"
    });
    setIsAddingMilestone(false);
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    const aIndex = FFTP_MILESTONE_OPTIONS.indexOf(a.milestoneType as FFTPMilestoneType);
    const bIndex = FFTP_MILESTONE_OPTIONS.indexOf(b.milestoneType as FFTPMilestoneType);
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">FFTP-Canada Monitoring Milestones</h3>
        <Button onClick={() => setIsAddingMilestone(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Add Milestone Form */}
      {isAddingMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Milestone Type</Label>
              <Select
                value={newMilestone.milestoneType}
                onValueChange={(value) => setNewMilestone(prev => ({ ...prev, milestoneType: value as FFTPMilestoneType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone type" />
                </SelectTrigger>
                <SelectContent>
                  {FFTP_MILESTONE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newMilestone.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMilestone.startDate ? format(newMilestone.startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newMilestone.startDate}
                      onSelect={(date) => setNewMilestone(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newMilestone.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMilestone.dueDate ? format(newMilestone.dueDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newMilestone.dueDate}
                      onSelect={(date) => setNewMilestone(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddMilestone} size="sm">Add Milestone</Button>
              <Button onClick={() => setIsAddingMilestone(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone List */}
      <div className="space-y-2">
        {sortedMilestones.map((milestone) => (
          <Card key={milestone.id} className={`${getMilestonePhaseColor(milestone.milestoneType as FFTPMilestoneType)} border-l-4`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{milestone.title}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    {format(new Date(milestone.startDate), "MMM dd, yyyy")} - {format(new Date(milestone.dueDate), "MMM dd, yyyy")}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      milestone.status === "Completed" ? "bg-green-100 text-green-700" :
                      milestone.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      milestone.status === "Overdue" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {milestone.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      milestone.priority === "High" ? "bg-red-100 text-red-700" :
                      milestone.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {milestone.priority}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMilestone(milestone.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteMilestone(milestone.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FFTPMilestoneManager;
