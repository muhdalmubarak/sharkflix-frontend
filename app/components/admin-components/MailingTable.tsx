// app/components/admin-components/MailingTable.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn-ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn-ui/select";
import { Input } from "@/components/shadcn-ui/input";
import { Button } from "@/components/shadcn-ui/button";
import { Search, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Mailing, MailingContent } from '@/types/mailing';
import { parseMailingContent, formatDate } from '@/app/utils/mailingHelpers';

const MailingTable = () => {
  const [mailings, setMailings] = useState<Mailing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRecipientType, setSelectedRecipientType] = useState('all');

  useEffect(() => {
    loadMailings();
  }, []);

  const loadMailings = async () => {
    try {
      const response = await fetch('/api/admin/mailings');
      if (!response.ok) throw new Error('Failed to load mailings');
      const data = await response.json();
      setMailings(data);
    } catch (error) {
      console.error('Error loading mailings:', error);
    }
  };

  const getRecipientDisplay = (mailing: Mailing): string => {
    const content = parseMailingContent(mailing.content);
    if (content.groups && content.groups.length > 0) {
      return content.groups.map((group: string) =>
        group.charAt(0).toUpperCase() + group.slice(1)
      ).join(', ');
    }
    return 'Custom Emails';
  };

  const filterMailings = (): Mailing[] => {
    return mailings.filter(mailing => {
      const content = parseMailingContent(mailing.content);
      const matchesSearch =
        mailing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || mailing.status === selectedStatus;

      const matchesRecipientType = selectedRecipientType === 'all' ||
        (content.groups && content.groups.includes(selectedRecipientType));

      return matchesSearch && matchesStatus && matchesRecipientType;
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mailings</h2>
        <Link href="/admin-home/mailings/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Mailing
          </Button>
        </Link>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mailings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedRecipientType}
          onValueChange={setSelectedRecipientType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select recipient type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recipients</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="creator">Creators</SelectItem>
            <SelectItem value="affiliate">Affiliates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">№</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filterMailings().map((mailing: Mailing, index: number) => {
              const content: MailingContent = parseMailingContent(mailing.content);
              return (
                <TableRow key={mailing.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{formatDate(mailing.updatedAt)}</TableCell>
                  <TableCell>{getRecipientDisplay(mailing)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin-home/mailings/${mailing.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {content.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        mailing.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {mailing.status.charAt(0).toUpperCase() + mailing.status.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MailingTable;
