import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal, Loader2, EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

type UserData = {
  _id?: string;
  username?: string;
  email?: string;
  organization?: string[];
  createdAt?: string;
  organizationDetails?: [];
  id?: string;
} | null;

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData;
  onProfileUpdate?: (updatedData: {
    username?: string;
    email?: string;
  }) => void;
}

export function ProfileModal({
  open,
  onOpenChange,
  userData,
  onProfileUpdate,
}: ProfileModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Error states
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  // Alert state
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
    }
  }, [userData]);

  // Reset form errors when input changes
  useEffect(() => {
    setUsernameError("");
  }, [username]);

  useEffect(() => {
    setEmailError("");
  }, [email]);

  useEffect(() => {
    setPasswordError("");
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    setCurrentPasswordError("");
  }, [currentPassword]);

  const validateForm = () => {
    let isValid = true;

    // Validate username
    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      isValid = false;
    }

    // Validate password if on password tab
    if (activeTab === "password") {
      if (newPassword && newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        isValid = false;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordConfirm = async () => {
    if (!currentPassword) {
      setCurrentPasswordError("Current password is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare update data
      const updateData = {
        currentPassword,
        ...(activeTab === "account" ? { username, email } : {}),
        ...(activeTab === "password" && newPassword
          ? { password: newPassword }
          : {}),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/user/${userData?._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Success case
        setAlertTitle("Success");
        setAlertDescription("Profile updated successfully");
        setAlertVariant("default");
        setIsAlert(true);
        setIsPasswordModalOpen(false);

        // Call the onProfileUpdate callback with updated data
        if (onProfileUpdate && activeTab === "account") {
          onProfileUpdate({ username, email });
        }

        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setIsAlert(false);
          if (activeTab === "password") {
            // If password was changed, close the modal and redirect to login
            onOpenChange(false);
            window.location.href = "/admin/login";
          }
        }, 3000);
      } else {
        // Error handling
        setAlertTitle("Error");
        setAlertDescription(data.error || "Failed to update profile");
        setAlertVariant("destructive");
        setIsAlert(true);

        // Handle specific errors
        if (data.error.includes("Username already exists")) {
          setUsernameError("Username already exists");
        } else if (data.error.includes("Email already exists")) {
          setEmailError("Email already exists");
        } else if (data.error.includes("Current password is incorrect")) {
          setCurrentPasswordError("Current password is incorrect");
        }

        setTimeout(() => {
          setIsAlert(false);
        }, 5000);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertDescription("An unexpected error occurred");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password visibility toggle functions
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  return (
    <>
      {/* Main Modal Content */}
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full mx-auto p-6 relative flex flex-col items-center justify-center">
        <div className="flex items-center justify-between mb-4 w-full">
          <h2 className="text-lg font-semibold mx-auto text-center flex-1">
            Edit profile
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
            style={{ width: "2.5rem", height: "2.5rem" }}
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-muted-foreground mb-4 text-center w-full">
          Make changes to your profile here. Click save when you're done.
        </p>
        <Tabs
          defaultValue="account"
          className="w-[400px] mx-auto"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {usernameError && (
                    <p className="text-sm text-red-500">{usernameError}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500">{emailError}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveClick}>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="new">New password</Label>
                  <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                    <LockIcon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="new"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-0 focus-visible:ring-0 shadow-none"
                    />
                    <button type="button" onClick={toggleNewPasswordVisibility}>
                      {showNewPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                    <LockIcon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-0 focus-visible:ring-0 shadow-none"
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
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveClick}>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Confirmation Modal (custom, not Dialog) */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-lg max-w-md w-full mx-auto p-6 relative flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 w-full">
              <h2 className="text-lg font-semibold mx-auto text-center flex-1">
                Confirm your password
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
                style={{ width: "2.5rem", height: "2.5rem" }}
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-4 text-center w-full">
              Please enter your current password to confirm changes.
            </p>
            <div className="space-y-4 py-2 w-full">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring px-2">
                  <LockIcon className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-0 focus-visible:ring-0 shadow-none"
                  />
                  <button
                    type="button"
                    onClick={toggleCurrentPasswordVisibility}
                  >
                    {showCurrentPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {currentPasswordError && (
                  <p className="text-sm text-red-500">{currentPasswordError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 w-full">
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0 z-70">
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
