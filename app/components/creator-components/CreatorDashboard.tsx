"use client"

import React, { useEffect, useState } from 'react';
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
import { DataTable } from '@/components/table/data-table';
import { columns } from '@/components/table/columns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from "next/image";
import {VideoUploadDialog} from "@/app/components/creator-components/uploadVideo";
import { DashboardData } from '@/lib/supabase/types';
import { VideoGrid } from './VideoGrid';

const CreatorDashboard = () => {
  const [data, setData] = useState<DashboardData>({
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
    recentTransactions: [],
    analytics: {
      totalViews: 0,
      totalVideos: 0,
      revenueHistory: [],
      recentVideos: [],
      allVideos: []
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch revenue data
        const revenueResponse = await fetch('/api/creator/revenues');
        const revenueData = await revenueResponse.json();

        // Fetch videos and analytics data
        const videosResponse = await fetch('/api/creator/videos');
        const videosData = await videosResponse.json();

        setData({
          ...revenueData,
          analytics: videosData
        });
      } catch (error) {
        console.error('Error fetching creator data:', error);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Creator Dashboard</h1>
        <VideoUploadDialog/>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Revenue Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  MYR {data.summary.totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.analytics.totalViews.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Videos Posted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.analytics.totalVideos}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  MYR {data.summary.unpaidRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.analytics.revenueHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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

        <TabsContent value="videos">
          {/* Recent Videos Grid */}
          <VideoGrid videos={data.analytics.allVideos} />
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
  );
};

export default CreatorDashboard;
