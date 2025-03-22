// app/components/admin-components/MassEmailSender.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/shadcn-ui/card';
import { Input } from '@/components/shadcn-ui/input';
import { Button } from '@/components/shadcn-ui/button';
import { Textarea } from '@/components/shadcn-ui/textarea';
import { Label } from '@/components/shadcn-ui/label';
import { Checkbox } from '@/components/shadcn-ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn-ui/select";
import { CheckedState } from "@radix-ui/react-checkbox";
import {Mailing} from "@/types/mailing";
import {parseMailingContent} from "@/app/utils/mailingHelpers";
import { validateEmails } from '@/app/utils/validators';

interface MassEmailSenderProps {
  mailingId?: string;
}

interface UserGroup {
  id: string;
  label: string;
}

const MassEmailSender: React.FC<MassEmailSenderProps> = ({ mailingId }) =>{
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showCustomEmails, setShowCustomEmails] = useState(false);
  const [mailings, setMailings] = useState<Mailing[]>([]);
  const [selectedMailing, setSelectedMailing] = useState<Mailing|null>(null);
  const [showMailings, setShowMailings] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [events, setEvents] = useState<{id: number, title: string}[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const { toast } = useToast()

  const userGroups: UserGroup[] = [
    { id: 'user', label: 'Users' },
    { id: 'creator', label: 'Creators' },
    { id: 'affiliate', label: 'Affiliates' },
    { id: 'event_attendees', label: 'Event Attendees' },
  ];

  useEffect(() => {
    loadMailings();
    loadEvents();
  }, []);

  const loadMailings = async () => {
    try {
      const response = await fetch('/api/admin/mailings');
      if (!response.ok) throw new Error('Failed to load mailings');
      const data = await response.json();
      setMailings(data);
    } catch (error) {
      console.error('Error loading mailings:', error);
      toast({
        title: "Error",
        description: "Failed to load mailings",
        variant: "destructive",
      });
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events-list');
      if (!response.ok) throw new Error('Failed to load events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  };

  // Add useEffect to load specific mailing if mailingId is provided
  useEffect(() => {
    if (mailingId) {
      loadSpecificMailing(mailingId);
    }
  }, [mailingId]);

  // Add function to load specific mailing
  const loadSpecificMailing = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/mailings/${id}`);
      if (!response.ok) throw new Error('Failed to load mailing');
      const mailing = await response.json();
      handleLoadMailing(mailing);
    } catch (error) {
      console.error('Error loading specific mailing:', error);
      toast({
        title: "Error",
        description: "Failed to load mailing",
        variant: "destructive",
      });
    }
  };

  const handleLoadMailing = (mailing: Mailing) => {
    const content = parseMailingContent(mailing.content);
    setSelectedMailing(mailing);
    setTitle(mailing.title);
    setSelectedGroups(content.groups);
    setCustomEmails(content.customEmails || '');
    setSubject(content.subject);
    setContent(content.content);
    setSelectedEventId(content.eventId || ''); // Set the selected event ID
    // Set showCustomEmails based on whether customEmails exists and has content
    setShowCustomEmails(!!content.customEmails && content.customEmails.length > 0);
    setShowMailings(false);
  };

  const handleCloneMailing = async (mailingId: number) => {
    try {
      const response = await fetch('/api/admin/mailings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloneFromId: mailingId
        })
      });

      if (!response.ok) throw new Error('Failed to clone mailing');

      const clonedMailing = await response.json();
      await loadMailings();
      handleLoadMailing(clonedMailing);

      toast({
        title: "Success",
        description: "Mailing cloned successfully",
      });
    } catch (error) {
      console.error('Error cloning mailing:', error);
      toast({
        title: "Error",
        description: "Failed to clone mailing",
        variant: "destructive",
      });
    }
  };

  // Update the email input handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomEmails(value);

    // Clear error when input is empty
    if (!value.trim()) {
      setEmailError('');
      return;
    }

    // Validate emails
    const { isValid, error } = validateEmails(value);
    setEmailError(error || '');
  };

  const handleSave = async (status = 'draft') => {
    // Validate emails before saving if custom emails are enabled
    if (showCustomEmails && customEmails.trim()) {
      const { isValid, error } = validateEmails(customEmails);
      if (!isValid) {
        setEmailError(error || '');
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const mailingData = {
        id: selectedMailing?.id,
        title: title || `Mailing - ${new Date().toLocaleString()}`,
        groups: selectedGroups,
        customEmails,
        subject,
        content,
        eventId: selectedGroups.includes('event_attendees') ? selectedEventId : undefined,
        status
      };

      const response = await fetch('/api/admin/mailings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailingData)
      });

      if (!response.ok) throw new Error('Failed to save mailing');

      const savedMailing = await response.json();
      await loadMailings();
      setSelectedMailing(savedMailing);

      toast({
        title: "Success",
        description: status === 'sent' ? "Mailing sent successfully" : "Draft saved successfully",
      });
    } catch (error) {
      console.error('Error saving mailing:', error);
      toast({
        title: "Error",
        description: "Failed to save mailing",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (mailingId: number) => {
    try {
      const response = await fetch(`/api/admin/mailings?id=${mailingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete mailing');

      await loadMailings();
      if (selectedMailing?.id === mailingId) {
        setSelectedMailing(null);
        setTitle('');
        setSelectedGroups([]);
        setCustomEmails('');
        setSubject('');
        setContent('');
      }

      toast({
        title: "Success",
        description: "Mailing deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting mailing:', error);
      toast({
        title: "Error",
        description: "Failed to delete mailing",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mass Email Sender</CardTitle>
        <div className="flex space-x-2">
          <Dialog open={showMailings} onOpenChange={setShowMailings}>
            <DialogTrigger asChild>
              <Button variant="outline">Load Mailing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Saved Mailings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {mailings.map((mailing) => (
                  <div key={mailing.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <h4 className="font-medium">{mailing.title}</h4>
                      <p className="text-sm text-gray-500">
                        Status: {mailing.status} |
                        Last updated: {new Date(mailing.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadMailing(mailing)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneMailing(mailing.id)}
                      >
                        Clone
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(mailing.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-4">
            <Label>Mailing Title</Label>
            <Input
              placeholder="Enter mailing title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <Label>Select Recipients</Label>
            <div className="flex flex-col space-y-2">
              {userGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => {
                      setSelectedGroups(prev => {
                        if (prev.includes(group.id)) {
                          return prev.filter(id => id !== group.id);
                        }
                        return [...prev, group.id];
                      });
                    }}
                  />
                  <Label htmlFor={group.id}>{group.label}</Label>
                </div>
              ))}
              {selectedGroups.includes('event_attendees') && (
                <div className="mt-2 ml-6">
                  <Label>Select Event</Label>
                  <Select
                    value={selectedEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customEmails"
                checked={showCustomEmails}
                onCheckedChange={(checked: CheckedState) => {
                  setShowCustomEmails(checked as boolean);
                }}
              />
              <Label htmlFor="customEmails">Add Custom Email Addresses</Label>
            </div>

            {showCustomEmails && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter email addresses separated by commas"
                  value={customEmails}
                  onChange={handleEmailChange}
                  className={`w-full ${emailError ? 'border-red-500' : ''}`}
                />
                {emailError && (
                  <p className="text-sm text-red-500">
                    {emailError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Email Subject</Label>
            <Input
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <Label>Email Content</Label>
            <Textarea
              placeholder="Enter email content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4">
        {selectedMailing?.status === 'sent' && (
          <Button variant="secondary" onClick={() => handleCloneMailing(selectedMailing.id)}>
            Clone Sent Email
          </Button>
        )}
        <Button variant="outline" onClick={() => handleSave('draft')}>
          Save Draft
        </Button>
        <Button
          onClick={() => handleSave('sent')}
          disabled={!subject || !content || (!selectedGroups.length && !customEmails)}
        >
          Send Email
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MassEmailSender;
