import { createAdminServerClient } from "@/lib/admin-auth-server";
import { isAdminUser } from "@/lib/admin-auth";
import { listUsers } from "@/lib/users";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    redirect("/admin");
  }

  const users = await listUsers();

  return <UsersClient users={users} />;
}
