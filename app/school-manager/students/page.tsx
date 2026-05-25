import { getStudentsWithAccountStatus } from "@/app/actions/users";
import { StudentsClient } from "./students-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Accounts | School Manager",
  description: "Create and manage student login accounts.",
};

export default async function StudentsPage() {
  const students = await getStudentsWithAccountStatus();

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Create login accounts for students so they can view and pay their fees online.
        </p>
      </div>
      <StudentsClient students={students} />
    </div>
  );
}
