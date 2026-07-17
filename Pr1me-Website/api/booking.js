function sendJson(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.json(body);
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function parseRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function buildBookingSummary(data) {
  const fields = [
    ["Guardian Name", data.guardianName],
    ["Student Name", data.studentName],
    ["Grade Level", data.gradeLevel],
    ["School", data.school],
    ["Age", data.age],
    ["Email", data.email],
    ["Contact Number", data.contactNumber],
    ["Service", data.service],
    ["Request Type", data.requestType],
    ["Package", data.package],
    ["Mode", data.mode],
    ["Tutoring Rate", data.tutoringRate],
    ["Preferred Tutor and/or Subjects", data.preferredTutorSubjects],
    ["Preferred Schedule", data.preferredSchedule],
    ["Notes", data.notes],
    ["Uploaded File Name", data.uploadedFileName],
  ];

  return fields
    .filter(([, value]) => clean(value))
    .map(([label, value]) => `${label}: ${clean(value)}`)
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (!process.env.RESEND_API_KEY) {
    return sendJson(res, 503, {
      error: "Email submission is not configured yet. Please set RESEND_API_KEY in Vercel, or use Send via Email / Facebook.",
    });
  }

  let data;
  try {
    data = await parseRequestBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid booking request." });
  }

  const guardianName = clean(data.guardianName);
  const studentName = clean(data.studentName);
  const gradeLevel = clean(data.gradeLevel);
  const school = clean(data.school);
  const age = clean(data.age);
  const contactNumber = clean(data.contactNumber);
  const service = clean(data.service) || "One-on-One Tutoring";
  const requestType = clean(data.requestType) || "Inquiry";
  const isBooking = requestType.toLowerCase().includes("booking");
  const requestLabel = isBooking ? "Booking" : "Inquiry";
  const mode = clean(data.mode);

  if (!guardianName || !studentName || !gradeLevel || !school || !age || !contactNumber || !mode) {
    return sendJson(res, 400, { error: `Please complete the required ${requestLabel.toLowerCase()} fields.` });
  }

  const subject = `${studentName} - ${service}`;
  const summary = buildBookingSummary(data);
  const to = (process.env.BOOKING_TO_EMAIL || "ljairamirez@gmail.com,glaurenciano@gmail.com,tutorialservices.pr1me@gmail.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const from = process.env.BOOKING_FROM_EMAIL || "Pr1me Website <onboarding@resend.dev>";
  let timeout;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: `New Pr1me service ${requestLabel.toLowerCase()}\n\n${summary}\n\nPlease review this ${requestLabel.toLowerCase()} and contact the guardian for confirmation.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
            <h2 style="margin: 0 0 8px; color: #c62828;">New Pr1me Service ${escapeHtml(requestLabel)}</h2>
            <p style="margin: 0 0 16px;"><strong>${escapeHtml(subject)}</strong></p>
            <pre style="white-space: pre-wrap; background: #fff0e4; border: 1px solid #ead2ca; border-radius: 8px; padding: 14px; font-family: Arial, sans-serif;">${escapeHtml(summary)}</pre>
            <p style="margin-top: 16px; color: #4a403d;">Please review this ${escapeHtml(requestLabel.toLowerCase())} and contact the guardian for confirmation.</p>
          </div>
        `,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: result.message || result.error?.message || result.error || `${requestLabel} email could not be sent.`,
      });
    }

    return sendJson(res, 200, { ok: true, message: `${requestLabel} submitted successfully.` });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    const timeoutMessage = error.name === "AbortError"
      ? `${requestLabel} email took too long to send. Please try again, or use Send via Email / Facebook.`
      : `${requestLabel} email is temporarily unavailable. Please use Send via Email or Facebook.`;
    return sendJson(res, 500, { error: timeoutMessage });
  }
}