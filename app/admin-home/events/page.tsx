"use client";

import React, { useEffect, useState } from 'react';
import AdminEventsTable from '@/app/components/admin-components/AdminEventsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn-ui/alert';
import { Button } from '@/components/ui/button';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch events');

      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setSuccessMessage('Event status updated successfully');
      await fetchEvents();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (eventId: number) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      setSuccessMessage('Event deleted successfully');
      await fetchEvents();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Management</h1>
        {/*<Button*/}
        {/*  onClick={() => /!* Add navigation to create event page *!/}*/}
        {/*  className="bg-blue-600 hover:bg-blue-700 text-white"*/}
        {/*>*/}
        {/*  Create New Event*/}
        {/*</Button>*/}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : events.length === 0 ? (
        // Empty State
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first event.</p>
          <Button
            onClick={() => {/* Add navigation to create event page */}}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create New Event
          </Button>
        </div>
      ) : (
        // Events Table
        <AdminEventsTable
          events={events}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
