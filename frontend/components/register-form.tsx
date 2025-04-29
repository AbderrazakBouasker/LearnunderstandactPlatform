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
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Terminal,
  UserIcon,
  BuildingIcon,
} from "lucide-react";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [invalidCredential, setInvalidCredential] = useState<string | null>(
    null
  );
  const [userFound, setUserFound] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState<boolean>(false);
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOrganizationFields, setShowOrganizationFields] =
    useState<boolean>(false);
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [organizationData, setOrganizationData] = useState({
    organization: "",
    organizationName: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formDataObj = new FormData(event.currentTarget);
    const email = formDataObj.get("email") as string;
    const password = formDataObj.get("password") as string;
    const confirmPassword = formDataObj.get("confirmPassword") as string;
    const username = formDataObj.get("username") as string;

    // Step 1: Validate initial fields
    if (registrationStep === 1) {
      // Check if passwords match
      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        return;
      } else {
        setPasswordMismatch(false);
      }

      // Make an initial validation request to check username and email
      try {
        const validationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/validate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email }),
          }
        );

        if (!validationResponse.ok) {
          if (validationResponse.status === 409) {
            const responseData = await validationResponse.json();
            if (responseData.error === "Username already exists") {
              setUserFound("Username already exists");
            } else if (responseData.error === "Email already exists") {
              setUserFound("Email already exists");
            }
            return;
          } else if (validationResponse.status === 400) {
            setInvalidCredential("Invalid credentials");
            return;
          }
        }

        // If validation passes, save form data and show organization fields
        setFormData({ username, email, password });
        setShowOrganizationFields(true);
        setRegistrationStep(2);
        // Clear any previous errors
        setUserFound(null);
        setInvalidCredential(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setAlertDescription(
          "An error occurred during validation. Please try again."
        );
        setAlertTitle("Error");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
      return;
    }

    // Step 2: Submit complete registration with organization details
    if (registrationStep === 2) {
      const organization = formDataObj.get("organization") as string;
      const organizationName = formDataObj.get("organizationName") as string;

      // Update the organization data in state
      setOrganizationData({ organization, organizationName });

      if (!organization || !organizationName) {
        setInvalidCredential("Organization details are required");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            organization,
            organizationName,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setAlertDescription("Registration successful");
        setAlertTitle("Success");
        setAlertVariant("default");
        setInvalidCredential(null);
        setUserFound(null);
        setIsAlert(true);
        router.push("/admin");
      } else if (response.status === 400) {
        setInvalidCredential("Invalid credentials");
        setUserFound(null);
        setIsAlert(false);
      } else if (response.status === 409) {
        const responseData = await response.json();
        if (responseData.error === "Organization already exists") {
          setUserFound("Organization identifier already exists");
        } else {
          setUserFound(
            "Registration failed: " + (responseData.error || "Unknown error")
          );
        }
        setInvalidCredential(null);
        setIsAlert(false);
      } else if (response.status === 429) {
        setInvalidCredential(null);
        setUserFound(null);
        setAlertDescription("Please wait a few minutes before trying again.");
        setAlertTitle("Too many requests");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else {
        setInvalidCredential(null);
        setUserFound(null);
        setAlertDescription("An error occurred. Please try again.");
        setAlertTitle("Error");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
    }
  }

  const handleBack = () => {
    setShowOrganizationFields(false);
    setRegistrationStep(1);
    // We don't reset organizationData here, so it will be preserved
  };

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrganizationData({
      ...organizationData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Register a new account</CardTitle>
            <CardDescription>
              {registrationStep === 1
                ? "Create a new account by filling out the form below"
                : "Complete registration by providing organization details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {!showOrganizationFields && (
                  <>
                    <div className="grid gap-3">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="username"
                          name="username"
                          placeholder="johndoe"
                          className="border-0 focus-visible:ring-0 shadow-none"
                          required
                          defaultValue={formData.username}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        required
                        defaultValue={formData.email}
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                        <LockIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          className="border-0 focus-visible:ring-0 shadow-none"
                          required
                          defaultValue={formData.password}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                        <LockIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          className="border-0 focus-visible:ring-0 shadow-none"
                          required
                          defaultValue={formData.password}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    {passwordMismatch && (
                      <div className="text-red-600 text-sm">
                        Passwords do not match
                      </div>
                    )}
                  </>
                )}

                {showOrganizationFields && (
                  <>
                    <div className="grid gap-3">
                      <Label htmlFor="organization">
                        Organization Identifier
                      </Label>
                      <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                        <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="organization"
                          name="organization"
                          placeholder="organization-identifier"
                          className="border-0 focus-visible:ring-0 shadow-none"
                          required
                          value={organizationData.organization}
                          onChange={handleOrganizationChange}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        This will be used in URLs for your organization
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="organizationName">
                        Organization Name
                      </Label>
                      <Input
                        id="organizationName"
                        name="organizationName"
                        placeholder="Your Organization's Full Name"
                        required
                        value={organizationData.organizationName}
                        onChange={handleOrganizationChange}
                      />
                    </div>
                  </>
                )}

                {userFound && (
                  <div className="text-red-600 text-sm">{userFound}</div>
                )}

                {invalidCredential && (
                  <div className="text-red-600 text-sm">
                    {invalidCredential}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {showOrganizationFields && (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        className="w-1/3"
                        variant="outline"
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button type="submit" className="w-2/3">
                        Complete Registration
                      </Button>
                    </div>
                  )}

                  {!showOrganizationFields && (
                    <Button type="submit" className="w-full">
                      Continue
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <a href="/admin/login" className="underline underline-offset-4">
                  Sign in
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
