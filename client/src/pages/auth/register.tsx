import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Loader2,
  UserIcon,
  Stethoscope,
  Activity,
  Pill,
  FileText,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { HeroImage, MEDICAL_IMAGES } from "@/components/ui/hero-image";
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
        description:
          "Welcome to MediCare. You can now start managing your health.",
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
        description:
          "Firebase is not properly configured. Please contact support.",
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
    <div className="min-h-screen flex items-center justify-center futuristic-bg px-4 py-8 relative overflow-hidden">
      {/* Hero Section with Image */}
      <div className="absolute inset-0">
        <HeroImage
          src={MEDICAL_IMAGES.hero}
          alt="Healthcare Registration"
          className="w-full h-full"
          overlay={true}
        />
      </div>

      {/* Floating Particles Background */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse floating-particles"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700 floating-particles"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000 floating-particles"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500 floating-particles"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-10 left-10 floating-particles">
        <Activity className="h-12 w-12 text-white/40 drop-shadow-lg" />
      </div>
      <div
        className="absolute top-20 right-20 floating-particles"
        style={{ animationDelay: "1s" }}
      >
        <Pill className="h-10 w-10 text-white/40 drop-shadow-lg" />
      </div>
      <div
        className="absolute bottom-20 left-20 floating-particles"
        style={{ animationDelay: "2s" }}
      >
        <FileText className="h-10 w-10 text-white/40 drop-shadow-lg" />
      </div>
      <div
        className="absolute bottom-10 right-10 floating-particles"
        style={{ animationDelay: "3s" }}
      >
        <Heart className="h-8 w-8 text-white/40 drop-shadow-lg" />
      </div>

      <Card className="w-full max-w-2xl glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 shadow-2xl relative z-10 page-transition border-2 border-white/20 dark:border-white/10">
        <CardHeader className="space-y-1 text-center p-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center soft-glow shadow-2xl">
              <Heart className="h-9 w-9 text-white drop-shadow-lg" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              MediCare
            </span>
          </div>
          <CardTitle className="text-3xl font-bold text-white drop-shadow-lg">
            Create your account
          </CardTitle>
          <CardDescription className="text-lg text-white/80 drop-shadow-md">
            Join MediCare to start managing your health data effectively
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-semibold text-white/90 drop-shadow-md"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-first-name"
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-semibold text-white/90 drop-shadow-md"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-last-name"
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white/90 drop-shadow-md">
                I am a
              </Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
                className="grid grid-cols-2 gap-4"
                data-testid="role-selection"
              >
                <Label
                  htmlFor="patient"
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-5 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    formData.role === "patient"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="patient"
                    id="patient"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      formData.role === "patient"
                        ? "bg-sky-400/20"
                        : "bg-white/10"
                    }`}
                  >
                    <UserIcon
                      className={`h-7 w-7 ${
                        formData.role === "patient"
                          ? "text-sky-400"
                          : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow-md">
                    Patient
                  </span>
                </Label>
                <Label
                  htmlFor="doctor"
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-5 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    formData.role === "doctor"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="doctor"
                    id="doctor"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      formData.role === "doctor"
                        ? "bg-sky-400/20"
                        : "bg-white/10"
                    }`}
                  >
                    <Stethoscope
                      className={`h-7 w-7 ${
                        formData.role === "doctor"
                          ? "text-sky-400"
                          : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow-md">
                    Doctor
                  </span>
                </Label>
              </RadioGroup>
            </div>

            {formData.role === "doctor" && (
              <div className="space-y-3 slide-in-right">
                <Label
                  htmlFor="specialization"
                  className="text-sm font-semibold text-white/90 drop-shadow-md"
                >
                  Specialization *
                </Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) =>
                    setFormData({ ...formData, specialization: value })
                  }
                >
                  <SelectTrigger
                    data-testid="select-specialization"
                    className="h-12 bg-white/20 border-white/30 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
                  >
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent className="glass-card backdrop-blur-xl bg-white/10 border-white/20">
                    <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                    <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                    <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="Neurologist">Neurologist</SelectItem>
                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="Ophthalmologist">
                      Ophthalmologist
                    </SelectItem>
                    <SelectItem value="General Physician">
                      General Physician
                    </SelectItem>
                    <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                    <SelectItem value="ENT Specialist">
                      ENT Specialist
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === "patient" && (
              <div className="grid grid-cols-2 gap-4 slide-in-right">
                <div className="space-y-3">
                  <Label
                    htmlFor="age"
                    className="text-sm font-semibold text-white/90 drop-shadow-md"
                  >
                    Age (optional)
                  </Label>
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
                    className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="gender"
                    className="text-sm font-semibold text-white/90 drop-shadow-md"
                  >
                    Gender (optional)
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger
                      data-testid="select-gender"
                      className="h-12 bg-white/20 border-white/30 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="glass-card backdrop-blur-xl bg-white/10 border-white/20">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-white/90 drop-shadow-md"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="input-email"
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-white/90 drop-shadow-md"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                required
                data-testid="input-password"
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-white/90 drop-shadow-md"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                data-testid="input-confirm-password"
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:from-sky-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-sky-400/25 transition-all duration-300 transform hover:scale-105"
              disabled={isLoading || isGoogleLoading}
              data-testid="button-register"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {auth && googleProvider && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-transparent px-4 text-white/70 font-semibold backdrop-blur-sm">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                data-testid="button-google-signup"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Signing up with Google...
                  </>
                ) : (
                  <>
                    <SiGoogle className="mr-3 h-6 w-6 text-red-400" />
                    Sign up with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-white/80">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-sky-400 hover:text-sky-300 font-semibold hover:underline smooth-transition drop-shadow-md"
                data-testid="link-login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-2xl glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold text-white drop-shadow-lg">
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-lg text-white/80 drop-shadow-md">
              Please select your role and provide additional information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div>
              <Label className="text-sm font-semibold mb-3 text-white/90 drop-shadow-md">
                I am a
              </Label>
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
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-6 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    selectedRole === "patient"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="patient"
                    id="role-patient-register"
                    className="sr-only"
                  />
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedRole === "patient"
                        ? "bg-sky-400/20"
                        : "bg-white/10"
                    }`}
                  >
                    <UserIcon
                      className={`h-8 w-8 ${
                        selectedRole === "patient"
                          ? "text-sky-400"
                          : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-lg font-semibold text-white drop-shadow-md">
                    Patient
                  </span>
                </Label>
                <Label
                  htmlFor="role-doctor-register"
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-6 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    selectedRole === "doctor"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="doctor"
                    id="role-doctor-register"
                    className="sr-only"
                  />
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedRole === "doctor"
                        ? "bg-sky-400/20"
                        : "bg-white/10"
                    }`}
                  >
                    <Stethoscope
                      className={`h-8 w-8 ${
                        selectedRole === "doctor"
                          ? "text-sky-400"
                          : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-lg font-semibold text-white drop-shadow-md">
                    Doctor
                  </span>
                </Label>
              </RadioGroup>
            </div>

            {selectedRole === "doctor" && (
              <div className="space-y-2 slide-in-right">
                <Label
                  htmlFor="google-specialization"
                  className="text-sm font-semibold"
                >
                  Specialization *
                </Label>
                <Select
                  value={selectedSpecialization}
                  onValueChange={setSelectedSpecialization}
                >
                  <SelectTrigger
                    data-testid="select-google-specialization"
                    className="smooth-transition hover:border-primary"
                  >
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                    <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                    <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="Neurologist">Neurologist</SelectItem>
                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="Ophthalmologist">
                      Ophthalmologist
                    </SelectItem>
                    <SelectItem value="General Physician">
                      General Physician
                    </SelectItem>
                    <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                    <SelectItem value="ENT Specialist">
                      ENT Specialist
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === "patient" && (
              <div className="grid grid-cols-2 gap-4 slide-in-right">
                <div className="space-y-2">
                  <Label htmlFor="google-age" className="text-sm font-semibold">
                    Age (optional)
                  </Label>
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
                  <Label
                    htmlFor="google-gender"
                    className="text-sm font-semibold"
                  >
                    Gender (optional)
                  </Label>
                  <Select
                    value={selectedGender}
                    onValueChange={setSelectedGender}
                  >
                    <SelectTrigger
                      data-testid="select-google-gender"
                      className="smooth-transition hover:border-primary"
                    >
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
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:from-sky-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-sky-400/25 transition-all duration-300 transform hover:scale-105"
              disabled={isGoogleLoading}
              data-testid="button-confirm-role-register"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
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
