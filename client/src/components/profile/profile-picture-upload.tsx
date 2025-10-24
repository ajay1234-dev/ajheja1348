import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Camera, Trash2, Upload, Loader2, UserCircle } from "lucide-react";
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

interface ProfilePictureUploadProps {
  currentPictureUrl?: string | null;
  userId: string;
}

export default function ProfilePictureUpload({
  currentPictureUrl,
  userId,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    currentPictureUrl || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload profile picture";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const textError = await response.text();
            console.error("Server returned non-JSON response:", textError);
            errorMessage = "Server error. Please try again.";
          }
        } catch (parseError) {
          console.error("Error parsing server response:", parseError);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
      setPreview(data.profilePictureUrl);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/profile/picture", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete profile picture";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const textError = await response.text();
            console.error("Server returned non-JSON response:", textError);
            errorMessage = "Server error. Please try again.";
          }
        } catch (parseError) {
          console.error("Error parsing server response:", parseError);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully.",
      });
      setPreview(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(currentPictureUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a profile picture to personalize your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          {/* Profile Picture Preview */}
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-slate-800 border-4 border-gray-200 dark:border-slate-700 flex items-center justify-center">
                <UserCircle className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
            {selectedFile && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="profile-picture-input"
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {!selectedFile && (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  data-testid="button-choose-picture"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {preview ? "Change Picture" : "Upload Picture"}
                </Button>
                {preview && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        data-testid="button-remove-picture"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove Profile Picture?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove your profile picture?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}

            {selectedFile && (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-picture"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Save Picture
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={uploadMutation.isPending}
                  data-testid="button-cancel-picture"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Supports JPG, PNG, WEBP • Max size 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
