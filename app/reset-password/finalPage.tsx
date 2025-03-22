"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { Loader } from "lucide-react";
import {toast} from "@/hooks/use-toast"; // Assuming you're using Lucide icons

export default function ResetPassword() {
  const router = useRouter();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Track loading state
  const searchParams = useSearchParams();

  function generateOTP() {
    // Generate a random number between 1000 and 9999 (inclusive)
    return Math.floor(100000 + Math.random() * 900000);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "New and confirm password do not match"
      });
      setError("New and confirm password do not match");
      return;
    }

    setLoading(true);
    const userId = searchParams.get("token");
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );
    const hashedConfirmPassword = await bcrypt.hash(
      confirmPassword,
      await bcrypt.genSalt(10)
    );
    // Optionally hash the password before sending it to the server (handled server-side anyway)
    try {
      // Send data to the server-side API route to create the user

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          password: hashedPassword,
          eventId: searchParams.get("eventId"),
          refCode: searchParams.get("refCode"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password.");
      }
      toast({
        title: "Success",
        description: "Your password has been reset"
      });

      // Preserve URL parameters when redirecting back to login
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== 'token') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      router.push(`/login${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      setError("Failed to reset password.");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password"
      });
    }
    finally{

    setLoading(false);

    }
  };

  return (
    <div className="mt-24  rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
      {error ? <p style={{ color: "#e50914" }}>{error}</p> : null}

      <h1 className="text-3xl font-semibold text-white mb-8 text-center">
        Reset Password
      </h1>

      <Tabs.Root defaultValue="user" className="w-full">
        <Tabs.Content value="user">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mt-5">
              <Input
                type="password"
                name="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
                required
              />

              <Input
                type="password"
                name="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
                required
              />
              <Button
                type="submit"
                variant="destructive"
                className="w-full bg-[#e50914]"
                disabled={loading}
              >
                {loading ? (
                  <Loader className="mr-2 animate-spin" /> // Loader icon
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
