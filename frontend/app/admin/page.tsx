"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Feedback } from "@/components/feedback";
import { Form } from "@/components/form";
import { Dashboard } from "@/components/dashboard";
import { Insight } from "@/components/insight";
import { Recommendation } from "@/components/recommendation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function Page() {
  interface UserData {
    _id: string;
    username: string;
    email: string;
    organization: string[];
    createdAt: string;
    organizationDetails: [];
    id: string;
  }

  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>();
  const [userData, setUserData] = useState<UserData>(null);
  const [isAlert, setIsAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null | undefined
  >("default");
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = (button: string) => {
    setActiveButton(button);
  };

  const handleOrganizationChange = (organization: string) => {
    setSelectedOrganization(organization);
    if (!activeButton) {
      setActiveButton("Dashboard");
    }
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/user/me`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        const userdata = await response.json();
        setUserData(userdata);
      } else if (response.status === 404) {
        setAlertTitle("Not Found");
        setAlertDescription("User not found");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 401) {
        setAlertTitle("Unauthorized");
        setAlertDescription("Invalid or expired token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 403) {
        setAlertTitle("Forbidden");
        setAlertDescription("Not authorized or missing token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 429) {
        setAlertTitle("Too Many Requests");
        setAlertDescription("Please wait a few minutes before trying again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 500) {
        setAlertTitle("Server Error");
        setAlertDescription("An error occurred. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
    } catch {
      setAlertTitle("Error");
      setAlertDescription("Failed to load data. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      if (activeButton) {
        setActiveButton((prevActive) => {
          setActiveButton(null);
          return prevActive;
        });

        setTimeout(() => {
          setActiveButton(activeButton);
        }, 50);
      }
    }
  }, [selectedOrganization]);

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          onButtonClick={handleButtonClick}
          onOrganizationChange={handleOrganizationChange}
          userData={userData}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink>{activeButton || "Home"}</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3"></div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="animate-spin rounded-full border-t-2 border-l-2 border-primary h-8 w-8"></div>
                </div>
              ) : (
                <>
                  {activeButton === "Dashboard" ? (
                    <Dashboard
                      selectedOrganization={selectedOrganization}
                      key={`dashboard-${selectedOrganization}`}
                      userData={userData}
                    />
                  ) : activeButton === "Feedbacks" ? (
                    <Feedback
                      selectedOrganization={selectedOrganization}
                      key={`feedback-${selectedOrganization}`}
                      userData={userData}
                    />
                  ) : activeButton === "Forms" ? (
                    <Form
                      selectedOrganization={selectedOrganization}
                      key={`form-${selectedOrganization}`}
                      userData={userData}
                    />
                  ) : activeButton === "Insights" ? (
                    <Insight
                      selectedOrganization={selectedOrganization}
                      key={`insight-${selectedOrganization}`}
                      userData={userData}
                    />
                  ) : activeButton === "Recommendation" ? (
                    <Recommendation
                      selectedOrganization={selectedOrganization}
                      key={`recommendation-${selectedOrganization}`}
                      userData={userData}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
