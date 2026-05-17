const authJsSessionCookiePrefixes = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

const authJsSessionCookieChunkCount = 8;

type ClearCookieOptions = {
  expires: Date;
  httpOnly: boolean;
  maxAge: number;
  path: string;
  sameSite: "lax";
  secure: boolean;
};

type CookieClearingResponse = {
  cookies: {
    set: (name: string, value: string, options: ClearCookieOptions) => void;
  };
};

export function isAuthJsSessionCookieName(name: string) {
  return authJsSessionCookiePrefixes.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}.`),
  );
}

function getAuthJsSessionCookieNamesToClear() {
  return authJsSessionCookiePrefixes.flatMap((prefix) => [
    prefix,
    ...Array.from(
      { length: authJsSessionCookieChunkCount },
      (_, index) => `${prefix}.${index}`,
    ),
  ]);
}

export function clearAuthJsSessionCookies(response: CookieClearingResponse) {
  for (const name of getAuthJsSessionCookieNamesToClear()) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || name.startsWith("__"),
    });
  }
}
