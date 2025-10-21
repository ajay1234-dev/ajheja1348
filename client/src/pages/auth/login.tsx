import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, UserIcon, Stethoscope, Activity, Pill, FileText } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
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

      <Card className="w-full max-w-md card-3d backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 shadow-2xl relative z-10 slide-in-bottom">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center pulse-ring rotate-3d shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text">MediCare</span>
          </div>
          <CardTitle className="text-3xl font-bold text-shadow-light dark:text-shadow-dark">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Sign in to your account to continue managing your health
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
                className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
                className="smooth-transition hover:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Login as</Label>
              <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-4">
                <Label
                  htmlFor="login-role-patient"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-4 hover:border-primary hover:shadow-lg smooth-transition cursor-pointer ${
                    role === "patient" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="patient" id="login-role-patient" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${role === "patient" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <UserIcon className={`h-6 w-6 ${role === "patient" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-sm font-semibold">Patient</span>
                </Label>
                <Label
                  htmlFor="login-role-doctor"
                  className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-4 hover:border-primary hover:shadow-lg smooth-transition cursor-pointer ${
                    role === "doctor" ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  <RadioGroupItem value="doctor" id="login-role-doctor" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${role === "doctor" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <Stethoscope className={`h-6 w-6 ${role === "doctor" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                  </div>
                  <span className="text-sm font-semibold">Doctor</span>
                </Label>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold hover-lift bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
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
                data-testid="button-google-signin"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <SiGoogle className="mr-2 h-5 w-5 text-red-500" />
                    Sign in with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-semibold hover:text-primary/80 smooth-transition" data-testid="link-register">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select Your Role</DialogTitle>
            <DialogDescription className="text-base">
              Please select whether you are a patient or a doctor to continue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup
              value={selectedRole}
              onValueChange={setSelectedRole}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="role-patient"
                className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground cursor-pointer smooth-transition ${
                  selectedRole === "patient" ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                <RadioGroupItem value="patient" id="role-patient" className="sr-only" />
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${selectedRole === "patient" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                  <UserIcon className={`h-7 w-7 ${selectedRole === "patient" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                </div>
                <span className="text-base font-semibold">Patient</span>
              </Label>
              <Label
                htmlFor="role-doctor"
                className={`flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground cursor-pointer smooth-transition ${
                  selectedRole === "doctor" ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                <RadioGroupItem value="doctor" id="role-doctor" className="sr-only" />
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${selectedRole === "doctor" ? "bg-primary/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                  <Stethoscope className={`h-7 w-7 ${selectedRole === "doctor" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`} />
                </div>
                <span className="text-base font-semibold">Doctor</span>
              </Label>
            </RadioGroup>
            <Button
              onClick={handleRoleSelection}
              className="w-full h-12 text-base font-semibold hover-lift bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isGoogleLoading}
              data-testid="button-confirm-role"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
