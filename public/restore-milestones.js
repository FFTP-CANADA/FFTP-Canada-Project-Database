// IMMEDIATE milestone restoration
console.log("🚨 IMMEDIATE MILESTONE RESTORATION STARTING");

// Check all backup keys from localStorage
const allKeys = Object.keys(localStorage);
console.log("Total localStorage keys:", allKeys.length);

const backupKeys = allKeys.filter(key => key.startsWith('fftp_fftp_backup_'));
console.log("Found backup keys:", backupKeys.length);

// Find the most recent backup with milestone data
let foundMilestones = null;
let backupSource = null;

for (const key of backupKeys.slice(0, 10)) { // Check first 10 most recent
  try {
    const backupData = localStorage.getItem(key);
    if (backupData) {
      const backup = JSON.parse(backupData);
      if (backup.data && backup.data.milestones && backup.data.milestones.length > 0) {
        foundMilestones = backup.data.milestones;
        backupSource = key;
        console.log(`🔍 FOUND MILESTONES in ${key}:`, foundMilestones.length);
        break;
      }
    }
  } catch (e) {
    console.log(`Failed to parse backup ${key}`);
  }
}

if (foundMilestones) {
  console.log("✅ RESTORING MILESTONES NOW");
  console.log("Milestone count:", foundMilestones.length);
  console.log("Source backup:", backupSource);
  
  // Restore to both storage locations
  localStorage.setItem('project-milestones', JSON.stringify(foundMilestones));
  localStorage.setItem('fftp_project-milestones', JSON.stringify(foundMilestones));
  
  console.log("✅ MILESTONES RESTORED - RELOADING PAGE");
  window.location.reload();
} else {
  console.log("❌ NO MILESTONE DATA FOUND IN BACKUPS");
  
  // Try to find any milestone data anywhere
  for (const key of allKeys) {
    if (key.toLowerCase().includes('milestone')) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found milestone key ${key}:`, parsed);
        }
      } catch (e) {}
    }
  }
}