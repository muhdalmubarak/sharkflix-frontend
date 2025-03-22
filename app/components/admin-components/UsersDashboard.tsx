'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn-ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserStats {
  total: number;
  todaySignups: number;
  roleBreakdown: {
    [key: string]: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  job_title: string;
  company: string;
  emailVerified: Date | null;
  request_approved: boolean;
  total_revenue: number;
  current_balance: number;
  _count: {
    movies: number;
    events: number;
    tickets: number;
  };
}

interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 10
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Update debouncedSearch value after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      setUsers(data.users);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, debouncedSearch, roleFilter]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusChange = async (userId: number, approved: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          request_approved: approved
        }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              {stats?.todaySignups || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              {stats?.roleBreakdown?.creator || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              {stats?.roleBreakdown?.affiliate || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter Role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleRoleFilter('')}>
              All Roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleFilter('user')}>
              Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleFilter('creator')}>
              Creators
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleFilter('affiliate')}>
              Affiliates
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="border-b">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Content</th>
                <th className="text-left p-4">Revenue</th>
                <th className="text-right p-4">Actions</th>
              </tr>
              </thead>
              <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.job_title}</div>
                    </div>
                  </td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-yellow-200 bg-black-600">
                        {user.role}
                      </span>
                  </td>
                  <td className="p-4">
                    {user.request_approved ? (
                      <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Active
                        </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                          <XCircle className="mr-1 h-4 w-4" />
                          Suspended
                        </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {user._count.movies} videos
                      <br />
                      {user._count.events} events
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      Total: MYR {user.total_revenue || 0}
                      <br />
                      Balance: MYR {user.current_balance || 0}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/*<DropdownMenuItem>*/}
                        {/*  <Edit className="mr-2 h-4 w-4" />*/}
                        {/*  Edit Details*/}
                        {/*</DropdownMenuItem>*/}
                        {/*<DropdownMenuItem*/}
                        {/*  onClick={() => handleStatusChange(user.id, !user.request_approved)}*/}
                        {/*  className={user.request_approved ? "text-red-600" : "text-green-600"}*/}
                        {/*>*/}
                        {/*  {user.request_approved ? (*/}
                        {/*    <>*/}
                        {/*      <Ban className="mr-2 h-4 w-4" />*/}
                        {/*      Suspend User*/}
                        {/*    </>*/}
                        {/*  ) : (*/}
                        {/*    <>*/}
                        {/*      <CheckCircle className="mr-2 h-4 w-4" />*/}
                        {/*      Activate User*/}
                        {/*    </>*/}
                        {/*  )}*/}
                        {/*</DropdownMenuItem>*/}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
              {pagination.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              {[...Array(pagination.pages)].map((_, i) => (
                <Button
                  key={i}
                  variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                >
                  {i + 1}
                </Button>
              )).slice(
                Math.max(0, pagination.currentPage - 3),
                Math.min(pagination.pages, pagination.currentPage + 2)
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
