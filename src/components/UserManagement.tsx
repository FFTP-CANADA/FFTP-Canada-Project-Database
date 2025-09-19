import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, User, Crown, RefreshCw, Users } from "lucide-react";
import { useUserManagement, UserProfile } from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";

export const UserManagement = () => {
  const { users, loading, updateUserRole, refreshUsers } = useUserManagement();
  const { user: currentUser } = useAuth();
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    user: UserProfile | null;
    newRole: 'admin' | 'viewer' | null;
  }>({ open: false, user: null, newRole: null });

  const handleRoleChange = (user: UserProfile, newRole: 'admin' | 'viewer') => {
    if (user.user_id === currentUser?.id && newRole === 'viewer') {
      // Prevent demoting yourself
      return;
    }
    setRoleChangeDialog({ open: true, user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeDialog.user || !roleChangeDialog.newRole) return;
    
    const success = await updateUserRole(roleChangeDialog.user.user_id, roleChangeDialog.newRole);
    if (success) {
      setRoleChangeDialog({ open: false, user: null, newRole: null });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />;
  };

  const adminCount = users.filter(user => user.role === 'admin').length;
  const viewerCount = users.filter(user => user.role === 'viewer').length;

  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription className="text-blue-600">
              Manage user roles and permissions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshUsers}
            disabled={loading}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Admins</p>
                  <p className="text-2xl font-bold text-green-700">{adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Viewers</p>
                  <p className="text-2xl font-bold text-blue-700">{viewerCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <div className="border border-blue-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-blue-600">
              <TableRow>
                <TableHead className="text-white">User</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Current Role</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-blue-600">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-blue-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <div>
                          <p className="font-medium text-blue-900">
                            {user.display_name || 'Anonymous User'}
                          </p>
                          {user.user_id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-blue-700">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)}
                        className={user.role === 'admin' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-blue-100 text-blue-800 border-blue-300'}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'admin' | 'viewer') => handleRoleChange(user, newRole)}
                        disabled={user.user_id === currentUser?.id}
                      >
                        <SelectTrigger className="w-32 border-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.user_id === currentUser?.id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Can't change your own role
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Role Change Confirmation Dialog */}
        <AlertDialog open={roleChangeDialog.open} onOpenChange={(open) => !open && setRoleChangeDialog({ open: false, user: null, newRole: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change <strong>{roleChangeDialog.user?.display_name || roleChangeDialog.user?.email}</strong>'s role to{' '}
                <strong>{roleChangeDialog.newRole}</strong>?
                {roleChangeDialog.newRole === 'admin' && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    This will give them full administrative privileges including the ability to edit all projects and manage other users.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRoleChange}
                className={roleChangeDialog.newRole === 'admin' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};