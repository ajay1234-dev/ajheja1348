import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CloudUpload, File, CheckCircle, AlertCircle, Stethoscope, Loader2, UserCheck } from "lucide-react";

export default function UploadReportForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestedDoctor, setSuggestedDoctor] = useState<any>(null);
  const [sharedReportId, setSharedReportId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
  const uploadingRef = useRef<boolean>(false); // Prevent duplicate submissions
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File }) => {
      // Step 1: Upload the file first
      const formData = new FormData();
      formData.append('file', data.file);

      const uploadResponse = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const reportId = uploadResult.reportId;

      // Step 2: Poll until OCR processing is complete (originalText is available)
      let reportDetails;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds maximum wait time
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
        
        const reportResponse = await fetch(`/api/reports/${reportId}`, {
          credentials: 'include',
        });

        if (!reportResponse.ok) {
          throw new Error('Failed to fetch report details');
        }

        reportDetails = await reportResponse.json();
        
        // Check if OCR has completed (originalText is available)
        if (reportDetails.originalText && reportDetails.originalText.trim()) {
          console.log(`✅ OCR completed after ${attempts + 1} seconds`);
          break;
        }
        
        attempts++;
        console.log(`⏳ Waiting for OCR processing... (${attempts}/${maxAttempts})`);
      }
      
      if (!reportDetails?.originalText || !reportDetails.originalText.trim()) {
        throw new Error('OCR processing timeout - please try again or use a clearer image');
      }

      // Step 3: Call the uploadReport endpoint for AI analysis
      const assignResponse = await fetch('/api/uploadReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user?.id,
          reportId: reportId,
          reportURL: reportDetails.fileUrl,
        }),
        credentials: 'include',
      });

      if (!assignResponse.ok) {
        throw new Error('Doctor assignment failed');
      }

      return assignResponse.json();
    },
    onMutate: () => {
      setUploadProgress(0);
      setSuggestedDoctor(null);
      setSharedReportId(null);
      setApprovalStatus('pending');
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      setTimeout(() => clearInterval(interval), 2000);
    },
    onSuccess: (data) => {
      uploadingRef.current = false; // Reset upload lock
      setUploadProgress(100);
      setSuggestedDoctor(data.suggestedDoctor);
      setSharedReportId(data.reportId);
      setApprovalStatus(data.approvalStatus || 'pending');
      
      toast({
        title: "✅ Report Analyzed Successfully!",
        description: `AI detected: ${data.aiDetection.detectedSpecialization}. Doctor suggested for your approval.`,
        duration: 6000,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
    },
    onError: (error) => {
      uploadingRef.current = false; // Reset upload lock
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('PUT', `/api/shared-reports/${reportId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      setApprovalStatus('approved');
      toast({
        title: "✅ Doctor Approved!",
        description: "The doctor will now be able to see your report and provide care.",
        duration: 5000,
      });
      
      // Invalidate queries to refresh both patient and doctor lists
      queryClient.invalidateQueries({ queryKey: ["/api/patient/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/shared-reports"] });
      
      // Reset form after approval
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setSuggestedDoctor(null);
        setSharedReportId(null);
        setApprovalStatus('pending');
        uploadingRef.current = false; // Ensure upload lock is reset
      }, 3000);
    },
    onError: (error) => {
      // Check if error is because doctor is already approved
      const errorMessage = error instanceof Error ? error.message : "Failed to approve doctor";
      
      if (errorMessage.includes("already approved")) {
        // If already approved, update state to reflect that
        setApprovalStatus('approved');
        toast({
          title: "Already Approved",
          description: "This doctor has already been approved for your report.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Approval Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleApprove = () => {
    // Prevent approval if already approved or in progress
    if (approvalStatus === 'approved' || approveMutation.isPending) {
      return;
    }
    
    if (sharedReportId) {
      approveMutation.mutate(sharedReportId);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPG, or PNG files only.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (uploadingRef.current || uploadMutation.isPending) {
      console.log('⚠️ Upload already in progress, ignoring duplicate submission');
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadingRef.current = true;
    uploadMutation.mutate({
      file: selectedFile,
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Upload Medical Report</CardTitle>
        <CardDescription>
          Upload your medical report or prescription for AI-powered analysis and automatic doctor assignment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Medical Report File *</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              }`}
              data-testid="upload-zone"
            >
              <input {...getInputProps()} data-testid="file-input" id="file" />

              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {selectedFile ? (
                  <File className="h-8 w-8 text-primary" />
                ) : (
                  <CloudUpload className="h-8 w-8 text-primary" />
                )}
              </div>

              {selectedFile ? (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-2">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-2">
                    Drop your file here
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, PNG, JPG files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading and processing...</span>
                <span className="font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Success Message with Suggested Doctor */}
          {suggestedDoctor && (
            <Card className={approvalStatus === 'approved' ? 
              "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" :
              "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            }>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    approvalStatus === 'approved' ?
                    "bg-green-100 dark:bg-green-900" :
                    "bg-blue-100 dark:bg-blue-900"
                  }`}>
                    {approvalStatus === 'approved' ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      approvalStatus === 'approved' ?
                      "text-green-900 dark:text-green-100" :
                      "text-blue-900 dark:text-blue-100"
                    }`}>
                      {approvalStatus === 'approved' ? 'Doctor Approved!' : 'Doctor Suggested for Approval'}
                    </h4>
                    <div className={`flex items-center space-x-2 text-sm ${
                      approvalStatus === 'approved' ?
                      "text-green-800 dark:text-green-200" :
                      "text-blue-800 dark:text-blue-200"
                    }`}>
                      <UserCheck className="h-4 w-4" />
                      <span>
                        <strong>Dr. {suggestedDoctor.firstName} {suggestedDoctor.lastName}</strong>
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      approvalStatus === 'approved' ?
                      "text-green-700 dark:text-green-300" :
                      "text-blue-700 dark:text-blue-300"
                    }`}>
                      Specialization: {suggestedDoctor.specialization}
                    </p>
                    
                    {approvalStatus === 'pending' && (
                      <div className="mt-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                          Based on AI analysis of your report, we recommend this specialist. Click below to approve.
                        </p>
                        <Button
                          onClick={handleApprove}
                          disabled={approveMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-approve-doctor"
                        >
                          {approveMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Doctor
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {approvalStatus === 'approved' && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        ✓ The doctor can now see your report and provide care
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={uploadMutation.isPending}
            data-testid="button-submit"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4 mr-2" />
                Upload Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
