import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createUser, deleteUser, listUsers, updateUser } from "@/lib/users";

const ensureAdmin = async (request: NextRequest) => {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) {
    return { ok: false as const, response: csrf };
  }

  return { ok: true as const };
};

export async function GET(_request: NextRequest) {
  const auth = await ensureAdmin(_request);
  if (!auth.ok) return auth.response;

  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await createUser({
      email: body.email,
      password: body.password,
      role: body.role ?? "product_editor",
    });

    if (!user) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Create user failed:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: string;
      email?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await updateUser(body.id, {
      email: body.email,
      password: body.password || undefined,
      role: body.role,
      isActive: body.isActive,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user failed:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const success = await deleteUser(id);
    if (!success) {
      return NextResponse.json(
        { error: "User not found or cannot be deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user failed:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
