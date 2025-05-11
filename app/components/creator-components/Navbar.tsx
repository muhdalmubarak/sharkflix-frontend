"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../../public/Red and Black Simple Modern Apparel Sport Logo.png";
import {usePathname} from "next/navigation";
import {Search} from "lucide-react";
import UserNav from "./UserNav";
import {NotificationsDialog} from "@/components/creator-dashboard/components/notification";
import {useState} from "react";

interface linkProps {
    name: string;
    href: string;
}

let links: linkProps[] = [
    {name: "Home", href: "/creator-home"},
    // { name: "Tv Shows", href: "/home/shows" },
    {name: "My Videos", href: "/creator-home/recently"},
    {name: "My Events", href: "/creator-home/events"},
    {name: "Trending", href: "/creator-home/movies"},
    {name: "Withdraw Funds", href: "/creator-home/payment-method"},
    {name: "Load to Drive", href: "/creator-home/drive-upload"},
];
const links_affiliate: linkProps[] = [
    {name: "Home", href: "/affiliate-home"},
    {name: "Affiliate Videos", href: "/affiliate-home/affiliate"},
    {name: "Affiliate Events", href: "/affiliate-home/events"},
];

export default function Navbar({session, userData}: { session: any, userData: any }) {
    const pathName = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (userData?.user?.role == "affiliate" || session?.user?.role == "affiliate") {
        links = links_affiliate;
    }
    return (
        <div className="w-full max-w-7xl mx-auto items-center justify-between px-5 sm:px-6 py-5 lg:px-8 flex">
            <div className="flex items-center">
                <Link href="/home" className="w-32">
                    <Image src={Logo} alt="Netflix logo" priority/>
                </Link>
                {/* Desktop Menu */}
                <ul className="lg:flex gap-x-4 ml-14 hidden">
                    {links.map((link, idx) => (
                        <li key={idx}>
                            <Link
                                href={link.href}
                                className={`text-sm ${
                                    pathName === link.href
                                        ? "text-white font-semibold underline"
                                        : "text-gray-300 font-normal"
                                }`}
                            >
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                {/* Mobile Menu Icon */}
                <button
                    className="lg:hidden ml-10 text-gray-300"
                    onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                >
                    ☰ {/* Replace with an icon if desired */}
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-black p-4 z-50 lg:hidden">
                    <ul className="flex flex-col gap-y-4">
                        {links.map((link, idx) => (
                            <li key={idx}>
                                <Link
                                    href={link.href}
                                    className={`text-sm ${
                                        pathName === link.href
                                            ? "text-white font-semibold underline"
                                            : "text-gray-300 font-normal"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center gap-x-8">
                <Search className="w-5 h-5 text-gray-300 cursor-pointer"/>
                <NotificationsDialog userId={session?.user?.id}/>
                {/* <Bell className="h-5 w-5 text-gray-300 cursor-pointer" /> */}
                <UserNav session={session} userData={userData}/>
            </div>
        </div>
    );
}
