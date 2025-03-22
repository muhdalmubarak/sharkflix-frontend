"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn-ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn-ui/card";
import Image from "next/image";
import React, {useEffect, useState} from "react";
import { DataTable } from '@/components/table/data-table';
import { columns } from '@/components/table/columns';

export default function AffiliateDashboard() {
  const [data, setData] = useState({
    summary: {
      totalRevenue: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
      bySource: {
        movie: 0,
        event: 0
      }
    },
    allRevenues: [],
    recentTransactions: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/affiliate/revenues');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="">
      <>
        {/* Mobile View */}
        <div className="block md:hidden">
          <div className="flex-1 space-y-4 p-4">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  {/* Cards using full width on mobile */}
                  <Card className="col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        MYR {data.summary.totalRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Other Cards */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.unpaidRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Movie Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.bySource.movie.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.bySource.event.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-auto">
                    <DataTable columns={columns} data={data.recentTransactions} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                {/* Transactions tab content */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={columns} data={data.allRevenues} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Desktop View - Keep your existing desktop layout */}
        {/* Card Section */}
        <div className="hidden md:flex w-full flex-col">
          {/* Image Section */}
          {/*<div className="block md:hidden">*/}
          {/*  <Image*/}
          {/*    src="/examples/dashboard-light.png"*/}
          {/*    width={1280}*/}
          {/*    height={866}*/}
          {/*    alt="Dashboard"*/}
          {/*    className="block dark:hidden"*/}
          {/*  />*/}
          {/*  <Image*/}
          {/*    src="/examples/dashboard-dark.png"*/}
          {/*    width={1280}*/}
          {/*    height={866}*/}
          {/*    alt="Dashboard"*/}
          {/*    className="hidden dark:block"*/}
          {/*  />*/}
          {/*</div>*/}
          <div className="flex-1 space-y-4 p-4 sm:p-6 w-full">
            <div className="flex items-center justify-between space-y-2">
              {/* Placeholder for header items */}
              <div className="flex items-center space-x-2"></div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>


              <TabsContent value="overview" className="space-y-4">
                {/* Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.totalRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Other Cards */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.unpaidRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Movie Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.bySource.movie.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        MYR {data.summary.bySource.event.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
               
                </div>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={columns} data={data.recentTransactions} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={columns} data={data.allRevenues} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
    </div>
  );
}
