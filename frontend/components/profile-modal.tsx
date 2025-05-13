import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
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
  organizationDetails?: any[];
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-11/12 w-auto overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            defaultValue="account"
            className="w-[400px]"
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
                      <button
                        type="button"
                        onClick={toggleNewPasswordVisibility}
                      >
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
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>
              Please enter your current password to confirm changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                <button type="button" onClick={toggleCurrentPasswordVisibility}>
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
