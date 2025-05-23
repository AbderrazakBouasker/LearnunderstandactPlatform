import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center space-x-4 p-4 bg-white shadow-sm">
      <Link href="/" passHref legacyBehavior>
        <a className="text-2xl font-bold text-slate-900 transition-colors duration-500 ease-in-out transform hover:scale-105 animate-color-change-hover">
          LUA Platform
        </a>
      </Link>
      <div className="flex space-x-4">
        <Link href="/admin/login" passHref legacyBehavior>
          <Button asChild variant="outline">
            <a>Login</a>
          </Button>
        </Link>
        <Link href="/admin/register" passHref legacyBehavior>
          <Button asChild>
            <a>Register</a>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
