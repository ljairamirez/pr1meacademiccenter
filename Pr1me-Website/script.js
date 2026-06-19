const assetExtensions = ["png", "jpg", "jpeg", "webp"];

const siteLoader = document.querySelector("[data-site-loader]");

function getIntroSeen() {
  try {
    return window.sessionStorage.getItem("pr1meIntroSeen") === "true";
  } catch {
    return false;
  }
}

function setIntroSeen() {
  try {
    window.sessionStorage.setItem("pr1meIntroSeen", "true");
  } catch {
    return;
  }
}

function closeSiteLoader() {
  if (!siteLoader) return;
  siteLoader.classList.add("is-hidden");
  document.body.classList.remove("loader-active");
  setIntroSeen();
}

if (siteLoader) {
  const introSeen = getIntroSeen();

  if (introSeen) {
    closeSiteLoader();
  } else {
    document.body.classList.add("loader-active");
    window.setTimeout(closeSiteLoader, 2300);
  }
}

function loadAssetImage(img, baseName, onFound, onMissing) {
  let index = 0;

  function tryNext() {
    if (index >= assetExtensions.length) {
      if (onMissing) onMissing();
      return;
    }
    const candidate = `Assets/${baseName}.${assetExtensions[index]}`;
    index += 1;

    const testImage = new Image();
    testImage.onload = () => {
      img.src = candidate;
      img.hidden = false;
      img.parentElement?.classList.add("asset-loaded");
      img.parentElement?.classList.remove("asset-missing");
      const fallback = img.parentElement?.querySelector(".photo-fallback");
      if (fallback) fallback.hidden = true;
      if (onFound) onFound(candidate);
    };
    testImage.onerror = tryNext;
    testImage.src = candidate;
  }

  tryNext();
}

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const currentPage = document.body.dataset.page;

document.querySelectorAll("[data-page-link]").forEach((link) => {
  link.classList.toggle("active", link.dataset.pageLink === currentPage);
});

document.querySelectorAll("[data-asset-image]").forEach((img) => {
  const names = [img.dataset.assetImage, ...(img.dataset.assetFallback || "").split(",")]
    .map((name) => name.trim())
    .filter(Boolean);
  let index = 0;

  function tryName() {
    if (index >= names.length) {
      const slot = img.parentElement;
      slot?.classList.add("asset-missing");
      if (slot?.parentElement) slot.parentElement.appendChild(slot);
      return;
    }
    const baseName = names[index];
    index += 1;
    loadAssetImage(img, baseName, null, tryName);
  }

  tryName();
});

const revealItems = document.querySelectorAll(
  ".section, .promo-card, .package-card, .tutor-card, .feedback-card, .feedback-photo"
);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach((item) => {
    item.classList.add("reveal-on-scroll");
    revealObserver.observe(item);
  });

  window.setTimeout(() => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }, 900);
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const tutorSearch = document.querySelector("#tutorSearch");
const tutorSort = document.querySelector("#tutorSort");
const tutorGrid = document.querySelector("[data-tutor-grid]");
const tutorCards = [...document.querySelectorAll(".tutor-card")];

tutorCards.forEach((card, index) => {
  const tutorName = card.querySelector("h3")?.textContent.trim() || "";
  const nickname = tutorName.replace(/^Teacher\s+/i, "").trim() || tutorName;
  card.dataset.originalIndex = String(index);
  card.dataset.sortName = nickname.toLowerCase();
});

if (tutorSearch && tutorGrid) {
  tutorSearch.addEventListener("input", () => {
    const query = tutorSearch.value.trim().toLowerCase();
    tutorCards.forEach((card) => {
      card.hidden = query && !card.dataset.search.includes(query);
    });
  });
}

if (tutorSort && tutorGrid) {
  tutorSort.addEventListener("change", () => {
    const sortValue = tutorSort.value;
    const sortedCards = [...tutorCards].sort((firstCard, secondCard) => {
      if (sortValue === "default") {
        return Number(firstCard.dataset.originalIndex) - Number(secondCard.dataset.originalIndex);
      }

      const direction = sortValue === "za" ? -1 : 1;
      const firstIsPlaceholder = /^\d/.test(firstCard.dataset.sortName);
      const secondIsPlaceholder = /^\d/.test(secondCard.dataset.sortName);

      if (firstIsPlaceholder !== secondIsPlaceholder) {
        return firstIsPlaceholder ? 1 : -1;
      }

      return firstCard.dataset.sortName.localeCompare(secondCard.dataset.sortName, undefined, {
        numeric: true,
        sensitivity: "base",
      }) * direction;
    });

    sortedCards.forEach((card) => tutorGrid.appendChild(card));
  });
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (tutorGrid) {
      tutorGrid.classList.toggle("list-view", button.dataset.view === "list");
    }
  });
});

const packageCards = [...document.querySelectorAll("[data-package]")];

document.querySelectorAll("[data-package-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.packageFilter;
    document.querySelectorAll("[data-package-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    packageCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.package !== filter;
    });
  });
});

const bookingPanel = document.querySelector("#booking");
const openBookingButton = document.querySelector("[data-open-booking]");
const bookingBackButton = document.querySelector("[data-booking-back]");
const bookingForm = document.querySelector("[data-booking-form]");
const emailBookingButton = document.querySelector("[data-email-booking]");
const facebookBookingButton = document.querySelector("[data-facebook-booking]");
const isNetlifyHost = window.location.hostname.includes("netlify");
const useVercelBooking = !isNetlifyHost && window.location.protocol !== "file:";

function showBookingPanel() {
  if (!bookingPanel) return;
  bookingPanel.hidden = false;
  bookingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideBookingPanel() {
  if (!bookingPanel) return;
  bookingPanel.hidden = true;
  document.querySelector(".packages-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getBookingSummary(form) {
  const title = updateBookingSubmissionTitle(form);
  const summaryLines = [title || "Pr1me Tutorial Services Booking Inquiry"];
  const fields = form.querySelectorAll("[data-summary-label]");

  fields.forEach((field) => {
    const label = field.dataset.summaryLabel;
    let value = field.value?.trim();

    if (field.type === "file") {
      value = field.files?.[0]?.name || "";
    }

    if (value) {
      summaryLines.push(`${label}: ${value}`);
    }
  });

  return summaryLines.join("\n");
}

function getBookingPayload(form) {
  return {
    guardianName: form.querySelector('[name="guardian-name"]')?.value.trim() || "",
    studentName: form.querySelector('[name="student-name"]')?.value.trim() || "",
    service: form.querySelector('[name="service"]')?.value.trim() || "",
    hours: form.querySelector('[name="hours"]')?.value.trim() || "",
    topic: form.querySelector('[name="topic-needed"]')?.value.trim() || "",
    additionalInfo: form.querySelector('[name="additional-info"]')?.value.trim() || "",
    uploadedFileName: form.querySelector('[name="topic-coverage"]')?.files?.[0]?.name || "",
  };
}

function updateBookingSubmissionTitle(form) {
  if (!form) return "";

  const student = form.querySelector('[name="student-name"]')?.value.trim();
  const service = form.querySelector('[name="service"]')?.value.trim();
  const title = [student, service].filter(Boolean).join(" - ");
  const titleField = form.querySelector("[data-submission-title]");

  if (titleField) {
    titleField.value = title;
  }

  return title;
}

if (openBookingButton) {
  openBookingButton.addEventListener("click", showBookingPanel);
}

if (bookingBackButton) {
  bookingBackButton.addEventListener("click", hideBookingPanel);
}

if (bookingForm) {
  bookingForm.addEventListener("input", () => updateBookingSubmissionTitle(bookingForm));
  bookingForm.addEventListener("change", () => updateBookingSubmissionTitle(bookingForm));
  bookingForm.addEventListener("submit", async (event) => {
    updateBookingSubmissionTitle(bookingForm);

    if (!useVercelBooking) return;

    event.preventDefault();

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "Submit";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getBookingPayload(bookingForm)),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking could not be submitted.");
      }

      alert("Booking submitted successfully.");
      bookingForm.reset();
      updateBookingSubmissionTitle(bookingForm);
    } catch (error) {
      alert(`${error.message}\n\nYou can still use Send via Email or Inquire on Facebook.`);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

if (emailBookingButton && bookingForm) {
  emailBookingButton.addEventListener("click", () => {
    if (!bookingForm.reportValidity()) return;

    const summary = getBookingSummary(bookingForm);
    const subject = encodeURIComponent(updateBookingSubmissionTitle(bookingForm) || "Pr1me Tutorial Services Booking Inquiry");
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:ljairamirez@gmail.com?subject=${subject}&body=${body}`;
  });
}

if (facebookBookingButton && bookingForm) {
  facebookBookingButton.addEventListener("click", async () => {
    if (!bookingForm.reportValidity()) return;

    const summary = getBookingSummary(bookingForm);

    try {
      await navigator.clipboard.writeText(summary);
      alert("Booking summary copied. Paste it into your Facebook message to Pr1me.");
    } catch {
      alert(summary);
    }

    window.open("https://www.facebook.com/PR1ME.ts/", "_blank", "noreferrer");
  });
}

const chatSuggestions = [
  "What services do you offer?",
  "What programs are available?",
  "How can I book a tutorial?",
  "Where is Pr1me located?",
  "How can I contact Pr1me?",
  "Do you offer online sessions?",
  "Who are the tutors?",
  "How do I inquire on Facebook?",
];

const pr1meFaqAnswers = [
  {
    keywords: ["service", "offer", "offered", "tutorial", "class"],
    answer:
      "Pr1me offers One-on-One Tutorial, Small Group Tutorial, Examination Reviews, DOST Review, Booster Program, and Level Enhancement and Advancement Program (LEAP). You can view and book them on the Services page.",
  },
  {
    keywords: ["program", "current", "promotion", "summer", "leap", "booster"],
    answer:
      "Current programs shown on the site include LEAP, Booster Program, review programs, and other promotions or announcements that can be added on the home page.",
  },
  {
    keywords: ["book", "booking", "reserve", "schedule", "avail", "form"],
    answer:
      "To book, open the Services page and click Book a Service. You can submit the website form, send the details by email, or inquire through the Pr1me Facebook page.",
  },
  {
    keywords: ["where", "located", "location", "address", "map", "maps", "maginhawa"],
    answer:
      "Pr1me is located at 88 Maginhawa, Teacher's Village, Diliman, Quezon City. You can click the map or the footer address to open it in Google Maps.",
  },
  {
    keywords: ["contact", "email", "gmail", "phone", "call", "number"],
    answer:
      "You can contact Pr1me through email at tutorialservices.pr1me@gmail.com, call the number linked in the footer, or message the Facebook page.",
  },
  {
    keywords: ["facebook", "fb", "message", "messenger", "inquire"],
    answer:
      "You can inquire through the Pr1me Facebook page here: https://www.facebook.com/PR1ME.ts/. The Services booking form also has an Inquire on Facebook option.",
  },
  {
    keywords: ["online", "face", "hybrid", "onsite", "in person", "f2f"],
    answer:
      "Yes. One-on-One Tutorial, Small Group Tutorial, Examination Reviews, and DOST Review can be Online or Face-to-Face. Booster is listed as Online, while LEAP is listed as Hybrid.",
  },
  {
    keywords: ["tutor", "teacher", "subjects", "math", "science", "physics", "chemistry"],
    answer:
      "The Tutors page lists Pr1me teachers and their subjects. You can search or sort tutors there by name, subject, review support, grade level, or exam topic.",
  },
  {
    keywords: ["rate", "price", "fee", "cost", "payment"],
    answer:
      "Rates are not listed on the website right now. Please use the booking form, email, call button, or Facebook page so Pr1me can confirm the correct details.",
  },
];

const chatHistory = [
  {
    role: "assistant",
    content: "Hi! Tap a question below or ask about Pr1me services, programs, tutors, booking, contact, or location.",
  },
];

function normalizeChatText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getLocalChatReply(text) {
  const normalized = normalizeChatText(text);

  if (!normalized) return "";

  const directSuggestion = {
    "what services do you offer": pr1meFaqAnswers[0].answer,
    "what programs are available": pr1meFaqAnswers[1].answer,
    "how can i book a tutorial": pr1meFaqAnswers[2].answer,
    "where is pr1me located": pr1meFaqAnswers[3].answer,
    "how can i contact pr1me": pr1meFaqAnswers[4].answer,
    "do you offer online sessions": pr1meFaqAnswers[6].answer,
    "who are the tutors": pr1meFaqAnswers[7].answer,
    "how do i inquire on facebook": pr1meFaqAnswers[5].answer,
  }[normalized];

  if (directSuggestion) return directSuggestion;

  const match = pr1meFaqAnswers.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  return match?.answer || "";
}

function createChatWidget() {
  const widget = document.createElement("section");
  widget.className = "ai-chat-widget";
  widget.setAttribute("aria-label", "Pr1me AI live chat");
  widget.innerHTML = `
    <button class="ai-chat-toggle" type="button" aria-expanded="false" aria-label="Open AI chat">
      <span class="chat-icon" aria-hidden="true"></span>
    </button>
    <div class="ai-chat-panel" hidden>
      <div class="ai-chat-header">
        <div>
          <p class="eyebrow">Pr1me Assistant</p>
        </div>
        <button type="button" aria-label="Close AI chat" data-chat-close>&times;</button>
      </div>
      <div class="ai-chat-messages" aria-live="polite"></div>
      <div class="ai-chat-suggestions"></div>
      <form class="ai-chat-form">
        <input type="text" name="chat-message" placeholder="Ask a question" autocomplete="off" required>
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  document.body.appendChild(widget);
  return widget;
}

function addChatMessage(container, role, text) {
  const message = document.createElement("p");
  message.className = `ai-chat-message ${role === "assistant" ? "assistant" : "user"}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function setupChatWidget() {
  const widget = createChatWidget();
  const toggle = widget.querySelector(".ai-chat-toggle");
  const panel = widget.querySelector(".ai-chat-panel");
  const closeButton = widget.querySelector("[data-chat-close]");
  const messages = widget.querySelector(".ai-chat-messages");
  const suggestions = widget.querySelector(".ai-chat-suggestions");
  const form = widget.querySelector(".ai-chat-form");
  const input = form.querySelector("input");

  chatHistory.forEach((message) => addChatMessage(messages, message.role, message.content));

  chatSuggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      input.value = suggestion;
      form.requestSubmit();
    });
    suggestions.appendChild(button);
  });

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) input.focus();
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    chatHistory.push({ role: "user", content: text });
    addChatMessage(messages, "user", text);

    const localReply = getLocalChatReply(text);
    if (localReply) {
      chatHistory.push({ role: "assistant", content: localReply });
      addChatMessage(messages, "assistant", localReply);
      return;
    }

    addChatMessage(messages, "assistant", "Typing...");
    const typingMessage = messages.lastElementChild;

    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory.slice(-8) }),
      };
      let response = await fetch("/api/chat", requestOptions);

      if (response.status === 404) {
        response = await fetch("/.netlify/functions/chat", requestOptions);
      }

      const data = await response.json();
      const reply = data.reply || data.error || "The AI chat is not available right now.";
      typingMessage.textContent = reply;
      chatHistory.push({ role: "assistant", content: reply });
    } catch {
      typingMessage.textContent = "The AI chat is not available yet. Please contact Pr1me through Facebook or email.";
    }
  });
}

setupChatWidget();
