"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams} from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import { Loader } from "lucide-react";
import {toast} from "@/hooks/use-toast"; // Assuming you're using Lucide icons

export default function ForgotPassword() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false); // Track loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Helper function for making POST requests
      const postData = async (url: string, body: object) => {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error("Request failed");
        return response.clone().json();
      };

      // Fetch user login data
      const data = await postData("/api/user-login", { email });

      if (!data?.user?.id) throw new Error("User not found");

      // Send reset password email
      await postData("/api/reset-password-email", {
        email,
        userId: data.user.id,
      });

      toast({
        title: "Reset Email Sent",
        description: "Please check your email to reset your password"
      });
      setSuccess(true);
      // router.push(`/verify-otp?email=${email}`); // Uncomment if routing needed
    } catch (error) {
      console.error("Error in forgotting password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-24  rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-full md:px-14">
      {success ? (
        <>
          <p className="w-96 p-4 text-white">
            A password reset email has been sent to the email address for your account,
            but may take several minutes to show up in your inbox.
          </p>
        <div className="rounded-md  py-2 px-4 border border-transparent text-center text-sm text-white transition-all ">
          <Button
            type="button"
            variant="destructive"
            className="  bg-[#e50914] w-28"
            disabled={loading}
            onClick={() => (window.location.href = `/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
          >
            {loading ? (
              <Loader className="mr-2 animate-spin" /> // Loader icon
            ) : (
              "Ok"
            )}
          </Button>
          </div>
        </>
      ) : null}
      {error && !success ? <p style={{ color: "#e50914" }}>{error}</p> : null}

      {!success ? (
        <>
          <h1 className="text-3xl font-semibold text-white mb-8 text-center">
            Reset your password
          </h1>{" "}
          <Tabs.Root defaultValue="user" className="w-full">
            <Tabs.Content value="user">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 mt-5">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
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
                      "Continue"
                    )}
                  </Button>
                </div>
              </form>
            </Tabs.Content>
          </Tabs.Root>
          <div className="text-gray-500 text-sm mt-2">
            Alredy Have a account?{" "}
            <Link className="text-white hover:underline" href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>
              Log in now!
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
