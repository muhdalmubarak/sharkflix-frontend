import { getServerSession } from "next-auth";
import MovieVideo from "../components/MovieVideo";
import RecentlyAdded from "../components/RecentlyAdded";
import UpcomingEvents from "../components/UpcomingEvents";
import { authOptions } from "../utils/auth";
import prisma from "../utils/db";


async function getUpcomingEvents(userId: number): Promise<any> {
  const events = await prisma.events.findMany({
    where: {
      status: {
        not: 'ended'
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      bookingDate: true,
      price: true,
      imageUrl: true,
      trailerUrl: true,
      totalTickets: true,
      availableTickets: true,
      commissionPercentage: true,
      streamUrl: true,
      isTopRated: true,
      soldOut:true,
      tickets: {
        where: {
          userId: userId,
        }
      },
    },
    orderBy: [
      {
        isTopRated: 'desc', // TRUE values will come first
      },
      {
        date: 'desc',
      },
    ],
    take: 4, // Limit to 4 events for homepage
  }).then(events => events.map(event => ({
    ...event,
    price: Number(event.price),
    commissionPercentage: event.commissionPercentage ? Number(event.commissionPercentage) : null
  })));

  return events;
}

export default async function HomePage() {
  const session: any = await getServerSession(authOptions);
  const events = await getUpcomingEvents(session?.user?.id as number);

  const currentUser = session?.user ? {
    role: session.user.role,
    AFFCode: session.user.affiliateCode,
    email: session.user.email,
    id: session.user.id
  } : null;

  return (
    <div className="p-5 lg:p-0">
      <MovieVideo userEmail={session?.user?.email}/>
      <UpcomingEvents
        events={events}
        currentUser={currentUser}
        userEmail={session?.user?.email}
      />
      <RecentlyAdded />
    </div>
  );
}
