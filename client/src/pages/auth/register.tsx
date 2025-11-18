import { useState, useEffect, useCallback } from "react";
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
import { Heart, Loader2, UserIcon, Stethoscope } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { MotionWrapper, PageTransition } from "@/components/ui/motion-wrapper";
import { StarBorder, DotGrid, GradientText } from "@/components/ui";

import "./register.css";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Hematology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology",
  "Other",
];

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
        description: "You have successfully signed up.",
      });
    } catch (error) {
      console.error("Firebase registration error:", error);
      toast({
        title: "Registration failed",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
      setPendingIdToken(null);
    }
  };

  return (
    <PageTransition>
      <div
        className="relative w-full min-h-screen overflow-auto register-container page-transition"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* DotGrid background */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor="#5227FF"
            activeColor="#5227FF"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <MotionWrapper type="scale" delay={0.1} duration={0.5}>
              <Card className="w-full max-w-2xl bg-blue-50 dark:bg-slate-800 shadow-xl border border-blue-100 dark:border-slate-700 register-card modern-card">
                <CardHeader className="space-y-1 text-center p-8">
                  <MotionWrapper type="fade" delay={0.2} duration={0.5}>
                    <div className="flex items-center justify-center space-x-3 mb-6">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center soft-glow">
                        <Heart className="h-9 w-9 text-primary-foreground" />
                      </div>
                      <GradientText
                        colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                        animationSpeed={3}
                        showBorder={false}
                        className="text-4xl font-bold"
                      >
                        MediCare
                      </GradientText>
                    </div>
                  </MotionWrapper>
                  <MotionWrapper type="slide" delay={0.3} duration={0.5}>
                    <CardTitle className="text-3xl font-bold text-foreground">
                      Create Account
                    </CardTitle>
                  </MotionWrapper>
                  <MotionWrapper type="slide" delay={0.4} duration={0.5}>
                    <CardDescription className="text-lg text-muted-foreground">
                      Join MediCare to start managing your health journey
                    </CardDescription>
                  </MotionWrapper>
                </CardHeader>

                <CardContent className="p-8 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <MotionWrapper type="fade" delay={0.5}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-semibold"
                          >
                            First Name
                          </Label>
                          <StarBorder
                            as="div"
                            className="w-full"
                            color="cyan"
                            speed="5s"
                          >
                            <Input
                              id="firstName"
                              name="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              data-testid="input-first-name"
                              className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </StarBorder>
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-semibold"
                          >
                            Last Name
                          </Label>
                          <StarBorder
                            as="div"
                            className="w-full"
                            color="cyan"
                            speed="5s"
                          >
                            <Input
                              id="lastName"
                              name="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                              data-testid="input-last-name"
                              className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </StarBorder>
                        </div>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="fade" delay={0.6}>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">I am a</Label>
                        <RadioGroup
                          value={formData.role}
                          onValueChange={(value) =>
                            setFormData({ ...formData, role: value })
                          }
                          className="grid grid-cols-2 gap-4"
                        >
                          <Label
                            htmlFor="role-patient"
                            className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                              formData.role === "patient"
                                ? "border-primary shadow-lg bg-primary/10"
                                : "border-gray-200 dark:border-slate-600"
                            } role-selector`}
                          >
                            <RadioGroupItem
                              value="patient"
                              id="role-patient"
                              className="sr-only"
                            />
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                                formData.role === "patient"
                                  ? "bg-primary/20"
                                  : "bg-muted"
                              }`}
                            >
                              <UserIcon
                                className={`h-7 w-7 ${
                                  formData.role === "patient"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              Patient
                            </span>
                          </Label>
                          <Label
                            htmlFor="role-doctor"
                            className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                              formData.role === "doctor"
                                ? "border-primary shadow-lg bg-primary/10"
                                : "border-gray-200 dark:border-slate-600"
                            } role-selector`}
                          >
                            <RadioGroupItem
                              value="doctor"
                              id="role-doctor"
                              className="sr-only"
                            />
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                                formData.role === "doctor"
                                  ? "bg-primary/20"
                                  : "bg-muted"
                              }`}
                            >
                              <Stethoscope
                                className={`h-7 w-7 ${
                                  formData.role === "doctor"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              Doctor
                            </span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </MotionWrapper>

                    {formData.role === "doctor" && (
                      <MotionWrapper type="fade" delay={0.7}>
                        <div className="space-y-3">
                          <Label
                            htmlFor="specialization"
                            className="text-sm font-semibold"
                          >
                            Medical Specialization
                          </Label>
                          <Select
                            value={formData.specialization}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                specialization: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id="specialization"
                              data-testid="select-specialization"
                              className="h-12"
                            >
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                            <SelectContent className="glass-card backdrop-blur-xl bg-white/10 border-white/20">
                              {SPECIALIZATIONS.map((spec) => (
                                <SelectItem key={spec} value={spec}>
                                  {spec}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </MotionWrapper>
                    )}

                    {formData.role === "patient" && (
                      <MotionWrapper type="fade" delay={0.7}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label
                              htmlFor="age"
                              className="text-sm font-semibold"
                            >
                              Age
                            </Label>
                            <StarBorder
                              as="div"
                              className="w-full"
                              color="cyan"
                              speed="5s"
                            >
                              <Input
                                id="age"
                                name="age"
                                type="number"
                                placeholder="25"
                                value={formData.age}
                                onChange={handleInputChange}
                                min="1"
                                max="120"
                                data-testid="input-age"
                                className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </StarBorder>
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="gender"
                              className="text-sm font-semibold"
                            >
                              Gender
                            </Label>
                            <Select
                              value={formData.gender}
                              onValueChange={(value) =>
                                setFormData({ ...formData, gender: value })
                              }
                            >
                              <SelectTrigger
                                data-testid="select-gender"
                                className="h-12"
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
                      </MotionWrapper>
                    )}

                    <MotionWrapper type="fade" delay={0.8}>
                      <div className="space-y-3">
                        <Label
                          htmlFor="email"
                          className="text-sm font-semibold"
                        >
                          Email
                        </Label>
                        <StarBorder
                          as="div"
                          className="w-full"
                          color="cyan"
                          speed="5s"
                        >
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            data-testid="input-email"
                            className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </StarBorder>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="fade" delay={0.9}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="password"
                            className="text-sm font-semibold"
                          >
                            Password
                          </Label>
                          <StarBorder
                            as="div"
                            className="w-full"
                            color="cyan"
                            speed="5s"
                          >
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              data-testid="input-password"
                              className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </StarBorder>
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-sm font-semibold"
                          >
                            Confirm Password
                          </Label>
                          <StarBorder
                            as="div"
                            className="w-full"
                            color="cyan"
                            speed="5s"
                          >
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              required
                              data-testid="input-confirm-password"
                              className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </StarBorder>
                        </div>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="scale" delay={1.0}>
                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-semibold register-button"
                        disabled={isLoading}
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
                    </MotionWrapper>
                  </form>

                  {auth && googleProvider && (
                    <>
                      <MotionWrapper type="fade" delay={1.1}>
                        <div className="relative my-8">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-card px-4 text-muted-foreground font-semibold">
                              Or continue with
                            </span>
                          </div>
                        </div>
                      </MotionWrapper>

                      <MotionWrapper type="scale" delay={1.2}>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-14 text-lg font-semibold google-button"
                          onClick={handleGoogleSignIn}
                          disabled={isGoogleLoading}
                          data-testid="button-google-signup"
                        >
                          {isGoogleLoading ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                              Signing up with Google...
                            </>
                          ) : (
                            <>
                              <SiGoogle className="mr-3 h-6 w-6 text-red-500" />
                              Sign up with Google
                            </>
                          )}
                        </Button>
                      </MotionWrapper>
                    </>
                  )}

                  <MotionWrapper type="fade" delay={1.3}>
                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                          href="/login"
                          className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                          data-testid="link-login"
                        >
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </MotionWrapper>
                </CardContent>
              </Card>
            </MotionWrapper>

            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
              <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <DialogHeader className="text-center">
                  <DialogTitle className="text-3xl font-bold">
                    Complete Your Profile
                  </DialogTitle>
                  <DialogDescription className="text-lg">
                    Please provide additional information to complete your
                    registration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 p-6">
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="dialog-role-patient"
                      className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                        selectedRole === "patient"
                          ? "border-primary shadow-lg bg-primary/10"
                          : "border-gray-200 dark:border-slate-600"
                      } role-selector`}
                    >
                      <RadioGroupItem
                        value="patient"
                        id="dialog-role-patient"
                        className="sr-only"
                      />
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          selectedRole === "patient"
                            ? "bg-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        <UserIcon
                          className={`h-8 w-8 ${
                            selectedRole === "patient"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span className="text-lg font-semibold">Patient</span>
                    </Label>
                    <Label
                      htmlFor="dialog-role-doctor"
                      className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                        selectedRole === "doctor"
                          ? "border-primary shadow-lg bg-primary/10"
                          : "border-gray-200 dark:border-slate-600"
                      } role-selector`}
                    >
                      <RadioGroupItem
                        value="doctor"
                        id="dialog-role-doctor"
                        className="sr-only"
                      />
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          selectedRole === "doctor"
                            ? "bg-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        <Stethoscope
                          className={`h-8 w-8 ${
                            selectedRole === "doctor"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span className="text-lg font-semibold">Doctor</span>
                    </Label>
                  </RadioGroup>

                  {selectedRole === "doctor" && (
                    <div className="space-y-3">
                      <Label
                        htmlFor="dialog-specialization"
                        className="text-sm font-semibold"
                      >
                        Medical Specialization
                      </Label>
                      <Select
                        value={selectedSpecialization}
                        onValueChange={setSelectedSpecialization}
                      >
                        <SelectTrigger
                          id="dialog-specialization"
                          data-testid="select-dialog-specialization"
                          className="h-12"
                        >
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedRole === "patient" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="dialog-age"
                          className="text-sm font-semibold"
                        >
                          Age
                        </Label>
                        <StarBorder
                          as="div"
                          className="w-full"
                          color="cyan"
                          speed="5s"
                        >
                          <Input
                            id="dialog-age"
                            type="number"
                            placeholder="25"
                            value={selectedAge}
                            onChange={(e) => setSelectedAge(e.target.value)}
                            min="1"
                            max="120"
                            data-testid="input-dialog-age"
                            className="h-12 optimized-input bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </StarBorder>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="dialog-gender"
                          className="text-sm font-semibold"
                        >
                          Gender
                        </Label>
                        <Select
                          value={selectedGender}
                          onValueChange={setSelectedGender}
                        >
                          <SelectTrigger
                            id="dialog-gender"
                            data-testid="select-dialog-gender"
                            className="h-12"
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
                    className="w-full h-14 text-lg font-semibold register-button"
                    disabled={isGoogleLoading}
                    data-testid="button-confirm-role"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
