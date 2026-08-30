export const CHAT_SESSION_COOKIE = "apfel-chat-session";
export const CHAT_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const getChatSessionCookieOptions = (nodeEnv = process.env.NODE_ENV) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: nodeEnv === "production",
  path: "/",
  maxAge: CHAT_SESSION_MAX_AGE_SECONDS,
});
