import { Hono } from "hono";
import type { AuthPayload } from "../middleware/auth.js";

export type AppEnv = { Variables: { user: AuthPayload } };

export function createRouter() {
  return new Hono<AppEnv>();
}
