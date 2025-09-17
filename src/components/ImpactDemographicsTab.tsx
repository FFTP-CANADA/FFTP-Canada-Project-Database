import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, MapPin, Plus, Save, Edit, Trash2 } from "lucide-react";
import { Project } from "@/types/project";
import { ImpactDemographics } from "@/types/impactDemographics";
import { LocalStorageManager } from "@/utils/localStorageManager";

interface ImpactDemographicsTabProps {
  projects: Project[];
}

const ImpactDemographicsTab = ({ projects }: ImpactDemographicsTabProps) => {
  const [impactData, setImpactData] = useState<ImpactDemographics[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    region: "" as "Urban" | "Rural" | "",
    directParticipants: 0,
    indirectParticipants: 0,
    notes: "",
  });

  // Load impact data from local storage and migrate existing data
  useEffect(() => {
    const savedData = LocalStorageManager.getItem('impactDemographics', []);
    // Migrate existing data to include notes field if it doesn't exist
    const migratedData = savedData.map(item => ({
      ...item,
      notes: item.notes || ""
    }));
    setImpactData(migratedData);
    
    // Save migrated data back if we made changes
    if (JSON.stringify(savedData) !== JSON.stringify(migratedData)) {
      LocalStorageManager.setItem('impactDemographics', migratedData);
    }
  }, []);

  // Save impact data to local storage
  const saveImpactData = (data: ImpactDemographics[]) => {
    LocalStorageManager.setItem('impactDemographics', data);
    setImpactData(data);
  };

  // Create initial entries for projects that don't have impact data
  useEffect(() => {
    const existingProjectIds = impactData.map(item => item.projectId);
    const newEntries: ImpactDemographics[] = [];

    projects.forEach(project => {
      if (!existingProjectIds.includes(project.id)) {
        newEntries.push({
          id: `impact-${project.id}`,
          projectId: project.id,
          projectName: project.projectName,
          governanceNumber: project.governanceNumber || "N/A",
          region: "Urban",
          directParticipants: 0,
          indirectParticipants: 0,
          notes: "",
        });
      }
    });

    if (newEntries.length > 0) {
      const updatedData = [...impactData, ...newEntries];
      saveImpactData(updatedData);
    }
  }, [projects, impactData]);

  const handleEdit = (item: ImpactDemographics) => {
    setEditingId(item.id);
    setFormData({
      region: item.region,
      directParticipants: item.directParticipants,
      indirectParticipants: item.indirectParticipants,
      notes: item.notes,
    });
  };

  const handleSave = (itemId: string) => {
    console.log('Save button clicked for itemId:', itemId);
    console.log('Current formData:', formData);
    
    const updatedData = impactData.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            region: formData.region as "Urban" | "Rural",
            directParticipants: formData.directParticipants,
            indirectParticipants: formData.indirectParticipants,
            notes: formData.notes || ""
          }
        : item
    );
    
    const savedItem = updatedData.find(item => item.id === itemId);
    console.log('Item being saved:', savedItem);
    console.log('Notes value:', savedItem?.notes);
    
    saveImpactData(updatedData);
    setEditingId(null);
    setFormData({ region: "", directParticipants: 0, indirectParticipants: 0, notes: "" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ region: "", directParticipants: 0, indirectParticipants: 0, notes: "" });
  };

  // Filter impact data to only show items for existing projects and group by country
  const existingProjectIds = projects.map(p => p.id);
  const validImpactData = impactData.filter(item => existingProjectIds.includes(item.projectId));

  // Group by country with sorting
  const impactDataByCountry = validImpactData.reduce((acc, item) => {
    const project = projects.find(p => p.id === item.projectId);
    const country = project?.country || "Unassigned";
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(item);
    return acc;
  }, {} as Record<string, typeof validImpactData>);

  // Sort countries and projects within each country
  const sortedCountries = Object.keys(impactDataByCountry).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-blue-900">Impact & Demographics</h2>
      </div>

      <div className="space-y-8">
        {sortedCountries.map(country => {
          // Sort projects within country by governance number
          const sortedProjects = impactDataByCountry[country].sort((a, b) => {
            const projectA = projects.find(p => p.id === a.projectId);
            const projectB = projects.find(p => p.id === b.projectId);
            
            if (projectA?.governanceNumber && projectB?.governanceNumber) {
              const aNum = parseInt(projectA.governanceNumber.replace(/\D/g, '')) || 0;
              const bNum = parseInt(projectB.governanceNumber.replace(/\D/g, '')) || 0;
              
              if (aNum === bNum) {
                return projectA.governanceNumber.localeCompare(projectB.governanceNumber, undefined, { numeric: true });
              }
              return aNum - bNum;
            }
            
            if (projectA?.governanceNumber && !projectB?.governanceNumber) return -1;
            if (!projectA?.governanceNumber && projectB?.governanceNumber) return 1;
            return (projectA?.projectName || "").localeCompare(projectB?.projectName || "");
          });

          return (
            <div key={country} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <MapPin className="w-5 h-5 inline mr-2" />
                  {country}
                </h3>
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {sortedProjects.length} {sortedProjects.length === 1 ? 'project' : 'projects'}
                </div>
              </div>
              
              <div className="grid gap-4 ml-4">
                {sortedProjects.map((item) => (
          <Card key={item.id} className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {item.projectName}
              </CardTitle>
              <p className="text-sm text-blue-600">
                Governance Number: {item.governanceNumber}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`region-${item.id}`}>Region</Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => setFormData({ ...formData, region: value as "Urban" | "Rural" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Urban">Urban</SelectItem>
                          <SelectItem value="Rural">Rural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`direct-${item.id}`}>Direct Participants</Label>
                      <Input
                        id={`direct-${item.id}`}
                        type="number"
                        min="0"
                        value={formData.directParticipants}
                        onChange={(e) => setFormData({ ...formData, directParticipants: parseInt(e.target.value) || 0 })}
                        placeholder="Enter count"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`indirect-${item.id}`}>Indirect Participants</Label>
                      <Input
                        id={`indirect-${item.id}`}
                        type="number"
                        min="0"
                        value={formData.indirectParticipants}
                        onChange={(e) => setFormData({ ...formData, indirectParticipants: parseInt(e.target.value) || 0 })}
                        placeholder="Enter count"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                    <Textarea
                      id={`notes-${item.id}`}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add detailed notes about this project's impact and demographics..."
                      className="min-h-[120px] resize-vertical"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleSave(item.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-700">Region:</span>
                      <span className="text-blue-900">{item.region}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-700">Direct Participants:</span>
                      <span className="text-blue-900">{item.directParticipants.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-700">Indirect Participants:</span>
                      <span className="text-blue-900">{item.indirectParticipants.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Notes field exists: {item.notes !== undefined ? 'Yes' : 'No'}, 
                    Value: "{item.notes}", 
                    Length: {item.notes?.length || 0}
                  </div>
                  
                  {item.notes && item.notes.trim() !== "" && (
                    <div className="mt-4">
                      <span className="font-medium text-blue-700 block mb-2">Notes:</span>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-blue-900 text-sm whitespace-pre-wrap">{item.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show this always for debugging */}
                  {(!item.notes || item.notes.trim() === "") && (
                    <div className="mt-4 text-gray-500 text-sm">
                      No notes saved yet.
                    </div>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Impact Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {validImpactData.length === 0 && (
          <Card className="border-blue-200">
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <p className="text-blue-600">No projects available for impact tracking.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImpactDemographicsTab;