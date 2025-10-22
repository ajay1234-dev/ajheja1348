import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus } from "lucide-react";

export default function Medications() {
  const [isAddingMedication, setIsAddingMedication] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["/api/medications"],
  });

  const { data: activeMedications } = useQuery({
    queryKey: ["/api/medications/active"],
  });

  return (
    <div className="space-y-6 fade-in">
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Total Medications
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {medications?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Plus className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Active Medications
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {activeMedications?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Plus className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Reminders Today
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {activeMedications?.filter((m) =>
                    m.frequency?.includes("daily")
                  ).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Plus className="h-6 w-6 text-white drop-shadow-lg" />
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
