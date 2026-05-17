import { describe, expect, it } from "vitest";

import { startCampaignGoogleSignIn } from "@/components/admin/acquisition-public-flow";

describe("campaign Google sign-in flow", () => {
  it("clears the current Auth.js session before opening Google", async () => {
    const calls: string[] = [];

    const result = await startCampaignGoogleSignIn({
      createIntent: async () =>
        new Response(
          JSON.stringify({ callbackUrl: "/a/omdx-site/completar" }),
          { status: 201 },
        ),
      signInWithGoogle: async (callbackUrl) => {
        calls.push(`signIn:${callbackUrl}`);
      },
      signOutCurrentSession: async () => {
        calls.push("signOut");
      },
      slug: "omdx-site",
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual(["signOut", "signIn:/a/omdx-site/completar"]);
  });

  it("falls back to the campaign completion URL when the intent response omits callbackUrl", async () => {
    const calls: string[] = [];

    await startCampaignGoogleSignIn({
      createIntent: async () => new Response(JSON.stringify({ ok: true })),
      signInWithGoogle: async (callbackUrl) => {
        calls.push(callbackUrl);
      },
      signOutCurrentSession: async () => undefined,
      slug: "omdx-site",
    });

    expect(calls).toEqual(["/a/omdx-site/completar"]);
  });
});
