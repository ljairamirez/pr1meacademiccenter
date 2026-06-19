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
    ["Service", data.service],
    ["Hours", data.hours],
    ["Subject / Exam / Topic", data.topic],
    ["Additional Info", data.additionalInfo],
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
      error: "Booking email is not configured yet. Please set RESEND_API_KEY in Vercel, or use Send via Email / Facebook.",
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
  const service = clean(data.service);
  const topic = clean(data.topic);

  if (!guardianName || !studentName || !service || !topic) {
    return jsonResponse({ error: "Please complete the required booking fields." }, 400);
  }

  const subject = `${studentName} - ${service}`;
  const summary = buildBookingSummary(data);
  const to = process.env.BOOKING_TO_EMAIL || "ljairamirez@gmail.com";
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
        text: `New Pr1me booking inquiry\n\n${summary}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return jsonResponse({
        error: result.message || result.error || "Booking email could not be sent.",
      }, response.status);
    }

    return jsonResponse({ ok: true, message: "Booking submitted successfully." });
  } catch {
    return jsonResponse({
      error: "Booking email is temporarily unavailable. Please use Send via Email or Facebook.",
    }, 500);
  }
}
