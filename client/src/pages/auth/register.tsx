import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, UserIcon, Stethoscope, Activity, Pill, FileText } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    specialization: "",
    age: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const { register, loginWithFirebase } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) return;

      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setIsGoogleLoading(true);

          const idToken = await result.user.getIdToken();

          setPendingIdToken(idToken);
          setShowRoleDialog(true);
          setIsGoogleLoading(false);
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
        toast({
          title: "Sign-in failed",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
    };

    handleRedirectResult();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.role === "doctor" && !formData.specialization) {
      toast({
        title: "Specialization required",
        description: "Please select your medical specialization.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const registrationData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "doctor" && formData.specialization) {
        registrationData.specialization = formData.specialization;
      }

      if (formData.role === "patient") {
        if (formData.age) {
          registrationData.age = parseInt(formData.age);
        }
        if (formData.gender) {
          registrationData.gender = formData.gender;
        }
      }

      await register(registrationData);

      toast({
        title: "Account created!",
        description: "Welcome to MediCare. You can now start managing your health.",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      toast({
        title: "Configuration error",
        description: "Firebase is not properly configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGoogleLoading(true);
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in failed",
        description: "Failed to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleRoleSelection = async () => {
    if (!pendingIdToken) return;

    if (selectedRole === "doctor" && !selectedSpecialization) {
      toast({
        title: "Specialization required",
        description: "Please select your medical specialization.",
        variant: "destructive",
      });
      return;
    }

    setIsGoogleLoading(true);
    setShowRoleDialog(false);

    try {
      const roleData: any = { role: selectedRole };

      if (selectedRole === "doctor" && selectedSpecialization) {
        roleData.specialization = selectedSpecialization;
      }

      if (selectedRole === "patient") {
        if (selectedAge) {
          roleData.age = parseInt(selectedAge);
        }
        if (selectedGender) {
          roleData.gender = selectedGender;
        }
      }

      await loginWithFirebase(pendingIdToken, selectedRole, roleData);

      toast({
        title: "Welcome!",
        description: "You have successfully signed up with Google.",
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      toast({
        title: "Sign-up failed",
        description: "Failed to complete sign-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
      setPendingIdToken(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="absolute top-10 left-10 float-animation">
        <Activity className="h-12 w-12 text-white/30" />
      </div>
      <div className="absolute top-20 right-20 float-animation" style={{ animationDelay: '1s' }}>
        <Pill className="h-10 w-10 text-white/30" />
      </div>
      <div className="absolute bottom-20 left-20 float-animation" style={{ animationDelay: '2s' }}>
        <FileText className="h-10 w-10 text-white/30" />
      </div>

      <Card className="w-full max-w-2xl card-3d backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 shadow-2xl relative z-10 slide-in-bottom">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center pulse-ring rotate-3d shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text">MediCare</span>
          </div>
          <CardTitle className="text-3xl font-bold text-shadow-light dark:text-shadow-dark">Create your account</CardTitle>
          <CardDescription className="text-base">
            Join MediCare to start managing your health data effectively
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-first-name"
                  className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-last-name"
                  className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">I am a</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
                data-testid="role-selection"
              >
                <Label
                  htmlFor="patient"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-4 hover:border-primary hover:shadow-lg smooth-transition cursor-pointer ${
                    formData.role === "patient" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="patient" id="patient" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${formData.role === "patient" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <UserIcon className={`h-6 w-6 ${formData.role === "patient" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-sm font-semibold">Patient</span>
                </Label>
                <Label
                  htmlFor="doctor"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-4 hover:border-primary hover:shadow-lg smooth-transition cursor-pointer ${
                    formData.role === "doctor" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="doctor" id="doctor" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${formData.role === "doctor" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <Stethoscope className={`h-6 w-6 ${formData.role === "doctor" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-sm font-semibold">Doctor</span>
                </Label>
              </RadioGroup>
            </div>

            {formData.role === "doctor" && (
              <div className="space-y-2 slide-in-right">
                <Label htmlFor="specialization" className="text-sm font-semibold">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                >
                  <SelectTrigger data-testid="select-specialization" className="smooth-transition hover:border-primary">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                    <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                    <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="Neurologist">Neurologist</SelectItem>
                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="Ophthalmologist">Ophthalmologist</SelectItem>
                    <SelectItem value="General Physician">General Physician</SelectItem>
                    <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                    <SelectItem value="ENT Specialist">ENT Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === "patient" && (
              <div className="grid grid-cols-2 gap-4 slide-in-right">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-semibold">Age (optional)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                    data-testid="input-age"
                    className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold">Gender (optional)</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger data-testid="select-gender" className="smooth-transition hover:border-primary">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="input-email"
                className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                required
                data-testid="input-password"
                className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                data-testid="input-confirm-password"
                className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold hover-lift bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading || isGoogleLoading}
              data-testid="button-register"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {auth && googleProvider && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-muted-foreground font-semibold">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-semibold hover-lift border-2"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                data-testid="button-google-signup"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing up with Google...
                  </>
                ) : (
                  <>
                    <SiGoogle className="mr-2 h-5 w-5 text-red-500" />
                    Sign up with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold hover:text-primary/80 smooth-transition" data-testid="link-login">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-base">
              Please select your role and provide additional information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2">I am a</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value);
                  setSelectedSpecialization("");
                  setSelectedAge("");
                  setSelectedGender("");
                }}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <Label
                  htmlFor="role-patient-register"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground cursor-pointer smooth-transition ${
                    selectedRole === "patient" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="patient" id="role-patient-register" className="sr-only" />
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${selectedRole === "patient" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <UserIcon className={`h-7 w-7 ${selectedRole === "patient" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-base font-semibold">Patient</span>
                </Label>
                <Label
                  htmlFor="role-doctor-register"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground cursor-pointer smooth-transition ${
                    selectedRole === "doctor" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="doctor" id="role-doctor-register" className="sr-only" />
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${selectedRole === "doctor" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <Stethoscope className={`h-7 w-7 ${selectedRole === "doctor" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-base font-semibold">Doctor</span>
                </Label>
              </RadioGroup>
            </div>

            {selectedRole === "doctor" && (
              <div className="space-y-2 slide-in-right">
                <Label htmlFor="google-specialization" className="text-sm font-semibold">Specialization *</Label>
                <Select
                  value={selectedSpecialization}
                  onValueChange={setSelectedSpecialization}
                >
                  <SelectTrigger data-testid="select-google-specialization" className="smooth-transition hover:border-primary">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                    <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                    <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="Neurologist">Neurologist</SelectItem>
                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="Ophthalmologist">Ophthalmologist</SelectItem>
                    <SelectItem value="General Physician">General Physician</SelectItem>
                    <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                    <SelectItem value="ENT Specialist">ENT Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === "patient" && (
              <div className="grid grid-cols-2 gap-4 slide-in-right">
                <div className="space-y-2">
                  <Label htmlFor="google-age" className="text-sm font-semibold">Age (optional)</Label>
                  <Input
                    id="google-age"
                    type="number"
                    placeholder="25"
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    min="0"
                    max="120"
                    data-testid="input-google-age"
                    className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-gender" className="text-sm font-semibold">Gender (optional)</Label>
                  <Select
                    value={selectedGender}
                    onValueChange={setSelectedGender}
                  >
                    <SelectTrigger data-testid="select-google-gender" className="smooth-transition hover:border-primary">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button
              onClick={handleRoleSelection}
              className="w-full h-12 text-base font-semibold hover-lift bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isGoogleLoading}
              data-testid="button-confirm-role-register"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
