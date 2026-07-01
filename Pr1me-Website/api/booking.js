function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function clean(value) {
  return String(value || "").trim();
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

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({});
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!process.env.RESEND_API_KEY) {
    return jsonResponse({
      error: "Email submission is not configured yet. Please set RESEND_API_KEY in Vercel, or use Send via Email / Facebook.",
    }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid booking request." }, 400);
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
    return jsonResponse({ error: `Please complete the required ${requestLabel.toLowerCase()} fields.` }, 400);
  }

  const subject = `${studentName} - ${service}`;
  const summary = buildBookingSummary(data);
  const to = (process.env.BOOKING_TO_EMAIL || "ljairamirez@gmail.com,glaurenciano@gmail.com,tutorialservices.pr1me@gmail.com").split(",").map((email) => email.trim()).filter(Boolean);
  const from = process.env.BOOKING_FROM_EMAIL || "Pr1me Website <onboarding@resend.dev>";

  try {
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
            <h2 style="margin: 0 0 8px; color: #c62828;">New Pr1me Service ${requestLabel}</h2>
            <p style="margin: 0 0 16px;"><strong>${subject}</strong></p>
            <pre style="white-space: pre-wrap; background: #fff0e4; border: 1px solid #ead2ca; border-radius: 8px; padding: 14px; font-family: Arial, sans-serif;">${summary}</pre>
            <p style="margin-top: 16px; color: #4a403d;">Please review this ${requestLabel.toLowerCase()} and contact the guardian for confirmation.</p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return jsonResponse({
        error: result.message || result.error || `${requestLabel} email could not be sent.`,
      }, response.status);
    }

    return jsonResponse({ ok: true, message: `${requestLabel} submitted successfully.` });
  } catch {
    return jsonResponse({
      error: `${requestLabel} email is temporarily unavailable. Please use Send via Email or Facebook.`,
    }, 500);
  }
}

