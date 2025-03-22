// components/creator-dashboard/components/notification.tsx
"use client";

import { BellIcon, CheckIcon } from "@radix-ui/react-icons";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/shadcn-ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/shadcn-ui/dialog";
import { Button } from "@/components/shadcn-ui/button";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: Date;
    metadata: any;
    userId: string;
}

type CardProps = React.ComponentProps<typeof Card>;

export function NotificationsDialog({ className, userId, ...props }: CardProps & { userId: number }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`/api/notifications/${userId}`);
            const data = await response.json();
            // console.log(data)
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setError('Failed to load notifications');
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/api/notifications/mark-all-read/${userId}`, {
                method: 'POST'
            });
            setNotifications(notifications.map(notification => ({
                ...notification,
                is_read: true
            })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await fetch(`/api/notifications/mark-read/${notificationId}`, {
                method: 'POST'
            });
            setNotifications(notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, is_read: true }
                    : notification
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    // Fetch notifications when component mounts or dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'ticket_purchased':
                return "🎟️";
            case 'event_reminder':
                return "⏰";
            case 'payment_confirmed':
                return "💰";
            case 'stream_starting':
                return "🎥";
            default:
                return "📢";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="relative">
                    <Bell className="h-5 w-5 text-gray-300 cursor-pointer" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent>
                <Card className={cn("w-[460px]", className)} {...props}>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            {unreadCount === 0
                                ? "No unread messages"
                                : `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-4">
                                Loading notifications...
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500 py-4">
                                {error}
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded",
                                            !notification.is_read && "bg-gray-50"
                                        )}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    >
                                        <span className="text-xl">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="space-y-1">
                                            <p className={cn(
                                                "text-sm font-medium leading-none",
                                                !notification.is_read && "font-semibold"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(notification.created_at), 'PPp')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">
                                        No notifications yet
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                    {notifications.length > 0 && unreadCount > 0 && (
                        <CardFooter>
                            <Button className="w-full" onClick={markAllAsRead}>
                                <CheckIcon className="mr-2 h-4 w-4" /> Mark all as read
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </DialogContent>
        </Dialog>
    );
}
