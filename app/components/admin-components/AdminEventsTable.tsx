'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle
} from '@/components/shadcn-ui/alert';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Eye,
  MoreVertical,
  Trash,
  Ticket,
  CheckCircle,
  XCircle,
  CreditCard
} from 'lucide-react';
import {Input} from "@/components/shadcn-ui/input";
import {Textarea} from "@/components/shadcn-ui/textarea";
import {useRouter} from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PayHalalService } from '@/services/payhalal.service';

interface Event {
  id: number;
  title: string;
  date: Date| null;
  price: number;
  totalTickets: number;
  availableTickets: number;
  status: string;
  isLive: boolean;
  description: string;
  isaffiliate: boolean;
  commissionPercentage: number;
  soldOut: boolean;
  recordingAccessCode: string | null;
  recordingUrl: string | null;
  allowRecordingAccess: boolean;
}


// View Modal Component
export const ViewEventModal = ({ event, isOpen, onClose } : { event: Event| null; isOpen: boolean; onClose: () => void }) => {
  const formatDate = (date: Date| null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-full max-w-lg mx-4 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-white">Event Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Title</h3>
              <p className="mt-1 text-white">{event?.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">Description</h3>
              <p className="mt-1 text-white">{event?.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">Date</h3>
              <p className="mt-1 text-white">{formatDate(event?.date as Date)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">Status</h3>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  event?.status === 'upcoming' ? 'bg-blue-900 text-blue-200' :
                    event?.status === 'live' ? 'bg-green-900 text-green-200' :
                      'bg-gray-800 text-gray-200'
                }`}>
                  {event?.status}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">Tickets</h3>
              <p className="mt-1 text-white">
                {event?.availableTickets} available of {event?.totalTickets} total
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Payment Modal Component
export const TestPaymentModal = ({ event, isOpen, onClose, onProceed }: {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onProceed: (email: string) => void;
}) => {
  const [email, setEmail] = useState('');

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-full max-w-lg mx-4 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-white">Test Payment for {event.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <Alert variant="default" className="bg-blue-900/20 border-blue-800">
              <AlertTitle>Test Mode</AlertTitle>
              <AlertDescription>
                This will use alternative test credentials and point to your test webhook endpoint.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-400">Test Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for testing"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                variant="default"
                onClick={() => onProceed(email)}
                disabled={!email}
              >
                Proceed to Test Payment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminEventsTable({
  events,
  onStatusChange,
  onDelete
}: {
  events: Event[];
  onStatusChange: (id: number, status: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTestPaymentModal, setShowTestPaymentModal] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Add this at the top of your component

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTestPayment = async (email: string) => {
    if (!selectedEvent) return;

    try {
      const paymentUrl = await PayHalalService.initiateTestTicketPayment({
        userEmail: email,
        eventId: selectedEvent.id,
        title: selectedEvent.title,
        price: selectedEvent.price
      });

      // Close modal
      setShowTestPaymentModal(false);

      // Notify user
      toast({
        title: "Test Payment Initialized",
        description: "Redirecting to PayHalal test payment page",
      });

      // Redirect to payment page
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Test payment initialization failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize test payment"
      });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles = {
      upcoming: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Events Table */}
      <div className="rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Tickets</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Live</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 font-medium">{event.title}</td>
                <td className="px-6 py-4">{formatDate(event.date as Date)}</td>
                <td className="px-6 py-4">MYR {event.price}</td>
                <td className="px-6 py-4">
                  {event.availableTickets} / {event.totalTickets}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="cursor-pointer"
                  >
                    <StatusBadge status={event.status} />
                  </button>
                </td>
                <td className="px-6 py-4">
                  {event.isLive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push(`/admin-home/events/${event.id}/tickets`);
                    }}
                  >
                    <Ticket className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowTestPaymentModal(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replace the old modals with new ones */}
      <ViewEventModal
        event={selectedEvent}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedEvent(null);
        }}
      />

      <TestPaymentModal
        event={selectedEvent}
        isOpen={showTestPaymentModal}
        onClose={() => {
          setShowTestPaymentModal(false);
          setSelectedEvent(null);
        }}
        onProceed={handleTestPayment}
      />
    </div>
  );
}
