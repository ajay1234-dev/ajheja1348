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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, UserIcon, Stethoscope } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import {
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { MotionWrapper, PageTransition } from "@/components/ui/motion-wrapper";
import StarBorder from "@/components/ui/star-border";
import DotGrid from "@/components/ui/dot-grid";
import GradientText from "@/components/ui/gradient-text";
import GlareHover from "@/components/ui/glare-hover";

import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithFirebase } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get ID token and proceed
        try {
          const idToken = await user.getIdToken();

          // For doctors, login directly without showing dialog
          if (role === "doctor") {
            // Directly call the login function with correct role
            await loginWithFirebase(idToken, "doctor");
          }
          // For patients, we still need to show some UI, but we'll simplify it
        } catch (error) {
          console.error("Error getting ID token:", error);
          toast({
            title: "Authentication error",
            description: "Failed to authenticate. Please try again.",
            variant: "destructive",
          });
        }
      }
    });

    // Handle redirect result
    const handleRedirectResult = async () => {
      if (!auth) return;

      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setIsGoogleLoading(true);

          const idToken = await result.user.getIdToken();

          // For Google sign-in, handle doctors directly
          if (role === "doctor") {
            // Directly call the login function
            await loginWithFirebase(idToken, "doctor");
          } else {
            // For patients, we'll need to handle this differently
            // This would typically show a simplified UI or auto-login
          }
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        // Try to sign in with email and password using Firebase
        if (auth) {
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              email,
              password
            );
            const idToken = await userCredential.user.getIdToken();

            // If the user is logging in as a doctor, we can try to auto-detect their role
            // For now, we'll use the selected role from the form
            // In a production app, you might check if the user already has a role in your database
            if (role === "doctor") {
              // For doctors, we need to ensure we're passing the correct role
              await loginWithFirebase(idToken, "doctor");
              // Show welcome message for doctors too
              toast({
                title: "Welcome back, Doctor!",
                description: "You have successfully logged in.",
              });
              return;
            } else {
              // Use Firebase login instead of traditional login
              await loginWithFirebase(idToken, role);
            }

            toast({
              title: "Welcome back!",
              description: "You have successfully logged in.",
            });
          } catch (firebaseError: unknown) {
            // If Firebase authentication fails, fall back to traditional login
            // This handles cases where user has a traditional account but Firebase is configured
            console.log(
              "Firebase auth failed, trying traditional login:",
              firebaseError
            );
            // Ensure doctors get the correct role
            if (role === "doctor") {
              await login(email, password, "doctor");
            } else {
              await login(email, password, role);
            }

            // Only show toast for non-doctors
            if (role !== "doctor") {
              toast({
                title: "Welcome back!",
                description: "You have successfully logged in.",
              });
            }
          }
        } else {
          // Fallback to traditional login if Firebase is not configured
          // Ensure doctors get the correct role
          if (role === "doctor") {
            await login(email, password, "doctor");
          } else {
            await login(email, password, role);
          }
          // Only show toast for non-doctors
          if (role !== "doctor") {
            toast({
              title: "Welcome back!",
              description: "You have successfully logged in.",
            });
          }
        }
      } catch (error: unknown) {
        console.error("Login error:", error);

        // Check if it's a Firebase error
        if (error && typeof error === "object" && "code" in error) {
          let errorMessage =
            "Invalid email, password, or role. Please try again.";

          switch ((error as { code: string }).code) {
            case "auth/user-not-found":
              errorMessage =
                "No user found with this email. Please check your email or register.";
              break;
            case "auth/wrong-password":
              errorMessage = "Incorrect password. Please try again.";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email format. Please check your email.";
              break;
            case "auth/user-disabled":
              errorMessage =
                "This account has been disabled. Please contact support.";
              break;
          }

          toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email, password, or role. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, role, login, loginWithFirebase, toast]
  );

  const handleGoogleSignIn = useCallback(async () => {
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
  }, [toast]);

  // Remove the auto-confirm effect as we don't show role dialog anymore
  useEffect(() => {
    // This effect is now removed as we don't show role dialog anymore
  }, []);

  return (
    <PageTransition>
      <div
        className="relative w-full min-h-screen overflow-auto login-container page-transition"
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

        <div
          className="relative z-10 flex items-center justify-center min-h-screen"
          style={{ scrollMarginTop: "20px" }}
        >
          <div className="w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
            <MotionWrapper type="scale" delay={0.1} duration={0.5}>
              <Card className="w-full max-w-md bg-blue-50 dark:bg-slate-800 shadow-xl border border-blue-100 dark:border-slate-700 login-card modern-card">
                <CardHeader className="space-y-1 text-center p-8">
                  <MotionWrapper type="fade" delay={0.2} duration={0.5}>
                    <div className="flex items-center justify-center space-x-3 mb-6">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center soft-glow">
                        <Heart className="h-9 w-9 text-primary-foreground" />
                      </div>
                      <GradientText
                        colors={[
                          "#40ffaa",
                          "#4079ff",
                          "#40ffaa",
                          "#4079ff",
                          "#40ffaa",
                        ]}
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
                      Welcome back
                    </CardTitle>
                  </MotionWrapper>
                  <MotionWrapper type="slide" delay={0.4} duration={0.5}>
                    <CardDescription className="text-lg text-muted-foreground">
                      Sign in to your account to continue managing your health
                    </CardDescription>
                  </MotionWrapper>
                </CardHeader>

                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <MotionWrapper type="fade" delay={0.5} duration={0.5}>
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
                          thickness={2}
                        >
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={useCallback(
                              (e: React.ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value),
                              []
                            )}
                            required
                            data-testid="input-email"
                            className="h-12 optimized-input smooth-transition bg-background border-input focus:border-primary focus:ring-primary"
                          />
                        </StarBorder>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="fade" delay={0.6} duration={0.5}>
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
                          thickness={2}
                        >
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={useCallback(
                              (e: React.ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value),
                              []
                            )}
                            required
                            data-testid="input-password"
                            className="h-12 optimized-input smooth-transition bg-background border-input focus:border-primary focus:ring-primary"
                          />
                        </StarBorder>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="fade" delay={0.7} duration={0.5}>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Login as
                        </Label>
                        <RadioGroup
                          value={role}
                          onValueChange={useCallback(
                            (value: string) => setRole(value),
                            []
                          )}
                          className="grid grid-cols-2 gap-4"
                        >
                          <Label
                            htmlFor="login-role-patient"
                            className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer smooth-transition ${
                              role === "patient"
                                ? "border-primary shadow-lg bg-primary/10"
                                : "border-gray-200 dark:border-slate-600"
                            } role-selector`}
                          >
                            <RadioGroupItem
                              value="patient"
                              id="login-role-patient"
                              className="sr-only"
                            />
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 smooth-transition ${
                                role === "patient"
                                  ? "bg-primary/20"
                                  : "bg-muted"
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
                            <span className="text-sm font-semibold">
                              Patient
                            </span>
                          </Label>
                          <Label
                            htmlFor="login-role-doctor"
                            className={`flex flex-col items-center justify-between rounded-lg border-2 bg-gray-50 dark:bg-slate-700 p-5 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer smooth-transition ${
                              role === "doctor"
                                ? "border-primary shadow-lg bg-primary/10"
                                : "border-gray-200 dark:border-slate-600"
                            } role-selector`}
                          >
                            <RadioGroupItem
                              value="doctor"
                              id="login-role-doctor"
                              className="sr-only"
                            />
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 smooth-transition ${
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
                            <span className="text-sm font-semibold">
                              Doctor
                            </span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </MotionWrapper>

                    <MotionWrapper type="scale" delay={0.8} duration={0.5}>
                      <GlareHover
                        width="100%"
                        height="100%"
                        background="transparent"
                        borderRadius="0.5rem"
                        borderColor="transparent"
                        glareColor="#ffffff"
                        glareOpacity={0.4}
                        glareAngle={-30}
                        glareSize={300}
                        transitionDuration={800}
                        playOnce={false}
                        className="rounded-lg"
                      >
                        <Button
                          type="submit"
                          className="w-full h-14 text-lg font-semibold login-button hover-lift"
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
                      </GlareHover>
                    </MotionWrapper>
                  </form>

                  {auth && googleProvider && (
                    <>
                      <MotionWrapper type="fade" delay={0.9} duration={0.5}>
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

                      <MotionWrapper type="scale" delay={1.0} duration={0.5}>
                        <GlareHover
                          width="100%"
                          height="100%"
                          background="transparent"
                          borderRadius="0.5rem"
                          borderColor="transparent"
                          glareColor="#ffffff"
                          glareOpacity={0.4}
                          glareAngle={-30}
                          glareSize={300}
                          transitionDuration={800}
                          playOnce={false}
                          className="rounded-lg"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-14 text-lg font-semibold google-button hover-lift"
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
                        </GlareHover>
                      </MotionWrapper>
                    </>
                  )}

                  <MotionWrapper type="fade" delay={1.1} duration={0.5}>
                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                          href="/register"
                          className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors smooth-transition"
                          data-testid="link-register"
                        >
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </MotionWrapper>
                </CardContent>
              </Card>
            </MotionWrapper>

            {/* Role selection dialog removed - direct login flow */}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
