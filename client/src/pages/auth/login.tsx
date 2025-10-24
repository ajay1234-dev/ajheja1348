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
import { Heart, Loader2, UserIcon, Stethoscope } from "lucide-react";
import { SiGoogle } from "react-icons/si";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700">
        <CardHeader className="space-y-1 text-center p-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Heart className="h-9 w-9 text-primary-foreground" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              MediCare
            </span>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Welcome back
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Sign in to your account to continue managing your health
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold">
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
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold">
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
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Login as</Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="login-role-patient"
                  className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                    role === "patient"
                      ? "border-primary shadow-lg bg-primary/10"
                      : "border-gray-200 dark:border-slate-600"
                  }`}
                >
                  <RadioGroupItem
                    value="patient"
                    id="login-role-patient"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      role === "patient" ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <UserIcon
                      className={`h-7 w-7 ${
                        role === "patient"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold">Patient</span>
                </Label>
                <Label
                  htmlFor="login-role-doctor"
                  className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                    role === "doctor"
                      ? "border-primary shadow-lg bg-primary/10"
                      : "border-gray-200 dark:border-slate-600"
                  }`}
                >
                  <RadioGroupItem
                    value="doctor"
                    id="login-role-doctor"
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      role === "doctor" ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Stethoscope
                      className={`h-7 w-7 ${
                        role === "doctor"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold">Doctor</span>
                </Label>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
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
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-semibold">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-lg font-semibold"
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
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                data-testid="link-register"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold">
              Select Your Role
            </DialogTitle>
            <DialogDescription className="text-lg">
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
                className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                  selectedRole === "patient"
                    ? "border-primary shadow-lg bg-primary/10"
                    : "border-gray-200 dark:border-slate-600"
                }`}
              >
                <RadioGroupItem
                  value="patient"
                  id="role-patient"
                  className="sr-only"
                />
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === "patient" ? "bg-primary/20" : "bg-muted"
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
                htmlFor="role-doctor"
                className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer ${
                  selectedRole === "doctor"
                    ? "border-primary shadow-lg bg-primary/10"
                    : "border-gray-200 dark:border-slate-600"
                }`}
              >
                <RadioGroupItem
                  value="doctor"
                  id="role-doctor"
                  className="sr-only"
                />
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === "doctor" ? "bg-primary/20" : "bg-muted"
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
            <Button
              onClick={handleRoleSelection}
              className="w-full h-14 text-lg font-semibold"
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
