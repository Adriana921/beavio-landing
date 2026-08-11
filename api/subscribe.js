// Vercel serverless function — adds an email signup to a MailerLite audience.
// Requires these environment variables to be set in the Vercel project (Settings → Environment Variables):
//   MAILERLITE_API_KEY   Integrations → API (or Integrations → Developer API) in MailerLite → "Generate new token"
//   MAILERLITE_GROUP_ID  optional — the numeric ID of a MailerLite group (Subscribers → Groups) to add signups to.
//                         If omitted, subscribers are still created, just without a group.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const { MAILERLITE_API_KEY, MAILERLITE_GROUP_ID } = process.env;
  if (!MAILERLITE_API_KEY) {
    res.status(500).json({ error: 'Signup is not configured yet.' });
    return;
  }

  try {
    const payload = { email };
    if (MAILERLITE_GROUP_ID) payload.groups = [MAILERLITE_GROUP_ID];

    const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await mlRes.json().catch(() => ({}));

    if (!mlRes.ok) {
      res.status(mlRes.status).json({ error: data.message || 'MailerLite rejected the request.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach MailerLite.' });
  }
};
