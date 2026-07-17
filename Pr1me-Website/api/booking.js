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

function getPlainEmailText(data, meta) {
  const requestDetails = `${meta.requestLabel} Details:`;
  const fields = [
    ["Service", data.service],
    ["Request Type", data.requestType],
    ["Student's Name", data.studentName],
    ["Grade Level", data.gradeLevel],
    ["School", data.school],
    ["Age", data.age],
    ["Guardian", data.guardianName],
    ["Email", data.email],
    ["Contact Number", data.contactNumber],
    ["Package", data.package],
    ["Mode", data.mode],
    ["Tutoring Rate", data.tutoringRate],
    ["Terms Approved", data.termsApproved],
    ["Preferred Tutor and/or Subjects", data.preferredTutorSubjects],
    ["Preferred Schedule", data.preferredSchedule],
    ["Notes", data.notes],
    ["Attachment / Additional Documents", data.uploadedFileName],
  ];

  const lines = [meta.subject, "", requestDetails];
  fields.forEach(([label, value]) => {
    if (clean(value)) lines.push(`${label}: ${clean(value)}`);
  });

  lines.push("", `Please review this ${meta.requestLabel.toLowerCase()} and contact the guardian for confirmation.`);
  return lines.join("\n");
}

function buildBookingSummary(data) {
  return getPlainEmailText(data, {
    subject: `${clean(data.studentName)} - ${clean(data.service) || "One-on-One Tutoring"}`,
    requestLabel: clean(data.requestType).toLowerCase().includes("booking") ? "Booking" : "Inquiry",
  });
}
function getSheetPayload(data, meta) {
  const submittedAt = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    submittedAt,
    title: meta.subject,
    requestLabel: meta.requestLabel,
    guardianName: clean(data.guardianName),
    studentName: clean(data.studentName),
    gradeLevel: clean(data.gradeLevel),
    school: clean(data.school),
    age: clean(data.age),
    email: clean(data.email),
    contactNumber: clean(data.contactNumber),
    service: clean(data.service),
    requestType: clean(data.requestType),
    package: clean(data.package),
    mode: clean(data.mode),
    tutoringRate: clean(data.tutoringRate),
    preferredTutorSubjects: clean(data.preferredTutorSubjects),
    preferredSchedule: clean(data.preferredSchedule),
    notes: clean(data.notes),
    uploadedFileName: clean(data.uploadedFileName),
    termsApproved: clean(data.termsApproved),
  };
}

async function saveToGoogleSheets(data, meta) {
  const webhookUrl = clean(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
  if (!webhookUrl) return { ok: false, skipped: true };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(getSheetPayload(data, meta)),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || "Google Sheets log could not be saved.");
  }

  return { ok: true };
}

function buildRows(rows) {
  return rows
    .map(([label, value]) => {
      const displayValue = clean(value) || "-";
      return `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(displayValue).replace(/\n/g, "<br>")}</td>
        </tr>
      `;
    })
    .join("");
}

function buildEmailHtml(data, meta) {
  const submittedAt = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const termsApproved = clean(data.termsApproved).toLowerCase() === "yes" || meta.isBooking;
  const termsLink = "https://pr1metutorialservices.vercel.app/Assets/Pr1me_TandC.pdf";

  const studentRows = [
    ["Student's Name", data.studentName],
    ["Grade Level", data.gradeLevel],
    ["School", data.school],
    ["Age", data.age],
  ];
  const guardianRows = [
    ["Guardian", data.guardianName],
    ["Email", data.email],
    ["Contact Number", data.contactNumber],
  ];
  const sessionRows = [
    ["Service", data.service],
    ["Request Type", data.requestType],
    ["Package", data.package],
    ["Mode", data.mode],
    ["Tutoring Rate", data.tutoringRate],
    ["Downpayment", meta.isBooking ? "PHP 2,000" : "Not required for inquiry"],
  ];
  const tutorRows = [
    ["Preferred Tutor's Name and/or Subjects", data.preferredTutorSubjects],
    ["Preferred Schedule", data.preferredSchedule],
    ["Notes", data.notes],
    ["Attachment / Additional Documents", data.uploadedFileName],
  ];

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      @media print {
        .page-break { page-break-before: always; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f7eee8; font-family: Arial, Helvetica, sans-serif; color:#231815;">
    <div style="max-width:820px; margin:0 auto; padding:24px;">
      <section style="background:#fffaf6; border:1px solid #e9c9bd; border-radius:14px; overflow:hidden; box-shadow:0 10px 28px rgba(90,36,24,0.12);">
        <div style="background:linear-gradient(90deg,#261512,#9b211c,#ff7618); color:#fff; padding:20px 24px;">
          <p style="margin:0 0 4px; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#ffe1ce;">Pr1me Tutorial Services</p>
          <h1 style="margin:0; font-size:28px; line-height:1.15;">${escapeHtml(meta.requestLabel)} Enrollment Form</h1>
          <p style="margin:8px 0 0; font-size:13px; color:#ffeadd;">Submitted: ${escapeHtml(submittedAt)} | ${escapeHtml(meta.subject)}</p>
        </div>

        <div style="padding:22px 24px;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#fff0e4; color:#9b211c; font-weight:800; font-size:13px; margin-bottom:16px;">Page 1: Enrollment Details</div>
          <h2 style="margin:0 0 10px; color:#c62828; font-size:18px;">Student Information</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-bottom:18px;">${buildRows(studentRows)}</table>

          <h2 style="margin:0 0 10px; color:#c62828; font-size:18px;">Guardian / Contact Information</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-bottom:18px;">${buildRows(guardianRows)}</table>

          <h2 style="margin:0 0 10px; color:#c62828; font-size:18px;">Session and Payment Details</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-bottom:18px;">${buildRows(sessionRows)}</table>

          <h2 style="margin:0 0 10px; color:#c62828; font-size:18px;">Tutor, Schedule, and Notes</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${buildRows(tutorRows)}</table>
        </div>
      </section>

      <section class="page-break" style="margin-top:22px; background:#fffaf6; border:1px solid #e9c9bd; border-radius:14px; overflow:hidden; box-shadow:0 10px 28px rgba(90,36,24,0.12);">
        <div style="background:linear-gradient(90deg,#261512,#9b211c,#ff7618); color:#fff; padding:18px 24px;">
          <p style="margin:0 0 4px; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#ffe1ce;">Page 2</p>
          <h2 style="margin:0; font-size:24px; line-height:1.15;">Terms and Conditions Approval</h2>
        </div>
        <div style="padding:22px 24px;">
          <div style="border:2px solid ${termsApproved ? "#2f7d32" : "#c62828"}; background:${termsApproved ? "#edf7ed" : "#fff0e4"}; border-radius:12px; padding:16px; margin-bottom:16px;">
            <p style="margin:0; font-size:17px; font-weight:900; color:${termsApproved ? "#2f7d32" : "#c62828"};">${termsApproved ? "Approved" : "Not marked as approved"}</p>
            <p style="margin:8px 0 0; line-height:1.55;">The sender ${termsApproved ? "confirmed" : "has not confirmed"} that they viewed and approved Pr1me Tutorial Services' Terms and Conditions before submitting this ${escapeHtml(meta.requestLabel.toLowerCase())}.</p>
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-bottom:18px;">
            ${buildRows([
              ["Terms Approval Checkbox", termsApproved ? "I have viewed and approved the Terms and Conditions." : "Not approved / not required for inquiry"],
              ["Approval Recorded", termsApproved ? submittedAt : "-"],
              ["Terms File", termsLink],
            ])}
          </table>

          <p style="margin:0 0 10px; font-weight:800; color:#9b211c;">Official Terms and Conditions PDF</p>
          <p style="margin:0; line-height:1.6;">View the full file here: <a href="${termsLink}" style="color:#c62828; font-weight:800;">${termsLink}</a></p>
        </div>
      </section>
    </div>
  </body>
</html>`;
}

const tableCss = `
  th { width: 34%; text-align: left; vertical-align: top; padding: 10px 12px; border: 1px solid #eed4c8; background: #fff0e4; color: #5a2a20; font-size: 13px; }
  td { text-align: left; vertical-align: top; padding: 10px 12px; border: 1px solid #eed4c8; background: #ffffff; color: #231815; font-size: 14px; line-height: 1.45; }
`;

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
  const blockedRecipient = "glaurenciano@gmail.com";
  const uniqueEmails = (emails) => {
    const seen = new Set();
    return emails
      .map((email) => clean(email))
      .filter(Boolean)
      .filter((email) => {
        const key = email.toLowerCase();
        if (key === blockedRecipient || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };
  const to = uniqueEmails([process.env.BOOKING_TO_EMAIL || "tutorialservices.pr1me@gmail.com"]);
  const bcc = uniqueEmails([process.env.BOOKING_BCC_EMAIL || "ljairamirez@gmail.com"]).filter(
    (email) => !to.some((recipient) => recipient.toLowerCase() === email.toLowerCase())
  );
  const cc = uniqueEmails([data.email]).filter(
    (email) => !to.some((recipient) => recipient.toLowerCase() === email.toLowerCase())
      && !bcc.some((recipient) => recipient.toLowerCase() === email.toLowerCase())
  );
  const attachment = data.attachment && clean(data.attachment.content) && clean(data.attachment.filename)
    ? [{
        filename: clean(data.attachment.filename),
        content: clean(data.attachment.content),
        content_type: clean(data.attachment.contentType) || "application/octet-stream",
      }]
    : [];
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
        ...(cc.length ? { cc } : {}),
        ...(bcc.length ? { bcc } : {}),
        subject,
        text: getPlainEmailText(data, { requestLabel, subject }),
        ...(attachment.length ? { attachments: attachment } : {}),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerError = result.message || result.error?.message || result.error || `${requestLabel} email could not be sent.`;
      const publicError = /api\s*key|unauthorized|invalid/i.test(String(providerError))
        ? "Email submission is not configured correctly yet. Please use Send via Email or Inquire on Facebook while Pr1me fixes the email sender."
        : providerError;

      return sendJson(res, response.status, { error: publicError });
    }

    const sheetsResult = await saveToGoogleSheets(data, { requestLabel, subject, isBooking }).catch((error) => ({ ok: false, error: error.message }));
    return sendJson(res, 200, {
      ok: true,
      message: `${requestLabel} submitted successfully.`,
      sheetsSaved: Boolean(sheetsResult.ok),
    });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    const timeoutMessage = error.name === "AbortError"
      ? `${requestLabel} email took too long to send. Please try again, or use Send via Email / Facebook.`
      : `${requestLabel} email is temporarily unavailable. Please use Send via Email or Facebook.`;
    return sendJson(res, 500, { error: timeoutMessage });
  }
}







