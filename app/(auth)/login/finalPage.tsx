// app/login/page.tsx
"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import {useRouter, useSearchParams} from "next/navigation";
import {signIn} from "next-auth/react";
import {useState} from "react";
import {Loader} from "lucide-react";
import {PayHalalService} from "@/services/payhalal.service";
import {useToast} from "@/hooks/use-toast";

const postData = async (url: string, body: object) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Request failed");
  return response.clone().json();
};

export default function FinalLogin() {
  const { toast } = useToast()
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Track loading state

  const handlePaymentRedirect = async (userData: any) => {
    const eventId = searchParams.get('eventId');
    const movieFileName = searchParams.get('movie');
    const refCode = searchParams.get('refCode');

    // Validate user data
    if (!userData?.user?.id || !userData?.user?.email) {
      throw new Error('Invalid user data');
    }

    if (refCode) {
      await fetch('/api/affiliate-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user.id, refCode })
      });
    }

    // Handle event ticket purchase
    if (eventId) {
      if (!eventId || isNaN(Number(eventId))) {
        throw new Error('Invalid event ID');
      }

      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }

      const event = await response.json();
      if (!event?.id || !event?.title || !event?.price) {
        throw new Error('Invalid event data');
      }

      toast({
        title: "Redirecting to payment",
        description: "Please wait while we process your request"
      });

      const paymentUrl = await PayHalalService.initiateTicketPayment({
        userEmail: userData.user.email,
        eventId: event.id,
        title: event.title,
        price: event.price
      });

      if (!paymentUrl) {
        throw new Error('Failed to generate payment URL');
      }

      window.location.href = paymentUrl;
      return;
    }

    // Handle video purchase
    if (movieFileName) {
      const youtubeUrlLink = `https://zdcryvewjhsccriuzltq.supabase.co/storage/v1/object/public/video_videohub/video_videohub/movie/${movieFileName}`;

      const movie = await postData("/api/video-get", { youtubeUrlLink });
      if (!movie?.youtubeString || !movie?.price) {
        throw new Error('Invalid video data');
      }

      toast({
        title: "Redirecting to payment",
        description: "Please wait while we process your request"
      });

      const paymentUrl = await PayHalalService.initiateVideoPayment({
        userEmail: userData.user.email,
        youtubeUrl: movie.youtubeString,
        price: movie.price
      });

      if (!paymentUrl) {
        throw new Error('Failed to generate payment URL');
      }

      window.location.href = paymentUrl;
      return;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setLoading(true);
    // Optionally hash the password before sending it to the server (handled server-side anyway)
    try {
      // First attempt to sign in with credentials
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid email or password"
        });
        return;
      }


      // If sign-in successful, fetch user data
      const userResponse = await fetch("/api/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();

      if (!userData?.user?.role) {
        throw new Error("Invalid user data");
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify({
        role: userData.user.role,
        AFFCode: userData.user.affiliateCode,
        email: userData.user.email,
        id: userData.user.id,
      }));

      await handlePaymentRedirect(userData);

      toast({
        title: "Success",
        description: "Successfully logged in"
      });

      // Redirect based on role
      switch (userData.user.role) {
        case "creator":
          router.push("/creator-home");
          break;
        case "affiliate":
          router.push("/affiliate-home");
          break;
        case "admin":
          router.push("/admin-home");
          break;
        default:
          router.push("/home");
      }

    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log in"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-24  rounded bg-black/80 py-20 px-6 md:mt-0 md:max-w-sm md:px-14">
      <form onSubmit={handleSubmit}>
        <h1 className="text-3xl text-center font-semibold text-white">
          VideoHub
        </h1>
        <div className="space-y-4 mt-5">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />
          {/* <Button
            type="submit"
            variant="destructive"
            className="w-full bg-[#e50914]"
          >
            Log in as Creator
          </Button> */}
          <Button
            type="submit"
            variant="destructive"
            className="w-full bg-[#e50914]"
            disabled={loading}
          >
            {loading ? (
              <Loader className="mr-2 animate-spin" /> // Loader icon
            ) : (
              "Log in"
            )}
          </Button>
        </div>
      </form>

      <div className="text-gray-500 text-sm mt-4">
        <Link className="text-white hover:underline" href={`/forgot-password${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>
          Forgot password
        </Link>
      </div>
      <div className="text-gray-500 text-sm mt-4">
        New to VideoHub?{" "}
        <Link className="text-white hover:underline" href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>
          Sign up now
        </Link>
      </div>

      <div className="flex w-full justify-center items-center gap-x-3 mt-6">
        {/* <GithubSignInButton /> */}
        <GoogleSignInButton />
      </div>
    </div>
  );
}
