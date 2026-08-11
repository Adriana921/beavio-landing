// Vercel serverless function — adds an email signup to a Mailchimp audience.
// Requires these environment variables to be set in the Vercel project (Settings → Environment Variables):
//   MAILCHIMP_API_KEY       e.g. abc123def456...-us21 (the "-us21" suffix is the server prefix)
//   MAILCHIMP_LIST_ID       the Audience ID, found in Mailchimp under Audience → Settings → Audience name and defaults
//   MAILCHIMP_SERVER_PREFIX e.g. us21 (matches the suffix on the API key)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, source } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX } = process.env;
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
    res.status(500).json({ error: 'Signup is not configured yet.' });
    return;
  }

  try {
    const mcRes = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          tags: typeof source === 'string' && source ? [source] : [],
        }),
      }
    );

    const data = await mcRes.json();

    if (!mcRes.ok) {
      // Someone signing up twice shouldn't see an error.
      if (data.title === 'Member Exists') {
        res.status(200).json({ ok: true });
        return;
      }
      res.status(mcRes.status).json({ error: data.detail || 'Mailchimp rejected the request.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Mailchimp.' });
  }
}
