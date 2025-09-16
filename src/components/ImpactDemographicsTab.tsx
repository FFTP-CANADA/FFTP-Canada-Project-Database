import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/project";
import { ImpactDemographics, ImpactDemographicsInput } from "@/types/impactDemographics";
import { getCurrentESTTimestamp } from "@/utils/dateUtils";

interface ImpactDemographicsTabProps {
  projects: Project[];
}

const ImpactDemographicsTab = ({ projects }: ImpactDemographicsTabProps) => {
  const [impactData, setImpactData] = useState<ImpactDemographics[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<ImpactDemographics | null>(null);
  const [formData, setFormData] = useState<ImpactDemographicsInput>({
    projectId: "",
    projectName: "",
    agencyAgreementNumber: "",
    region: "Regional",
    directParticipants: 0,
    indirectParticipants: 0,
  });

  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('impactDemographics');
    if (saved) {
      try {
        setImpactData(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load impact demographics data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever impactData changes
  useEffect(() => {
    localStorage.setItem('impactDemographics', JSON.stringify(impactData));
  }, [impactData]);

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setFormData(prev => ({
        ...prev,
        projectId: project.id,
        projectName: project.projectName,
        agencyAgreementNumber: project.governanceNumber || ""
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.projectName) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    const currentTime = getCurrentESTTimestamp();

    if (editingData) {
      // Update existing data
      const updatedData: ImpactDemographics = {
        ...editingData,
        ...formData,
        updatedDate: currentTime,
      };
      
      setImpactData(prev => prev.map(item => 
        item.id === editingData.id ? updatedData : item
      ));
      
      toast({
        title: "Success",
        description: "Impact & Demographics data updated successfully",
      });
    } else {
      // Add new data
      const newData: ImpactDemographics = {
        ...formData,
        id: Date.now().toString(),
        createdDate: currentTime,
        updatedDate: currentTime,
      };
      
      setImpactData(prev => [...prev, newData]);
      
      toast({
        title: "Success",
        description: "Impact & Demographics data added successfully",
      });
    }

    // Reset form
    setFormData({
      projectId: "",
      projectName: "",
      agencyAgreementNumber: "",
      region: "Regional",
      directParticipants: 0,
      indirectParticipants: 0,
    });
    setIsAddDialogOpen(false);
    setEditingData(null);
  };

  const handleEdit = (data: ImpactDemographics) => {
    setEditingData(data);
    setFormData({
      projectId: data.projectId,
      projectName: data.projectName,
      agencyAgreementNumber: data.agencyAgreementNumber,
      region: data.region,
      directParticipants: data.directParticipants,
      indirectParticipants: data.indirectParticipants,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setImpactData(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Impact & Demographics data deleted successfully",
    });
  };

  const totalDirectParticipants = impactData.reduce((sum, item) => sum + item.directParticipants, 0);
  const totalIndirectParticipants = impactData.reduce((sum, item) => sum + item.indirectParticipants, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Projects Tracked</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{impactData.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Direct Participants</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalDirectParticipants.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Indirect Participants</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{totalIndirectParticipants.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-blue-900">Impact & Demographics Data</h2>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Impact Data
        </Button>
      </div>

      {/* Data Table */}
      <Card className="border-blue-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="text-left p-4 font-medium text-blue-900">Project Name</th>
                  <th className="text-left p-4 font-medium text-blue-900">Agency Agreement #</th>
                  <th className="text-left p-4 font-medium text-blue-900">Region</th>
                  <th className="text-left p-4 font-medium text-blue-900">Direct Participants</th>
                  <th className="text-left p-4 font-medium text-blue-900">Indirect Participants</th>
                  <th className="text-left p-4 font-medium text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {impactData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No impact data added yet. Click "Add Impact Data" to get started.
                    </td>
                  </tr>
                ) : (
                  impactData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{item.projectName}</td>
                      <td className="p-4 text-gray-700">{item.agencyAgreementNumber}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.region === 'Regional' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.region}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{item.directParticipants.toLocaleString()}</td>
                      <td className="p-4 text-gray-700">{item.indirectParticipants.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setEditingData(null);
          setFormData({
            projectId: "",
            projectName: "",
            agencyAgreementNumber: "",
            region: "Regional",
            directParticipants: 0,
            indirectParticipants: 0,
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit" : "Add"} Impact & Demographics Data
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agencyAgreement">Agency Agreement #</Label>
              <Input
                id="agencyAgreement"
                value={formData.agencyAgreementNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, agencyAgreementNumber: e.target.value }))}
                placeholder="Enter agreement number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value: "Regional" | "Urban") => setFormData(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regional">Regional</SelectItem>
                  <SelectItem value="Urban">Urban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="directParticipants">Direct Participants</Label>
              <Input
                id="directParticipants"
                type="number"
                min="0"
                value={formData.directParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, directParticipants: parseInt(e.target.value) || 0 }))}
                placeholder="Enter number of direct participants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indirectParticipants">Indirect Participants</Label>
              <Input
                id="indirectParticipants"
                type="number"
                min="0"
                value={formData.indirectParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, indirectParticipants: parseInt(e.target.value) || 0 }))}
                placeholder="Enter number of indirect participants"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingData ? "Update" : "Add"} Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImpactDemographicsTab;