import prisma from "@/app/utils/db";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/shadcn-ui/tabs";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/shadcn-ui/card";
import Image from "next/image";
import {Overview} from "@/components/creator-dashboard/components/overview";
import {RecentSales} from "@/components/creator-dashboard/components/recent-sales";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import {VideoUploadDialog} from "./uploadVideo";

async function purchasedVideos() {
    const data = await prisma.purchased_videos.findMany({
        select: {
            user_email: true,
            youtube_url: true,
        },
    });
    return data;
}

interface PurchasedVideo {
    user_email: string;
    youtube_url: string;
}

async function movewVideos(userId: any, purchasedVideosUser: any) {
    const youtubeUrls = purchasedVideosUser.map(
        (video: PurchasedVideo) => video.youtube_url
    );

    const data = await prisma.movie.findMany({
        select: {
            title: true,
            overview: true,
            videoSource: true,
            imageString: true,
            release: true,
            duration: true,
            id: true,
            age: true,
            youtubeString: true,
            price: true,
            totalviews: true,
        },
        where: {
            youtubeString: {
                in: youtubeUrls,
            },
            userId: userId,
        },
    });
    return data;
}

async function getData(userId: number) {
    const data = await prisma.movie.findMany({
        where: {
            userId: userId,
        },
        select: {
            id: true,
            overview: true,
            title: true,
            WatchLists: {
                where: {
                    userId: userId,
                },
            },
            imageString: true,
            youtubeString: true,
            age: true,
            release: true,
            duration: true,
            price: true,
            userId: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 4,
    });
    return data;
}

async function getUserData(id: number) {
    const user: any = await prisma.user.findFirst({
        where: {id: id},
    });
    return user;
}

export default async function MovieVideo() {
    const session = await getServerSession(authOptions);
    const data = await getData(session?.user?.id as number);
    const userData = await getUserData(session?.user?.id as number);
    let purchasedVideosUser;
    const purchasedVideosUse = await purchasedVideos();
    const purchasedMoview = await movewVideos(
        session?.user?.id as number,
        purchasedVideosUse
    );
    const totalSales = purchasedMoview.reduce((accumulator: number, sale: any) => {
        return accumulator + Number(sale.price || 0);
    }, 0); // Initial value is 0

    const platFormFee = (totalSales * 20) / 100;
    const currentBalance = userData?.current_balance;

    return (
        <div
            className="h-[50vh] sm:h-[55vh] lg:h-[60vh] mt-[5%] sm:mt-[10%] mb-[5%] sm:mb-[10%] w-full flex flex-col md:flex-row justify-start items-center">
            <>
                {/* Image Section */}
                <div className="block md:hidden">
                    <Image
                        src="/examples/dashboard-light.png"
                        width={1280}
                        height={866}
                        alt="Dashboard"
                        className="block dark:hidden"
                    />
                    <Image
                        src="/examples/dashboard-dark.png"
                        width={1280}
                        height={866}
                        alt="Dashboard"
                        className="hidden dark:block"
                    />
                </div>

                {/* Card Section */}
                <div className="hidden md:flex w-full flex-col">
                    <div className="flex-1 space-y-4 p-4 sm:p-6 w-full">
                        <div className="flex items-center justify-between space-y-2">
                            {/* Placeholder for header items */}
                            <div className="flex items-center space-x-2"></div>
                        </div>

                        {/* Tabs Section */}
                        <Tabs defaultValue="overview" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="analytics" disabled>
                                    Analytics
                                </TabsTrigger>
                            </TabsList>

                            <VideoUploadDialog/>

                            <TabsContent value="overview" className="space-y-4">
                                {/* Cards Grid */}
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                Total Revenue
                                            </CardTitle>
                                            <svg
                                                className="h-4 w-4 text-muted-foreground" /* SVG icon */
                                            ></svg>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">MYR {totalSales?.toString()}</div>
                                        </CardContent>
                                    </Card>

                                    {/* Other Cards */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                Current Balance
                                            </CardTitle>
                                            <svg
                                                className="h-4 w-4 text-muted-foreground" /* SVG icon */
                                            ></svg>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                MYR {currentBalance?.toString()}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Views Card */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                Total Views
                                            </CardTitle>
                                            <svg
                                                className="h-4 w-4 text-muted-foreground" /* SVG icon */
                                            ></svg>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                0
                                                {/* {purchasedMoview.reduce((acc, movie) => {
                          return acc + (movie.totalviews || 0);
                        }, 0)} */}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Videos Posted Card */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                Videos Posted
                                            </CardTitle>
                                            <svg
                                                className="h-4 w-4 text-muted-foreground" /* SVG icon */
                                            ></svg>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{data?.length}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Larger Grid for Desktop */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                    <Card className="col-span-4">
                                        <CardHeader>
                                            <CardTitle>Revenue Trends</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pl-2">
                                            <Overview/>
                                        </CardContent>
                                    </Card>

                                    <Card className="col-span-3">
                                        <CardHeader>
                                            <CardTitle>Recent Videos</CardTitle>
                                            <CardDescription>
                                                You have posted 3 videos this month.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <RecentSales data={data}/>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </>
        </div>
    );
}
