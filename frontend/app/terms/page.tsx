import Navbar from "@/components/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - LUA Platform",
  description: "Terms of Service for LUA Platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Terms of Service
        </h1>
        <div className="prose prose-lg max-w-4xl mx-auto">
          <p>Last updated: May 23, 2025</p>

          <p>
            Please read these Terms of Service ("Terms", "Terms of Service")
            carefully before using the LUA Platform website (the "Service")
            operated by LUA Platform ("us", "we", or "our").
          </p>

          <p>
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users, and others who access or use the Service.
          </p>

          <p>
            By accessing or using the Service you agree to be bound by these
            Terms. If you disagree with any part of the terms then you may not
            access the Service.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Accounts</h2>
          <p>
            When you create an account with us, you must provide us information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password, whether your password is with our Service or a third-party
            service.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality
            are and will remain the exclusive property of LUA Platform and its
            licensors. The Service is protected by copyright, trademark, and
            other laws of both the and foreign countries.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">
            Links To Other Web Sites
          </h2>
          <p>
            Our Service may contain links to third-party web sites or services
            that are not owned or controlled by LUA Platform. LUA Platform has
            no control over, and assumes no responsibility for, the content,
            privacy policies, or practices of any third party web sites or
            services.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Termination</h2>
          <p>
            We may terminate or suspend access to our Service immediately,
            without prior notice or liability, for any reason whatsoever,
            including without limitation if you breach the Terms.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of Your Country, without regard to its conflict of law
            provisions.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material we will try to
            provide at least 30 days notice prior to any new terms taking
            effect.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>By email: support@luaplatform.com</li>
          </ul>
        </div>
      </main>
      <footer className="text-center p-8 text-gray-600 border-t">
        <p>
          &copy; {new Date().getFullYear()} LUA Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
