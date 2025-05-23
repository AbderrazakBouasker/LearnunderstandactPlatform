import Navbar from "@/components/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - LUA Platform",
  description: "Privacy Policy for LUA Platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Privacy Policy
        </h1>
        <div className="prose prose-lg max-w-4xl mx-auto">
          <p>Last updated: May 23, 2025</p>

          <p>
            LUA Platform ("us", "we", or "our") operates the LUA Platform
            website (the "Service"). This page informs you of our policies
            regarding the collection, use, and disclosure of personal data when
            you use our Service and the choices you have associated with that
            data.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">
            Information Collection and Use
          </h2>
          <p>
            We collect several different types of information for various
            purposes to provide and improve our Service to you.
          </p>

          <h3 className="mt-4 text-xl font-semibold">
            Types of Data Collected
          </h3>
          <h4>Personal Data</h4>
          <p>
            While using our Service, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you ("Personal Data"). Personally identifiable information
            may include, but is not limited to:
          </p>
          <ul>
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Cookies and Usage Data</li>
          </ul>

          <h4>Usage Data</h4>
          <p>
            We may also collect information on how the Service is accessed and
            used ("Usage Data"). This Usage Data may include information such as
            your computer's Internet Protocol address (e.g. IP address), browser
            type, browser version, the pages of our Service that you visit, the
            time and date of your visit, the time spent on those pages, unique
            device identifiers and other diagnostic data.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Use of Data</h2>
          <p>LUA Platform uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain the Service</li>
            <li>To notify you about changes to our Service</li>
            <li>
              To allow you to participate in interactive features of our Service
              when you choose to do so
            </li>
            <li>To provide customer care and support</li>
            <li>
              To provide analysis or valuable information so that we can improve
              the Service
            </li>
            <li>To monitor the usage of the Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h2 className="mt-6 text-2xl font-semibold">Security of Data</h2>
          <p>
            The security of your data is important to us, but remember that no
            method of transmission over the Internet, or method of electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your Personal Data, we cannot guarantee
            its absolute security.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            We will let you know via email and/or a prominent notice on our
            Service, prior to the change becoming effective and update the "last
            updated" date at the top of this Privacy Policy.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </p>

          <h2 className="mt-6 text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us:
          </p>
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
