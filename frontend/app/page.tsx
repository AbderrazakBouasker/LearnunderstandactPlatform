import Image from "next/image";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20 px-4 sm:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Understand Your Users, Act on Insights
            </h1>
            <p className="text-lg sm:text-xl mb-8">
              LUA Platform helps you collect valuable feedback, understand user
              needs, and make data-driven decisions to improve your products and
              services.
            </p>
            <Link href="/admin/register" passHref legacyBehavior>
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                <a>Get Started for Free</a>
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
              Why Choose LUA Platform?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 shadow-lg rounded-lg">
                <Image
                  src="/file.svg"
                  alt="Create Forms"
                  width={48}
                  height={48}
                  className="mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Create & Share Forms
                </h3>
                <p className="text-gray-600">
                  Easily build custom feedback forms and share them via direct
                  links or embed them on your website.
                </p>
              </div>
              <div className="p-6 shadow-lg rounded-lg">
                <Image
                  src="/window.svg"
                  alt="Collect Feedback"
                  width={48}
                  height={48}
                  className="mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Collect & Analyze
                </h3>
                <p className="text-gray-600">
                  Gather responses in real-time and use our tools to monitor and
                  analyze the feedback effectively.
                </p>
              </div>
              <div className="p-6 shadow-lg rounded-lg">
                <Image
                  src="/globe.svg"
                  alt="Team Collaboration"
                  width={48}
                  height={48}
                  className="mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Collaborate & Grow
                </h3>
                <p className="text-gray-600">
                  Invite team members to your organization, manage feedback
                  together, and choose a plan that scales with you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-gray-100 py-20 px-4 sm:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6">
              Ready to Elevate Your Feedback Game?
            </h2>
            <p className="text-lg sm:text-xl mb-8 text-gray-700">
              Join thousands of businesses improving their customer experience
              with LUA Platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/register" passHref legacyBehavior>
                <Button size="lg">
                  <a>Sign Up Now</a>
                </Button>
              </Link>
              <Link href="/pricing" passHref legacyBehavior>
                {/* Assuming you have a pricing page */}
                <Button size="lg" variant="outline">
                  <a>View Plans</a>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center p-8 text-gray-600 border-t">
        <p>
          &copy; {new Date().getFullYear()} LUA Platform. All rights reserved.
        </p>
        <div className="mt-2">
          <Link href="/privacy" legacyBehavior>
            <a className="hover:underline mx-2">Privacy Policy</a>
          </Link>
          |
          <Link href="/terms" legacyBehavior>
            <a className="hover:underline mx-2">Terms of Service</a>
          </Link>
        </div>
      </footer>
    </div>
  );
}
