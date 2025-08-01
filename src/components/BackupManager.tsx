import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { BackupManager, FullBackup } from '@/utils/backupManager';
import { Download, Upload, Save, AlertTriangle, CheckCircle, History } from 'lucide-react';
import { toast } from 'sonner';

export const BackupManagerComponent = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<FullBackup[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = await BackupManager.createFullBackup();
      toast.success('Backup created successfully');
      
      // Also download it immediately
      BackupManager.downloadBackup(backup);
    } catch (error) {
      toast.error('Failed to create backup');
      console.error(error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backup = await BackupManager.createFullBackup();
      BackupManager.downloadBackup(backup);
      toast.success('Backup downloaded');
    } catch (error) {
      toast.error('Failed to download backup');
      console.error(error);
    }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const success = await BackupManager.restoreFromFile(file);
      if (success) {
        toast.success('Data restored successfully - page will reload');
      } else {
        toast.error('Failed to restore data');
      }
    } catch (error) {
      toast.error('Invalid backup file');
      console.error(error);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestoreFromAutoBackup = async (backup: FullBackup) => {
    setIsRestoring(true);
    try {
      const success = await BackupManager.restoreFromBackup(backup);
      if (success) {
        toast.success('Data restored successfully - page will reload');
      } else {
        toast.error('Failed to restore data');
      }
    } catch (error) {
      toast.error('Failed to restore backup');
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };

  const loadAvailableBackups = () => {
    setAvailableBackups(BackupManager.getAvailableBackups());
    setShowBackups(true);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Data Backup & Restore
        </CardTitle>
        <CardDescription>
          Permanently protect your data with comprehensive backup and restore capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Auto-backup is active:</strong> Your data is automatically backed up every 5 minutes and saved locally. 
            For maximum protection, also download manual backups regularly.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleCreateBackup} 
            disabled={isCreatingBackup}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : 'Create & Download Backup'}
          </Button>

          <Button 
            onClick={handleDownloadBackup}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Current Backup
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Restore from File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore from Backup File</DialogTitle>
                <DialogDescription>
                  Select a backup file to restore all your data. This will overwrite current data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This will replace ALL current data with the backup data.
                  </AlertDescription>
                </Alert>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  disabled={isRestoring}
                  className="w-full"
                />
                {isRestoring && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Restoring data...
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={loadAvailableBackups}
            variant="outline"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            View Auto-Backups
          </Button>
        </div>

        {showBackups && (
          <div className="space-y-4">
            <h4 className="font-semibold">Available Auto-Backups</h4>
            {availableBackups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No auto-backups found</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableBackups.map((backup, index) => (
                  <div key={backup.timestamp} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        {backup.data.projects.length} projects, {backup.data.attachments.length} attachments
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreFromAutoBackup(backup)}
                      disabled={isRestoring}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Multiple Protection Layers:</strong>
            <ul className="list-disc list-inside mt-1 text-sm">
              <li>Auto-backups every 5 minutes stored locally</li>
              <li>Manual backup downloads for external storage</li>
              <li>Backup-before-save protection on every operation</li>
              <li>Global state management prevents data conflicts</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};