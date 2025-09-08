import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BackupManager } from "@/utils/backupManager";
import { LocalStorageManager } from "@/utils/localStorageManager";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Database } from "lucide-react";

export const DataRecoveryDialog = () => {
  const [open, setOpen] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateBackup = async () => {
    try {
      const backup = await BackupManager.createFullBackup();
      setBackupData(backup);
      BackupManager.downloadBackup(backup);
      toast({
        title: "Backup Created",
        description: "Your data backup has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const success = await BackupManager.restoreFromFile(file);
      if (success) {
        toast({
          title: "Data Restored",
          description: "Your data has been restored successfully. Please refresh the page.",
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "Restore Failed",
          description: "Failed to restore data from file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Error",
        description: "Error reading backup file.",
        variant: "destructive",
      });
    }
  };

  const getCurrentDataSummary = () => {
    const projects = LocalStorageManager.getItem('projects', []);
    const notes = LocalStorageManager.getItem('project-notes', []);
    const milestones = LocalStorageManager.getItem('project-milestones', []);
    const attachments = LocalStorageManager.getItem('project-attachments', []);
    const undesignatedFunds = LocalStorageManager.getItem('undesignated-funds', []);
    const reallocations = LocalStorageManager.getItem('fund-reallocations', []);

    return {
      projects: projects.length,
      notes: notes.length,
      milestones: milestones.length,
      attachments: attachments.length,
      undesignatedFunds: undesignatedFunds.length,
      reallocations: reallocations.length,
    };
  };

  const dataSummary = getCurrentDataSummary();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Data Recovery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Data Recovery & Backup</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Projects: <span className="font-semibold">{dataSummary.projects}</span></div>
                <div>Notes: <span className="font-semibold">{dataSummary.notes}</span></div>
                <div>Milestones: <span className="font-semibold">{dataSummary.milestones}</span></div>
                <div>Attachments: <span className="font-semibold">{dataSummary.attachments}</span></div>
                <div>Undesignated Funds: <span className="font-semibold">{dataSummary.undesignatedFunds}</span></div>
                <div>Fund Reallocations: <span className="font-semibold">{dataSummary.reallocations}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleCreateBackup} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Create & Download Backup
            </Button>
            
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFromFile}
                className="hidden"
                id="restore-file"
              />
              <Button asChild className="w-full">
                <label htmlFor="restore-file">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </label>
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• If you're missing data, you may have had it in a different browser or it was cleared</p>
            <p>• Use "Create Backup" to save your current data</p>
            <p>• Use "Restore from Backup" to restore from a previous backup file</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};