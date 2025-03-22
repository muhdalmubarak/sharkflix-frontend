'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import GithubSignInButton from "@/app/components/GithubSignInButton";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import * as Tabs from '@radix-ui/react-tabs';
import { useState } from "react";
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/shadcn-ui/input-otp"
import {toast} from "@/hooks/use-toast";



export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const email = searchParams.get('email'); // Fetch the email parameter

  const [role, setRole] = useState('user')
  const [password, setPassword] = useState('')
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false);

  function generateOTP() {
    // Generate a random number between 1000 and 9999 (inclusive)
    return Math.floor(1000 + Math.random() * 9000);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setLoading(true);

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    // Optionally hash the password before sending it to the server (handled server-side anyway)
    try {
      // Send data to the server-side API route to create the user

      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          input_otp: value
        }),
      });

      if (!response.ok) {
        throw new Error("Wrong OTP");
      }

      toast({
        title: "Success",
        description: "Email verified successfully"
      });


      // Preserve all URL parameters except email for login redirect
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== 'email') {
          params.append(key, value);
        }
      });

      setSuccess(true);

      const queryString = params.toString();
      router.push(`/login${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP code"
      });
    } finally {
      setLoading(false);
    }
  };




  return (

    <div className="mt-24  rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
      <h1 className="text-3xl font-semibold text-white mb-8 text-center">Verify OTP</h1>
      <InputOTP maxLength={6} value={value} onChange={(value) => setValue(value)}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <Button
        className="mt-4 ml-[35%]"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Submit"}
      </Button>
    </div>
  );
}
