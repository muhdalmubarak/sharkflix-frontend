// app/admin-home/events/[eventId]/tickets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  DropdownMenuTrigger,
} from "@/components/shadcn-ui/dropdown-menu";
import {
  Ticket,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface TicketStats {
  total: number;
  active: number;
  used: number;
  cancelled: number;
}

interface Event {
  title: string;
  date: Date;
  totalTickets: number;
  availableTickets: number;
}

interface Ticket {
  id: number;
  ticketCode: string;
  qrCode: string;
  purchaseDate: Date;
  status: string;
  user: {
    name: string;
    email: string;
  };
  payment: {
    amount: number;
    status: string;
    paymentMethod: string;
    transactionId: string;
  };
}

interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function EventTicketsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 10
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/events/${eventId}/tickets?${params}`);
      const data = await response.json();

      setTickets(data.tickets);
      setEvent(data.event);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [pagination.currentPage, debouncedSearch, statusFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{event?.title} - Tickets</h1>
          <p className="text-gray-400 mt-1">Event Date: {event?.date ? formatDate(event.date) : 'Loading...'}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center">
              <Ticket className="mr-2 h-5 w-5 text-gray-400" />
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Active Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Used Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-500" />
              {stats?.used || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Cancelled Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-500" />
              {stats?.cancelled || 0}
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
              placeholder="Search tickets..."
              value={search}
              onChange={handleSearch}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-700 text-gray-200">
              <Filter className="mr-2 h-4 w-4" />
              Filter Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
            <DropdownMenuItem
              onClick={() => handleStatusFilter('')}
              className="text-gray-200 focus:bg-gray-700"
            >
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusFilter('active')}
              className="text-gray-200 focus:bg-gray-700"
            >
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusFilter('used')}
              className="text-gray-200 focus:bg-gray-700"
            >
              Used
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusFilter('cancelled')}
              className="text-gray-200 focus:bg-gray-700"
            >
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tickets Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-gray-400">Ticket Code</th>
                    <th className="px-6 py-3 text-gray-400">Purchase Date</th>
                    <th className="px-6 py-3 text-gray-400">Status</th>
                    <th className="px-6 py-3 text-gray-400">User</th>
                    <th className="px-6 py-3 text-gray-400">Payment</th>
                    <th className="px-6 py-3 text-gray-400">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 text-white">{ticket.ticketCode}</td>
                      <td className="px-6 py-4 text-white">{formatDate(ticket.purchaseDate)}</td>
                      <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.status === 'active' ? 'bg-green-900 text-green-200' :
                              ticket.status === 'used' ? 'bg-blue-900 text-blue-200' :
                                'bg-red-900 text-red-200'
                          }`}>
                            {ticket.status}
                          </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{ticket.user.name}</p>
                          <p className="text-sm text-gray-400">{ticket.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">MYR {ticket.payment.amount}</p>
                          <p className="text-sm text-gray-400">{ticket.payment.paymentMethod}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            {/*<DropdownMenuItem*/}
                            {/*  className="text-green-400 focus:bg-gray-700 focus:text-green-400"*/}
                            {/*  disabled={ticket.status !== 'active'}*/}
                            {/*  onClick={() => handleStatusChange(ticket.id, 'used')}*/}
                            {/*>*/}
                            {/*  <CheckCircle className="mr-2 h-4 w-4" />*/}
                            {/*  Mark as Used*/}
                            {/*</DropdownMenuItem>*/}
                            {/*<DropdownMenuItem*/}
                            {/*  className="text-red-400 focus:bg-gray-700 focus:text-red-400"*/}
                            {/*  disabled={ticket.status === 'cancelled'}*/}
                            {/*  onClick={() => handleStatusChange(ticket.id, 'cancelled')}*/}
                            {/*>*/}
                            {/*  <XCircle className="mr-2 h-4 w-4" />*/}
                            {/*  Cancel Ticket*/}
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
                <div className="text-sm text-gray-400">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} tickets
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="border-gray-700 text-gray-200 hover:bg-gray-800"
                  >
                    Previous
                  </Button>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                      className={pagination.currentPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "border-gray-700 text-gray-200 hover:bg-gray-800"
                      }
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
                    className="border-gray-700 text-gray-200 hover:bg-gray-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
