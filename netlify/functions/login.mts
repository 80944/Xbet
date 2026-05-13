import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { scryptSync, timingSafeEqual } from "node:crypto";

const verifyPassword = (password: string, hash: string) => {
  try {
    const [salt, key] = hash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const users = getStore({ name: "users", consistency: "strong" });
    const user = await users.get(username, { type: "json" }) as any;

    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isValid = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return new Response(JSON.stringify({ message: "Invalid username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      message: "Login successful", 
      user: { username: user.username } 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/login",
};
