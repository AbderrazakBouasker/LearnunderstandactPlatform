"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [invalidCredential, setInvalidCredential] = useState<string | null>(
    null
  );
  const [userNotFound, setUserNotFound] = useState<string | null>(null);
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const router = useRouter();
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      }
    );

    if (response.ok) {
      setAlertDescription("Login successful");
      setAlertTitle("Success");
      setAlertVariant("default");
      setInvalidCredential(null);
      setUserNotFound(null);
      setIsAlert(true);
      router.push("/admin");
    } else if (response.status === 400) {
      setInvalidCredential("Invalid credentials");
      setUserNotFound(null);
      setIsAlert(false);
    } else if (response.status === 404) {
      setUserNotFound("User not found");
      setInvalidCredential(null);
      setIsAlert(false);
    } else if (response.status === 429) {
      setInvalidCredential(null);
      setUserNotFound(null);
      setAlertDescription("Please wait a few minutes before trying again.");
      setAlertTitle("Too many requests");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    } else {
      setInvalidCredential(null);
      setUserNotFound(null);
      setAlertDescription("An error occurred. Please try again.");
      setAlertTitle("Error");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    }
  }

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>
                {userNotFound && (
                  <div className="text-red-600 text-sm">{userNotFound}</div>
                )}
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a> */}
                  </div>
                  <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                    <LockIcon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="border-0 focus-visible:ring-0 shadow-none"
                      required
                    />
                    <button type="button" onClick={togglePasswordVisibility}>
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                {invalidCredential && (
                  <div className="text-red-600 text-sm">
                    {invalidCredential}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                  {/* <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/admin/register"
                  className="underline underline-offset-4"
                >
                  Sign up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
