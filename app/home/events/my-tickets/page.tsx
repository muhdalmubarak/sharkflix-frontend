// app/home/events/my-tickets/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { QRCodeDisplay } from "@/app/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, ArrowUpRight, Video } from "lucide-react";
import Link from "next/link";
import { DownloadTicketButton } from "@/app/components/admin-components/DownloadTicketButton";

async function getUserTickets(userId: number) {
    const tickets = await prisma.tickets.findMany({
        where: {
            userId: userId,
        },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    bookingDate: true,
                    imageUrl: true,
                    status: true,
                    isLive: true,
                    recordingUrl: true,
                    allowRecordingAccess: true,
                }
            },
            payment: true,
        },
        orderBy: {
            purchaseDate: 'desc',
        },
    });

    return tickets;
}

export default async function MyTicketsPage() {
    const session = await getServerSession(authOptions);
    const tickets = await getUserTickets(session?.user?.id as number);

    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

          <div className="grid grid-cols-1 gap-6">
              {tickets.map((ticket) => {
                  const eventDate = new Date(ticket.event.date);
                  const now = new Date();

                  // Calculate the end of the event day (11:59:59 PM)
                  const eventEndDate = new Date(eventDate);
                  eventEndDate.setHours(23, 59, 59, 999);

                  const isPastEvent = now > eventEndDate;
                  const canWatchStream = ticket.status === 'active' && !isPastEvent;
                  const isBookingOpen = now >= new Date(ticket.event.bookingDate);

                  // Check if recording is available
                  const hasRecording = !!ticket.event.recordingUrl && ticket.event.allowRecordingAccess;

                  return (
                    <div
                      key={ticket.id}
                      className="bg-black/20 rounded-lg overflow-hidden"
                    >
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            {/* Event Image */}
                            <div className="relative w-full md:w-48 h-32">
                                {ticket.event.imageUrl && (
                                  <Image
                                    src={ticket.event.imageUrl}
                                    alt={ticket.event.title}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                )}
                            </div>

                            {/* Ticket Details */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                        {canWatchStream && isBookingOpen ? (
                                          <Link href={`/home/events/${ticket.event.id}/stream`} className="hover:text-blue-500 transition-colors flex items-center gap-2">
                                              {ticket.event.title}
                                              <ArrowUpRight className="w-4 h-4" />
                                          </Link>
                                        ) : (
                                          ticket.event.title
                                        )}
                                        {canWatchStream && isBookingOpen && (
                                          <Badge className="ml-2" variant="outline">
                                              Live Stream Available
                                          </Badge>
                                        )}
                                        {hasRecording && isPastEvent && (
                                          <Badge className="ml-2" variant="outline" color="green">
                                              Recording Available
                                          </Badge>
                                        )}
                                    </h2>
                                    <div className="flex gap-2 mb-2">
                                        <Badge variant={!isPastEvent ? "default" : "secondary"}>
                                            {!isPastEvent ? "Upcoming" : "Past Event"}
                                        </Badge>
                                        <Badge variant={ticket.status === 'active' ? "success" : "destructive"}>
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm text-gray-400">
                                        <p>Event Date: {format(eventDate, "MMMM dd, yyyy - hh:mm a")}</p>
                                        {!isBookingOpen && (
                                          <p>Booking Opens: {format(new Date(ticket.event.bookingDate), "MMMM dd, yyyy - hh:mm a")}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Info */}
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div>
                                        <p className="text-sm text-gray-400">Ticket Code</p>
                                        <p className="font-mono">{ticket.ticketCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Purchase Date</p>
                                        <p>{ticket.purchaseDate ? format(new Date(ticket.purchaseDate), "MMM dd, yyyy") : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Amount Paid</p>
                                        <p>MYR {Number(ticket.payment?.amount || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Payment Status</p>
                                        <Badge variant={ticket.payment?.status === 'completed' ? "success" : "warning"}>
                                            {ticket.payment?.status || 'pending'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {canWatchStream && isBookingOpen && (
                                      <Link href={`/home/events/${ticket.event.id}/stream`}>
                                          <Button variant="default" className="flex items-center gap-2">
                                              Watch Stream
                                              <ArrowRight className="w-4 h-4"/>
                                          </Button>
                                      </Link>
                                    )}
                                    {hasRecording && isPastEvent && (
                                      <Link href={`/home/events/recordings/${ticket.event.id}`}>
                                          <Button variant="outline" className="flex items-center gap-2">
                                              <Video className="w-4 h-4" />
                                              Watch Recording
                                          </Button>
                                      </Link>
                                    )}
                                    <DownloadTicketButton
                                      ticket={ticket}
                                      event={ticket.event}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-center">
                                <QRCodeDisplay value={ticket.qrCode} size={120}/>
                            </div>
                        </div>
                    </div>
                  );
              })}

              {tickets.length === 0 && (
                <div className="text-center py-12 bg-black/20 rounded-lg">
                    <p className="text-gray-400">You haven't purchased any tickets yet.</p>
                </div>
              )}
          </div>
      </div>
    );
}
