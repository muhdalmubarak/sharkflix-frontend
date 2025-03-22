"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from 'next/image'
import Logo from "../../public/Red and Black Simple Modern Apparel Sport Logo.png";
import PreviewEvents from "@/app/components/PreviewEvents";

const PreviewSignupFlow = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGetStarted = () => {
    setShowSignupDialog(true);
  };

  const handleSignup = () => {
    const params = searchParams.toString();
    router.push(`/signup${params ? `?${params}` : ''}`);
  };

  const handleLogin = () => {
    const params = searchParams.toString();
    router.push(`/login${params ? `?${params}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-[#000000] to-transparent mb-20">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="w-32">
            <Image
              src={Logo}
              alt="VideoHub logo"
              className="w-full h-full object-cover"
            />
          </Link>
          <Button
            onClick={handleLogin}
            variant="ghost"
            className="bg-[#e50914] hover:bg-[#f6121d] text-white"
          >
            Join us today
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[50vh] w-full mt-20">
        <div className="absolute inset-0 bg-[#000000]"> {/* Pure black background */}
          <div className="absolute inset-0 bg-[#000000]/60"/>
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
            Watch Live Events & Premium Content
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8 max-w-2xl">
            Access exclusive live events, workshops, and premium videos from top creators
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-[#e50914] hover:bg-[#f6121d] text-white px-8 py-6 text-lg"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Preview Content Section */}
      <PreviewEvents onGetStarted={handleGetStarted} />

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="bg-[#000000] border-[#121212] text-white max-w-md">
          <DialogTitle className="text-2xl font-bold mb-4 text-center">
            Join to Continue
          </DialogTitle>
          <div className="p-6">
            <p className="text-gray-400 text-center mb-6">
              Sign up to access full content and live events
            </p>
            <div className="space-y-4">
              <Button
                onClick={handleSignup}
                className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white py-6 rounded-sm"
              >
                Sign Up Now
              </Button>
              <div className="text-center">
                <span className="text-gray-400">Already have an account? </span>
                <button
                  onClick={handleLogin}
                  className="text-white hover:underline"
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreviewSignupFlow;
