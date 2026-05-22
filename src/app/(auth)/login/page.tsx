"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Link } from "lucide-react";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) console.error("Sign up error:", error.message);
    else router.push("/");
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) console.error("Sign in error:", error.message);
    else router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={handleSignIn}
        className="bg-blue-600 text-white p-2 rounded"
      >
        Sign In
      </button>
      <div className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="text-blue-600 hover:underline font-medium"
        >
          Sign up here
        </Link>
      </div>
    </div>
  );
}
