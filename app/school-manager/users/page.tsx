import { getAllUsers } from "@/app/actions/users";
import { UsersClient } from "./users-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | School Manager",
  description: "Manage system users, assign roles, and handle bans.",
};

export default async function UsersPage() {
  const users = await getAllUsers();

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Assign roles to system users and manage access.
        </p>
      </div>

      <UsersClient initialUsers={users} />
    </div>
  );
}
