import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserCircle, Save, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User } from "@shared/schema";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState<Partial<User>>({});

  // Update formData when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        specialization: profile.specialization || '',
        age: profile.age || undefined,
        gender: profile.gender || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest('PATCH', '/api/profile', updates);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
      navigate('/login');
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        specialization: profile.specialization || '',
        age: profile.age || undefined,
        gender: profile.gender || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal information
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            data-testid="button-edit-profile"
          >
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your basic profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={isEditing ? formData.firstName : profile.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                data-testid="input-firstName"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={isEditing ? formData.lastName : profile.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                data-testid="input-lastName"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
              data-testid="input-email"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={isEditing ? (formData.phone ?? '') : (profile.phone ?? '')}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter phone number"
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={isEditing ? (formData.dateOfBirth ?? '') : (profile.dateOfBirth ?? '')}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              disabled={!isEditing}
              data-testid="input-dateOfBirth"
            />
          </div>

          {profile.role === 'doctor' && (
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={isEditing ? (formData.specialization ?? '') : (profile.specialization ?? '')}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Cardiology, Neurology"
                data-testid="input-specialization"
              />
            </div>
          )}

          {profile.role === 'patient' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={isEditing ? (formData.age ?? '') : (profile.age ?? '')}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                  disabled={!isEditing}
                  placeholder="Enter age"
                  data-testid="input-age"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={isEditing ? (formData.gender ?? '') : (profile.gender ?? '')}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Male, Female, Other"
                  data-testid="input-gender"
                />
              </div>
            </>
          )}

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1"
                data-testid="button-save-profile"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updateMutation.isPending}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                data-testid="button-delete-account"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All medical reports</li>
                    <li>Medication records</li>
                    <li>Health timeline</li>
                    <li>Reminders</li>
                    <li>Shared reports and doctor assignments</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
