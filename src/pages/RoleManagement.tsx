import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'user';
  assigned_at: string;
  profile?: UserProfile;
}

const RoleManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dotnet-login');
      return;
    }

    fetchRoles();
  }, [isAuthenticated, navigate]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Note: Role management endpoints need to be added to your .NET API
      toast({
        title: 'Coming Soon',
        description: 'Role management endpoints need to be added to your .NET API',
      });
      setUserRoles([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select both a user and a role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Coming Soon',
      description: 'Role assignment endpoints need to be added to your .NET API',
    });
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    toast({
      title: 'Coming Soon',
      description: 'Role deletion endpoints need to be added to your .NET API',
    });
    
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Assign and manage user roles</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assign New Role</CardTitle>
            <CardDescription>Grant roles to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles
                      .reduce((acc: UserProfile[], curr) => {
                        if (curr.profile && !acc.find((p) => p.id === curr.profile?.id)) {
                          acc.push(curr.profile);
                        }
                        return acc;
                      }, [])
                      .map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.first_name} {profile.last_name} (@{profile.username})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignRole}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Role Assignments</CardTitle>
            <CardDescription>View and manage all role assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No role assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell>
                        {userRole.profile && (
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={userRole.profile.avatar_url} />
                              <AvatarFallback>
                                {getInitials(
                                  userRole.profile.first_name,
                                  userRole.profile.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {userRole.profile.first_name} {userRole.profile.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{userRole.profile.username}
                              </p>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userRole.role)}>
                          {userRole.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(userRole.assigned_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleToDelete(userRole.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Role Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this role assignment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRole}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
