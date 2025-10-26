import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MedicationList from "@/components/medications/medication-list";
import ReminderSetup from "@/components/medications/reminder-setup";
import { Plus, Trash } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Medication } from "@shared/schema";

export default function Medications() {
  const [isAddingMedication, setIsAddingMedication] = useState(false);

  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: activeMedications } = useQuery<Medication[]>({
    queryKey: ["/api/medications/active"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/medications");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
    },
  });

  return (
    <div className="space-y-6 fade-in bg-white dark:bg-slate-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Medications
          </h1>
          <p className="text-muted-foreground">
            Manage your medications and set up reminders for better adherence
          </p>
        </div>

        <Dialog open={isAddingMedication} onOpenChange={setIsAddingMedication}>
          <DialogTrigger asChild>
            <Button data-testid="add-medication-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Add a medication and set up reminders to help you stay on track
              </DialogDescription>
            </DialogHeader>
            <ReminderSetup onSuccess={() => setIsAddingMedication(false)} />
          </DialogContent>
        </Dialog>
        <Button
          variant="destructive"
          type="button"
          onClick={() => deleteAllMutation.mutate()}
          disabled={deleteAllMutation.isPending}
          className="ml-2"
          data-testid="delete-all-medications"
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete All
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Medications
                </p>
                <p className="text-2xl font-bold">{medications?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Medications
                </p>
                <p className="text-2xl font-bold">
                  {activeMedications?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reminders Today</p>
                <p className="text-2xl font-bold">
                  {(activeMedications || []).filter((m: Medication) =>
                    m.frequency?.includes("daily")
                  ).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medications List */}
      <MedicationList medications={medications || []} isLoading={isLoading} />
    </div>
  );
}
