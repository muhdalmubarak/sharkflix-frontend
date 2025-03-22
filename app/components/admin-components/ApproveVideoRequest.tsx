"use client";
import prisma from "../../utils/db";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn-ui/table";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react"; // Assuming you're using Lucide icons
import { getAllCreators } from "@/app/action";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

// Define the shape of the user data
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  request_approved?: boolean;
}

const ApproveVideoRequest = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({}); // Track loading state per user
  const fetchUsers = async () => {
    try {
      const data = await getAllCreators();

      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search logic
  useEffect(() => {
    if (Array.isArray(users)) {
      const filteredData = users.filter((user) =>
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filteredData);
    }
  }, [searchTerm, users]);

  // Handle Approve action
  const handleApprove = async (id: any) => {
    try {
      setLoading((prev) => ({ ...prev, [id]: true })); // Set loading for specific user

      const res = await fetch(`/api/approve-decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          request_approved: true,
        }),
      });

      if (res.ok) {
        console.log(`Approved user with ID: ${id}`);
        reloadPage(id);
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false })); // Reset loading for specific user
    }
  };

  // Handle Decline action
  const handleDecline = async (id: any) => {
    try {
      setLoading((prev) => ({ ...prev, [id]: true })); // Set loading for specific user

      const res = await fetch(`/api/approve-decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          request_approved: false,
        }),
      });

      if (res.ok) {
        console.log(`Declined user with ID: ${id}`);
        reloadPage(id);
      }
    } catch (error) {
      console.error("Error declining user:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false })); // Reset loading for specific user
    }
  };

  // Function to reload the page
  const reloadPage = (id: any) => {
    setLoading((prev) => ({ ...prev, [id]: false }));
    fetchUsers();
  };

  return (
    <div className="container mx-auto p-4">
      {/* Search Input */}
      <Input
        type="text"
        className="border text-white rounded p-2 mb-4 "
        placeholder="Search by email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Label className="text-red-800" >"Note: Once approved, the user will be able to upload videos larger than 50MB."</Label>
      {/* User Table */}
      {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead className="hide" >ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.request_approved ? (
                    <span className="flex items-center text-sm font-medium text-white dark:text-white me-3">
                      <span className="flex w-2.5 h-2.5 bg-green-600 rounded-full me-1.5 flex-shrink-0"></span>
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center text-sm font-medium text-white dark:text-white me-3">
                    <span className="flex w-2.5 h-2.5 bg-yellow-600 rounded-full me-1.5 flex-shrink-0"></span>
                    Pendding
                  </span>
                  )}
                </TableCell>
                <TableCell>
                  {!user.request_approved ? (
                    <Button
                      className="mr-2"
                      variant="secondary"
                      onClick={() => handleApprove(user.id)}
                      disabled={loading[user.id]} // Disable if loading for this user
                    >
                      {loading[user.id] ? (
                        <Loader className="mr-2 animate-spin" /> // Loader icon
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="ml-2"
                      variant="destructive"
                      onClick={() => handleDecline(user.id)}
                      disabled={loading[user.id]} // Disable if loading for this user
                    >
                      {loading[user.id] ? (
                        <Loader className="mr-2 animate-spin" /> // Loader icon
                      ) : (
                        "Decline"
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No record found.</p>
      )}
    </div>
  );
};

export default ApproveVideoRequest;
