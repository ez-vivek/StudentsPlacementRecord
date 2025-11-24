import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Shield } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import OTPInput from "@/components/OTPInput";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Login() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const sendOTPMutation = useMutation({
    mutationFn: () => api.sendOTP(email, name, role),
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: () => api.verifyOTP(email, otp, name, role),
    onSuccess: (data) => {
      if (data.user) {
        toast({
          title: "Success",
          description: "Login successful!",
        });
        setLocation(data.user.role === "admin" ? "/admin" : "/student");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setOtp("");
    },
  });

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    sendOTPMutation.mutate();
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      verifyOTPMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-md bg-primary/10">
              {role === "student" ? (
                <GraduationCap className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              {step === "email" 
                ? "Enter your details to continue" 
                : "Enter the OTP sent to your email"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "admin")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" data-testid="tab-student">
                <GraduationCap className="w-4 h-4 mr-2" />
                Student
              </TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-send-otp"
                disabled={sendOTPMutation.isPending}
              >
                {sendOTPMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-4">
                <OTPInput value={otp} onChange={setOtp} />
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm"
                    onClick={() => sendOTPMutation.mutate()}
                    disabled={sendOTPMutation.isPending}
                    data-testid="button-resend-otp"
                  >
                    {sendOTPMutation.isPending ? "Sending..." : "Resend OTP"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  data-testid="button-verify-otp"
                  disabled={verifyOTPMutation.isPending || otp.length !== 6}
                >
                  {verifyOTPMutation.isPending ? "Verifying..." : "Verify & Continue"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("email")}
                  data-testid="button-back"
                >
                  Back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
