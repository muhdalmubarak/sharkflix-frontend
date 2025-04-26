'use client'
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import {useRouter, useSearchParams} from "next/navigation";
import * as Tabs from '@radix-ui/react-tabs';
import {useState} from "react";
import {Info, Loader} from 'lucide-react'; // Assuming you're using Lucide icons
import {v4 as uuidv4} from "uuid";
import {USER_ROLES} from "@/app/utils/constants";
import {useToast} from "@/hooks/use-toast";
import {Dialog, DialogContent} from "@/components/shadcn-ui/dialog";
import TermsAndConditions from '@/app/components/TermsAndConditions';
import {Alert, AlertDescription} from '@/components/shadcn-ui/alert';

interface RoleAlertProps {
    role: 'user' | 'creator' | 'affiliate';
}

interface SignUpFormProps {
    role: 'user' | 'creator' | 'affiliate';
    email: string;
    password: string;
    loading: boolean;
    acceptedTerms: boolean;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    setShowTerms: (show: boolean) => void;
    setAcceptedTerms: (accepted: boolean) => void;
}

const RoleAlert: React.FC<RoleAlertProps> = ({role}) => {
    const getRoleDescription = () => {
        switch (role) {
            case 'user':
                return 'You are signing up as a User. Users can purchase tickets and watch events.';
            case 'creator':
                return 'You are signing up as a Creator. Creators can host events and earn revenue.';
            case 'affiliate':
                return 'You are signing up as an Affiliate. Affiliates can promote events and earn commissions.';
            default:
                return '';
        }
    };

    const getBorderColor = () => {
        switch (role) {
            case 'user':
                return 'border-blue-500';
            case 'creator':
                return 'border-green-500';
            case 'affiliate':
                return 'border-purple-500';
            default:
                return 'border-gray-500';
        }
    };

    return (
        <Alert className={`mb-4 border-2 ${getBorderColor()} bg-gray-900`}>
            <Info className="h-5 w-5 mt-0.5"/>
            <AlertDescription className="text-sm ml-2">
                {getRoleDescription()}
            </AlertDescription>
        </Alert>
    );
};

const SignUpForm: React.FC<SignUpFormProps> = ({
                                                   role,
                                                   email,
                                                   password,
                                                   loading,
                                                   acceptedTerms,
                                                   setEmail,
                                                   setPassword,
                                                   handleSubmit,
                                                   setShowTerms,
                                                   setAcceptedTerms
                                               }) => {
    return (
        <form onSubmit={handleSubmit}>
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
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-300">
                        I accept the{" "}
                        <button
                            type="button"
                            onClick={() => setShowTerms(true)}
                            className="text-[#e50914] hover:underline"
                        >
                            Terms and Conditions
                        </button>
                    </label>
                </div>

                <RoleAlert role={role}/>

                <Button
                    type="submit"
                    variant="destructive"
                    className="w-full bg-[#e50914]"
                    disabled={loading || !acceptedTerms}
                >
                    {loading ? (
                        <Loader className="mr-2 animate-spin"/>
                    ) : (
                        'Sign Up'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default function SignUpPage() {
    const {toast} = useToast()
    const router = useRouter()
    const searchParams = useSearchParams();


    const [role, setRole] = useState(() => {
        const refCode = searchParams.get('refCode');
        return refCode ? 'user' : 'user';
    });
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false); // Track loading state
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    function generateOTP() {
        // Generate a random number between 1000 and 9999 (inclusive)
        return Math.floor(100000 + Math.random() * 900000);
    }

    function generateAffiliateCode() {
        const affiliateCode = uuidv4();
        console.log("Generated Affiliate Code:", affiliateCode);
        return affiliateCode;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent page reload

        if (!acceptedTerms) {
            toast({
                variant: "destructive",
                title: "Terms Required",
                description: "Please accept the terms and conditions to continue"
            });
            return;
        }

        setLoading(true);


        try {
            // Send data to the server-side API route to create the user
            const otp = generateOTP();
            const affiliateCode = role === USER_ROLES.AFFILIATE ? generateAffiliateCode() : null;
            const refCode = searchParams.get('refCode');
            const eventId = searchParams.get('eventId');

            // Create user first
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password, // Send plain password - server will hash it securely
                    role, // Can be 'user' or 'creator'
                    user_otp: otp,
                    affiliateCode,
                    referredBy: refCode || null
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    // Handle email already exists case
                    const loginParams = new URLSearchParams({email});

                    if (eventId) {
                        loginParams.append('eventId', eventId);
                    }
                    if (refCode) {
                        loginParams.append('refCode', refCode);
                    }

                    const loginUrl = `/login?${loginParams.toString()}`;

                    toast({
                        variant: "destructive",
                        title: "Account Already Exists",
                        description: data.error,
                        action: (
                            <Link href={loginUrl}
                                  className="bg-white text-black px-3 py-2 rounded-md hover:bg-gray-200">
                                Login
                            </Link>
                        )
                    });
                    setLoading(false);
                    return;
                }
                throw new Error(data.error || "Failed to create user");
            }

            // If user creation successful, send verification email
            await fetch("/api/send-mail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    otp
                })
                ,
            });

            toast({
                title: "Account Created",
                description: "Please check your email for verification code"
            });

            // Redirect to OTP verification with appropriate params
            if (eventId) {
                // After OTP verification, redirect back to login with original params
                const params = new URLSearchParams({
                    eventId: eventId,
                    email: email
                });

                if (refCode) {
                    params.append('refCode', refCode);
                }

                router.push(`/verify-otp?${params.toString()}`);
            } else {
                router.push(`/verify-otp?email=${email}`);
            }
        } catch (error) {
            console.error("Error creating user:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error instanceof Error ? error.message : "Failed to create account"
            });
        } finally {
            setLoading(false);
        }
    };


    return (

        <div className="mt-24  rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
            <h1 className="text-3xl font-semibold text-white mb-8 text-center">Sign Up</h1>


            <Tabs.Root defaultValue="user" className="w-full">
                <Tabs.List className="flex space-x-2 mb-4">
                    <Tabs.Trigger value="user" onClick={() => setRole('user')}
                                  className="rounded-md hover:bg-gray-600
             flex-1 text-center py-2 bg-gray-800 text-gray-300
              radix-state-active:bg-[#e50914] data-[state=active]:bg-gray-600">
                        User Signup
                    </Tabs.Trigger>
                    {!searchParams.get('refCode') && (
                        <Tabs.Trigger value="creator" onClick={() => setRole('creator')}
                                      className="rounded-md hover:bg-gray-600 flex-1 text-center py-2 bg-gray-800 text-gray-300 radix-state-active:bg-[#e50914] radix-state-active:text-white data-[state=active]:bg-gray-600">
                            Creator Signup
                        </Tabs.Trigger>
                    )}
                    {!searchParams.get('refCode') && (
                        <Tabs.Trigger
                            value="affiliate"
                            onClick={() => setRole('affiliate')}
                            className="rounded-md hover:bg-gray-600 flex-1 text-center py-2 bg-gray-800 text-gray-300 radix-state-active:bg-[#e50914] data-[state=active]:bg-gray-600"
                        >
                            Affiliate
                        </Tabs.Trigger>
                    )}
                </Tabs.List>
                <Tabs.Content value="user">
                    <SignUpForm
                        role="user"
                        email={email}
                        password={password}
                        loading={loading}
                        acceptedTerms={acceptedTerms}
                        setEmail={setEmail}
                        setPassword={setPassword}
                        handleSubmit={handleSubmit}
                        setShowTerms={setShowTerms}
                        setAcceptedTerms={setAcceptedTerms}
                    />
                </Tabs.Content>

                <Tabs.Content value="creator">
                    <SignUpForm
                        role="creator"
                        email={email}
                        password={password}
                        loading={loading}
                        acceptedTerms={acceptedTerms}
                        setEmail={setEmail}
                        setPassword={setPassword}
                        handleSubmit={handleSubmit}
                        setShowTerms={setShowTerms}
                        setAcceptedTerms={setAcceptedTerms}
                    />
                </Tabs.Content>

                <Tabs.Content value="affiliate">
                    <SignUpForm
                        role="affiliate"
                        email={email}
                        password={password}
                        loading={loading}
                        acceptedTerms={acceptedTerms}
                        setEmail={setEmail}
                        setPassword={setPassword}
                        handleSubmit={handleSubmit}
                        setShowTerms={setShowTerms}
                        setAcceptedTerms={setAcceptedTerms}
                    />
                </Tabs.Content>
            </Tabs.Root>


            <div className="text-gray-500 text-sm mt-2">
                Already Have an account?{" "}
                <Link
                    className="text-white hover:underline"
                    href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                >
                    Log in now!
                </Link>
            </div>

            <div className="flex w-full justify-center items-center gap-x-3 mt-6">
                {/* <GithubSignInButton /> */}
                <GoogleSignInButton/>
            </div>

            {/* Terms Modal */}
            <Dialog open={showTerms} onOpenChange={setShowTerms}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <TermsAndConditions/>
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={() => {
                                setAcceptedTerms(true);
                                setShowTerms(false);
                            }}
                            className="bg-[#e50914] text-white"
                        >
                            Accept Terms
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
