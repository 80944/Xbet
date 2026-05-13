import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { scryptSync, randomBytes } from "node:crypto";

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { username, phoneNumber, email, password } = await req.json();

    if (!username || !phoneNumber || !email || !password) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const users = getStore({ name: "users", consistency: "strong" });
    
    // Check if user exists by username
    const existingUser = await users.get(username, { type: "json" });

    if (existingUser) {
      return new Response(JSON.stringify({ message: "Username already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Ideally, we should also check if email exists. Since we're using a key-value store,
    // we would need a secondary index or scan. For simplicity, we just check username as the primary key.
    
    const passwordHash = hashPassword(password);

    await users.setJSON(username, {
      username,
      phoneNumber,
      email,
      passwordHash
    });

    return new Response(JSON.stringify({ 
      message: "Registration successful", 
      user: { username } 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/register",
};
