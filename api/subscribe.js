// Waitlist endpoint — Vercel serverless function.
//
// Adds a submitted email to Resend's account-level contacts (the current
// Resend model: POST /contacts, no audience ID). The API key is a secret, so
// this must run server-side; the form posts same-origin to /api/subscribe,
// which keeps the site's strict CSP (form-action 'self') intact.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY         — required; from https://resend.com/api-keys
//   WAITLIST_NOTIFY_EMAIL  — optional; if set, each signup also sends a
//                            heads-up email there (from waitlist@bettertuner.com,
//                            which works because the domain is verified in Resend)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  // Non-JS browsers submit as a regular form POST and expect a page back.
  const wantsHtml = String(req.headers.accept || "").includes("text/html");
  const finish = (status, payload, redirect) => {
    if (wantsHtml) return res.redirect(303, redirect);
    return res.status(status).json(payload);
  };

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();

  // Honeypot: real users never fill this field. Pretend success for bots.
  if (String(body.company || "").length > 0) {
    return finish(200, { ok: true }, "/?joined=1#download");
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return finish(400, { error: "Enter a valid email address." }, "/?joined=0#download");
  }

  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) {
    return finish(500, { error: "Waitlist isn't configured yet — please try again later." }, "/?joined=0#download");
  }

  try {
    const r = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    // 409 = already a contact; that's a success from the visitor's view.
    if (!r.ok && r.status !== 409) {
      return finish(502, { error: "Couldn't join the list right now — please try again." }, "/?joined=0#download");
    }

    // Optional heads-up to the owner. Best-effort: a failure here must never
    // break the signup, so errors are swallowed. Awaited because serverless
    // runtimes may freeze pending work once the response is sent.
    const notify = process.env.WAITLIST_NOTIFY_EMAIL;
    if (notify) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "BetterTuner Waitlist <waitlist@bettertuner.com>",
            to: [notify],
            subject: `New waitlist signup: ${email}`,
            text: `${email} just joined the BetterTuner waitlist.\n\nAll contacts: https://resend.com/audiences`,
          }),
        });
      } catch {}
    }

    return finish(200, { ok: true }, "/?joined=1#download");
  } catch {
    return finish(502, { error: "Couldn't join the list right now — please try again." }, "/?joined=0#download");
  }
}
