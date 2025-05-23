import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {signOut} from "next-auth/react";
import {generateMediaUrl} from "@/lib/utils";

export default async function AdminNav({session, userData}: { session: any, userData: any }) {

    const avatarUrl = await generateMediaUrl('/user%20image/avatar.png');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-sm">
                    <Avatar className="h-10 w-10 rounded-sm">
                        <AvatarImage src={avatarUrl}/>
                        <AvatarFallback
                            className="rounded-sm">{userData?.user?.name ? userData?.user?.name?.slice(0, 3) : 'User'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData?.user?.name ? userData?.user?.name : 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session?.user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
