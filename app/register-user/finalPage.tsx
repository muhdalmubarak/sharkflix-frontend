'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import GithubSignInButton from "@/app/components/GithubSignInButton";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import * as Tabs from '@radix-ui/react-tabs';
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
export default function SignUpPage() {

  const [fullname, setFullname] = useState('');
  const [jobtitle, setJobtitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (event:any) => {
    event.preventDefault(); 



    const response = await fetch("/api/user-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
       email,
       fullname,
       company,
       jobtitle
      }),
    });
  
    if (response.ok) {
      // Redirect to another page on success
      window.location.href = "/home"; // Change to your desired URL
    } else {
      // Handle errors
      const errorData = await response.json();
      console.error("Error:", errorData);
    }
  };



  return (
    <div className="mt-24  rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
      <h1 className="text-3xl font-semibold text-white mb-8 text-center">Register</h1>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mt-5">
          <Input
            type="text"
            name="fullname"
            placeholder="Full Name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />

          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />
          <Input
            type="text"
            name="jobtitle"
            placeholder="Job Title"
            value={jobtitle}
            onChange={(e) => setJobtitle(e.target.value)}   
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />
          <Input
            type="text"
            name="company"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="bg-[#333] placeholder:text-xs placeholder:text-gray-400 w-full inline-block"
          />
          <div className="flex items-center">
            <Checkbox.Root
              className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded bg-black shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-gray-800 focus:shadow-[0_0_0_2px_white] checked:bg-red-600"
              id="c1"
            >
              <Checkbox.Indicator className="text-white">
                <CheckIcon className="w-4 h-4" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label
              className="pl-[15px] text-[15px] leading-none text-gray-400"
              htmlFor="c1"
            >
              Accept terms and conditions.
            </label>
          </div>

          <Button
            type="submit"
            variant="destructive"
            className="w-full bg-[#e50914]"
          >
            Register
          </Button>
        </div>
      </form>

    </div>
  );
}
