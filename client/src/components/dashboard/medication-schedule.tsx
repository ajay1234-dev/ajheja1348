import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pill, Check, Plus } from "lucide-react";
import type { Medication } from "@shared/schema";

interface MedicationScheduleProps {
  medications: Medication[];
}

export default function MedicationSchedule({ medications }: MedicationScheduleProps) {
  const { toast } = useToast();

  const markTakenMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      // This would create a reminder entry or update medication log
      const response = await apiRequest("POST", "/api/reminders", {
        medicationId,
        type: "medication",
        title: "Medication Taken",
        message: "Medication marked as taken",
        scheduledTime: new Date().toISOString(),
        isCompleted: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medication Marked",
        description: "Successfully marked as taken",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark medication as taken",
        variant: "destructive",
      });
    },
  });

  const handleMarkTaken = (medicationId: string, medicationName: string) => {
    markTakenMutation.mutate(medicationId);
    
    toast({
      title: "Medication Taken",
      description: `${medicationName} has been marked as taken`,
    });
  };

  // Calculate next dose time (simplified logic)
  const getNextDoseTime = (frequency: string) => {
    const now = new Date();
    const hours = now.getHours();
    
    if (frequency.includes('daily') || frequency.includes('once')) {
      return '8:00 AM';
    } else if (frequency.includes('twice')) {
      return hours < 12 ? '2:00 PM' : '8:00 AM';
    } else if (frequency.includes('three') || frequency.includes('3')) {
      if (hours < 8) return '8:00 AM';
      if (hours < 14) return '2:00 PM';
      return '8:00 PM';
    }
    
    return '8:00 AM';
  };

  return (
    <Card className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition">
      <CardHeader className="border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Today's Medications
          </CardTitle>
          <Link href="/medications">
            <Button variant="outline" size="sm" data-testid="manage-medications" className="hover-lift">
              Manage All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No active medications</p>
            <Link href="/medications">
              <Button data-testid="add-first-medication">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.slice(0, 3).map((medication) => (
              <div
                key={medication.id}
                className="flex items-center justify-between p-4 border-2 border-border rounded-xl hover:shadow-xl hover:border-primary/30 smooth-transition hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
                data-testid={`medication-${medication.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center shadow-md">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {medication.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {medication.dosage} - {medication.frequency}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Next: {getNextDoseTime(medication.frequency)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-full hover:bg-green-100 hover:border-green-300 hover-lift smooth-transition"
                    onClick={() => handleMarkTaken(medication.id, medication.name)}
                    disabled={markTakenMutation.isPending}
                    data-testid={`mark-taken-${medication.id}`}
                  >
                    <Check className="h-5 w-5 text-green-600" />
                  </Button>
                </div>
              </div>
            ))}
            
            {medications.length > 3 && (
              <div className="text-center pt-2">
                <Link href="/medications">
                  <Button variant="ghost" size="sm">
                    View {medications.length - 3} more medications
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
