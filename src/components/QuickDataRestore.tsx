import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackupManager } from "@/utils/backupManager";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, RefreshCw } from "lucide-react";

export const QuickDataRestore = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const handleRestoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const success = await BackupManager.restoreFromFile(file);
      if (success) {
        toast({
          title: "✅ Data Restored Successfully",
          description: "Your data has been restored. The page will refresh automatically.",
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "❌ Restore Failed",
          description: "Could not restore data from the selected file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to read the backup file.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const checkAutoBackups = () => {
    const backups = BackupManager.getAvailableBackups();
    if (backups.length > 0) {
      const latest = backups[0];
      toast({
        title: "Auto-backups Found",
        description: `Found ${backups.length} automatic backups. Latest: ${new Date(latest.timestamp).toLocaleString()}`,
      });
    } else {
      toast({
        title: "No Auto-backups",
        description: "No automatic backups were found in storage.",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Quick Data Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".json"
            onChange={handleRestoreFromFile}
            className="hidden"
            id="quick-restore-file"
            disabled={isRestoring}
          />
          <Button asChild className="w-full" disabled={isRestoring}>
            <label htmlFor="quick-restore-file">
              {isRestoring ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isRestoring ? "Restoring..." : "Select Backup File"}
            </label>
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          onClick={checkAutoBackups}
          className="w-full"
        >
          Check for Auto-backups
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          Select a .json backup file to restore your projects, notes, milestones, and other data.
        </div>
      </CardContent>
    </Card>
  );
};