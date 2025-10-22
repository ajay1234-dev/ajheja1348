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
import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const { login, loginWithFirebase } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password, role);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email, password, or role. Please try again.",
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

    setIsGoogleLoading(true);
    setShowRoleDialog(false);

    try {
      await loginWithFirebase(pendingIdToken, selectedRole);

      toast({
        title: "Welcome!",
        description: "You have successfully signed in with Google.",
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      toast({
        title: "Sign-in failed",
        description: "Failed to complete sign-in. Please try again.",
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
          alt="Healthcare Login"
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

      <Card className="w-full max-w-md glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 shadow-2xl relative z-10 page-transition border-2 border-white/20 dark:border-white/10">
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
            Welcome back
          </CardTitle>
          <CardDescription className="text-lg text-white/80 drop-shadow-md">
            Sign in to your account to continue managing your health
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-white/90 drop-shadow-md"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white/90 drop-shadow-md">
                Login as
              </Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="login-role-patient"
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-5 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    role === "patient"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="patient"
                    id="login-role-patient"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      role === "patient" ? "bg-sky-400/20" : "bg-white/10"
                    }`}
                  >
                    <UserIcon
                      className={`h-7 w-7 ${
                        role === "patient" ? "text-sky-400" : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow-md">
                    Patient
                  </span>
                </Label>
                <Label
                  htmlFor="login-role-doctor"
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-5 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                    role === "doctor"
                      ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  <RadioGroupItem
                    value="doctor"
                    id="login-role-doctor"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      role === "doctor" ? "bg-sky-400/20" : "bg-white/10"
                    }`}
                  >
                    <Stethoscope
                      className={`h-7 w-7 ${
                        role === "doctor" ? "text-sky-400" : "text-white/60"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow-md">
                    Doctor
                  </span>
                </Label>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:from-sky-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-sky-400/25 transition-all duration-300 transform hover:scale-105"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
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
                data-testid="button-google-signin"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <SiGoogle className="mr-3 h-6 w-6 text-red-400" />
                    Sign in with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-white/80">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-sky-400 hover:text-sky-300 font-semibold hover:underline smooth-transition drop-shadow-md"
                data-testid="link-register"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold text-white drop-shadow-lg">
              Select Your Role
            </DialogTitle>
            <DialogDescription className="text-lg text-white/80 drop-shadow-md">
              Please select whether you are a patient or a doctor to continue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <RadioGroup
              value={selectedRole}
              onValueChange={setSelectedRole}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="role-patient"
                className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-6 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                  selectedRole === "patient"
                    ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                    : "border-white/30"
                }`}
              >
                <RadioGroupItem
                  value="patient"
                  id="role-patient"
                  className="sr-only"
                />
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === "patient" ? "bg-sky-400/20" : "bg-white/10"
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
                htmlFor="role-doctor"
                className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white/10 backdrop-blur-sm p-6 hover:bg-white/20 hover:border-sky-400/50 smooth-transition cursor-pointer modern-card ${
                  selectedRole === "doctor"
                    ? "border-sky-400 shadow-lg scale-105 bg-white/20"
                    : "border-white/30"
                }`}
              >
                <RadioGroupItem
                  value="doctor"
                  id="role-doctor"
                  className="sr-only"
                />
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === "doctor" ? "bg-sky-400/20" : "bg-white/10"
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
            <Button
              onClick={handleRoleSelection}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:from-sky-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-sky-400/25 transition-all duration-300 transform hover:scale-105"
              disabled={isGoogleLoading}
              data-testid="button-confirm-role"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Signing in...
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
