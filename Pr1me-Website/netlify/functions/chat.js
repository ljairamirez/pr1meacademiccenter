const PR1ME_CONTEXT = `
Pr1me Tutorial Services is a tutorial center at 88 Maginhawa, Teacher's Village, Diliman, Quezon City.
Contact links: Facebook page https://www.facebook.com/PR1ME.ts/ and email tutorialservices.pr1me@gmail.com.
Services offered:
- One-on-One Tutorial: personalized sessions for homework help, assessments, advance lessons, and guided practice. Online, Face-to-Face, or Hybrid.
- Study-Buddy Tutoring: pair or two-student sessions for selected subjects. Online, Face-to-Face, or Hybrid.
- PSHS Regular Group Tutoring: scheduled online group tutoring aligned with PSHS curriculum. Registration link: https://forms.gle/hq6tTxyBT85ncFT2A
- Regular Group Tutorial: curriculum-based shared sessions for classmates or same-level learners. Online, Face-to-Face, or Hybrid.
- Examination Reviews: focused group review sessions for midterm exams, periodical exams, and other summative assessments. Online or Face-to-Face.
- DOST-SEI Review: focused group review sessions for the Undergraduate DOST-SEI Scholarship Examination. Online or Face-to-Face.
- Booster Program: review program covering foundational topics to help students prepare for specialization years. Online.
- Level Enhancement and Advancement Program (LEAP): advancement program introducing incoming grade-level lessons. Hybrid.
Inquiry: users can go to the Services page and click Inquiry. Booking: users can open booking.html for booking options, inquire on Facebook, choose One-on-One Tutoring, or join Regular Group Tutoring through https://forms.gle/hq6tTxyBT85ncFT2A.
Teachers and subjects include Teacher Gina, Teacher IMG, Teacher Dean, Teacher Jam B., Teacher Lloyd, Teacher Nicko, Teacher Triz, Teacher Claire, Teacher Akhi, Teacher Philipp, Teacher Kristina, Teacher Joshua, Teacher Mitchie, Teacher Steph, Teacher Cedie, and Teacher Saree as listed on the Tutors page.
`;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function getOutputText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(503, {
      error: "AI chat is not configured yet. Please set OPENAI_API_KEY in Netlify environment variables.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid request body." });
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const cleanMessages = messages
    .filter((message) => message && typeof message.content === "string")
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.slice(0, 900),
    }));

  if (!cleanMessages.length) {
    return jsonResponse(400, { error: "Please send a question." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `You are the friendly website chat assistant for Pr1me Tutorial Services.
Answer only questions about Pr1me, its services, tutors, location, booking, contact details, and study programs.
Use the context below as your source of truth. If the answer is not in the context, say you are not sure and suggest contacting Pr1me on Facebook or using the inquiry form.
Keep answers concise, warm, and helpful. Do not invent prices, availability, policies, or tutor details.

${PR1ME_CONTEXT}`,
        input: cleanMessages
          .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
          .join("\n"),
        max_output_tokens: 260,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data.error?.message || "The AI chat could not respond right now.",
      });
    }

    return jsonResponse(200, {
      reply: getOutputText(data) || "I am not sure about that yet. Please contact Pr1me for help.",
    });
  } catch {
    return jsonResponse(500, {
      error: "The AI chat is temporarily unavailable. Please try again later.",
    });
  }
};
