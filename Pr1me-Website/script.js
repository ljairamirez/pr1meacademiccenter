const assetExtensions = [
  "png",
  "jpg",
  "JPG",
  "jpeg",
  "JPEG",
  "jfif",
  "JFIF",
  "webp",
  "WEBP"
];

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
    window.setTimeout(closeSiteLoader, 1400);
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
  }, 450);
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const tutorSearch = document.querySelector("#tutorSearch");
const tutorSort = document.querySelector("#tutorSort");
const tutorGrid = document.querySelector("[data-tutor-grid]");
const tutorCards = [...document.querySelectorAll(".tutor-card")];

tutorCards.forEach((card, index) => {
  const tutorName = card.querySelector("h3")?.textContent.trim() || "";
  const fullName = card.querySelector(".complete-name strong")?.textContent.trim() || "";
  const fallbackName = tutorName.replace(/^Teacher\s+/i, "").trim() || tutorName;
  const sortName = fullName || fallbackName;
  card.dataset.originalIndex = String(index);
  card.dataset.sortName = sortName.toLowerCase();
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
const openBookingButtons = document.querySelectorAll("[data-open-booking]");
const bookingBackButton = document.querySelector("[data-booking-back]");
const bookingForm = document.querySelector("[data-booking-form]");
const bookingOnlyFields = document.querySelectorAll("[data-booking-only]");
const bookingModeInput = document.querySelector("[data-form-mode-input]");
const bookingEyebrow = document.querySelector("[data-booking-eyebrow]");
const bookingTitle = document.querySelector("[data-booking-title]");
const bookingNote = document.querySelector("[data-booking-note]");
const bookingSubmitButton = document.querySelector("[data-booking-submit]");
let bookingModeState = "inquiry";
const emailBookingButton = document.querySelector("[data-email-booking]");
const facebookBookingButton = document.querySelector("[data-facebook-booking]");
const rateOutput = document.querySelector("[data-rate-output]");
const termsModal = document.querySelector("[data-terms-modal]");
const openTermsButton = document.querySelector("[data-terms-open]");
const closeTermsButton = document.querySelector("[data-terms-close]");
const approveTermsButton = document.querySelector("[data-terms-approve]");
const termsApprovedCheckbox = document.querySelector("[data-terms-approved]");
const paymentModal = document.querySelector("[data-payment-modal]");
const openPaymentButton = document.querySelector("[data-payment-open]");
const closePaymentButtons = document.querySelectorAll("[data-payment-close]");
const useServerBooking = window.location.protocol !== "file:";
const bookingEndpoint = "/api/booking";

const tutoringRateTable = {
  "5 hours": {
    online: {
      elemJhs: "PHP 4,500",
      shs: "PHP 5,000",
      college: "PHP 5,500",
    },
    faceToFace: {
      elemJhs: "PHP 5,000",
      shs: "PHP 5,500",
      college: "PHP 6,000",
    },
  },
  "10 hours": {
    online: {
      elemJhs: "PHP 7,000",
      shs: "PHP 8,000",
      college: "PHP 9,000",
    },
    faceToFace: {
      elemJhs: "PHP 8,000",
      shs: "PHP 9,000",
      college: "PHP 9,500",
    },
  },
  "15 hours": {
    online: {
      elemJhs: "PHP 8,500",
      shs: "PHP 9,500",
      college: "PHP 10,500",
    },
    faceToFace: {
      elemJhs: "PHP 9,500",
      shs: "PHP 10,500",
      college: "PHP 11,500",
    },
  },
};

function getGradeCategory(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "";
  if (normalized.includes("college")) return "college";

  const match = normalized.match(/\d+/);
  const grade = match ? Number(match[0]) : NaN;

  if (grade >= 1 && grade <= 10) return "elemJhs";
  if (grade === 11 || grade === 12) return "shs";
  return "";
}

function getRateMode(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "online") return "online";
  if (normalized === "face-to-face" || normalized === "mixed") return "faceToFace";
  return "";
}

function updateTutoringRate() {
  if (!bookingForm || !rateOutput) return;

  const category = getGradeCategory(bookingForm.querySelector('[name="grade-level"]')?.value);
  const mode = getRateMode(bookingForm.querySelector('[name="mode"]')?.value);
  const selectedPackage = bookingForm.querySelector('[name="package"]')?.value;

  if (!category || !mode || !selectedPackage) {
    rateOutput.value = "";
    rateOutput.placeholder = "Select package, grade level, and mode";
    return;
  }

  rateOutput.value = tutoringRateTable[selectedPackage]?.[mode]?.[category] || "";
}

function openTermsModal() {
  if (!termsModal) return;
  termsModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeTermsModal() {
  if (!termsModal) return;
  termsModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openPaymentModal() {
  if (!paymentModal) return;
  paymentModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closePaymentModal() {
  if (!paymentModal) return;
  paymentModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function setBookingMode(mode = "inquiry") {
  bookingModeState = mode === "booking" ? "booking" : "inquiry";
  const isBooking = bookingModeState === "booking";

  bookingForm?.setAttribute("data-mode", bookingModeState);
  bookingOnlyFields.forEach((field) => {
    field.hidden = !isBooking;
  });

  const modeSelect = bookingForm?.querySelector('[name="mode"]');
  if (modeSelect) modeSelect.required = true;
  if (termsApprovedCheckbox) termsApprovedCheckbox.required = isBooking;
  if (!isBooking && termsApprovedCheckbox) termsApprovedCheckbox.checked = false;

  if (bookingModeInput) bookingModeInput.value = isBooking ? "Booking / Reservation" : "Inquiry";
  if (bookingEyebrow) bookingEyebrow.textContent = isBooking ? "One-on-One Booking Form" : "One-on-One Inquiry Form";
  if (bookingTitle) bookingTitle.textContent = isBooking ? "Book a Personalized Session" : "Send an Inquiry";
  if (bookingNote) {
    bookingNote.textContent = isBooking
      ? "Complete the session details, review the terms, and view payment options before submitting your booking request."
      : "Send only the needed details for questions, tutor matching, subject support, or schedule checking.";
  }
  if (bookingSubmitButton) bookingSubmitButton.textContent = isBooking ? "Submit Booking" : "Submit Inquiry";

  updateTutoringRate();
}

function showBookingPanel(mode = "inquiry") {
  if (!bookingPanel) return;
  setBookingMode(mode);
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
  const requestType = form.querySelector('[name="request-type"]')?.value.trim() || "Inquiry";
  const detailsLabel = requestType.toLowerCase().includes("booking") ? "Booking Details:" : "Inquiry Details:";
  const summaryLines = [title || "Pr1me Tutorial Services Inquiry", "", detailsLabel];
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

  summaryLines.push("", `Please review this ${requestType.toLowerCase()} and contact the guardian for confirmation.`);

  return summaryLines.join("\n");
}

function getBookingPayload(form) {
  return {
    guardianName: form.querySelector('[name="guardian-name"]')?.value.trim() || "",
    studentName: form.querySelector('[name="student-name"]')?.value.trim() || "",
    gradeLevel: form.querySelector('[name="grade-level"]')?.value.trim() || "",
    school: form.querySelector('[name="school"]')?.value.trim() || "",
    age: form.querySelector('[name="age"]')?.value.trim() || "",
    email: form.querySelector('[name="email"]')?.value.trim() || "",
    contactNumber: form.querySelector('[name="contact-number"]')?.value.trim() || "",
    service: form.querySelector('[name="service"]')?.value.trim() || "",
    requestType: form.querySelector('[name="request-type"]')?.value.trim() || "Inquiry",
    package: form.querySelector('[name="package"]')?.value.trim() || "",
    mode: form.querySelector('[name="mode"]')?.value.trim() || "",
    tutoringRate: form.querySelector('[name="tutoring-rate"]')?.value.trim() || "",
    preferredTutorSubjects: form.querySelector('[name="preferred-tutor-subjects"]')?.value.trim() || "",
    preferredSchedule: form.querySelector('[name="preferred-schedule"]')?.value.trim() || "",
    notes: form.querySelector('[name="notes"]')?.value.trim() || "",
    uploadedFileName: form.querySelector('[name="attachment"]')?.files?.[0]?.name || "",
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


const bookingDraftKey = "pr1me-booking-draft-v2";

function getBookingDraftFields(form) {
  return Array.from(form.querySelectorAll("input, select, textarea")).filter((field) => {
    return field.name && field.type !== "file" && field.type !== "submit" && field.type !== "button";
  });
}

function saveBookingDraft() {
  if (!bookingForm || !window.localStorage) return;

  const fields = {};
  getBookingDraftFields(bookingForm).forEach((field) => {
    fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });

  try {
    localStorage.setItem(bookingDraftKey, JSON.stringify({
      mode: bookingModeState,
      fields,
      savedAt: Date.now(),
    }));
  } catch {
    // Private browsing or full storage should not block the form.
  }
}

function restoreBookingDraft() {
  if (!bookingForm || !window.localStorage) return;

  let draft;
  try {
    draft = JSON.parse(localStorage.getItem(bookingDraftKey) || "null");
  } catch {
    return;
  }

  if (!draft?.fields) return;

  getBookingDraftFields(bookingForm).forEach((field) => {
    if (!(field.name in draft.fields)) return;
    if (field.type === "checkbox") {
      field.checked = Boolean(draft.fields[field.name]);
    } else {
      field.value = draft.fields[field.name] || "";
    }
  });

  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  if (!requestedMode && (draft.mode === "booking" || draft.mode === "inquiry")) {
    setBookingMode(draft.mode);
  }

  updateBookingSubmissionTitle(bookingForm);
  updateTutoringRate();
}

function clearBookingDraft() {
  try {
    localStorage.removeItem(bookingDraftKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

openBookingButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showBookingPanel(button.dataset.bookingMode || "inquiry");
    if (window.location.hash !== "#booking") {
      history.replaceState(null, "", "#booking");
    }
  });
});

if (window.location.hash === "#booking") {
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  showBookingPanel(requestedMode === "booking" ? "booking" : "inquiry");
}

if (bookingBackButton) {
  bookingBackButton.addEventListener("click", hideBookingPanel);
}

if (openTermsButton) {
  openTermsButton.addEventListener("click", openTermsModal);
}

if (closeTermsButton) {
  closeTermsButton.addEventListener("click", closeTermsModal);
}

if (approveTermsButton) {
  approveTermsButton.addEventListener("click", () => {
    if (termsApprovedCheckbox) termsApprovedCheckbox.checked = true;
    closeTermsModal();
  });
}

if (termsModal) {
  termsModal.addEventListener("click", (event) => {
    if (event.target === termsModal) closeTermsModal();
  });
}

if (openPaymentButton) {
  openPaymentButton.addEventListener("click", openPaymentModal);
}

closePaymentButtons.forEach((button) => {
  button.addEventListener("click", closePaymentModal);
});

if (paymentModal) {
  paymentModal.addEventListener("click", (event) => {
    if (event.target === paymentModal) closePaymentModal();
  });
}

if (bookingForm) {
  if (bookingPanel?.hidden) setBookingMode("inquiry");
  restoreBookingDraft();
  bookingForm.addEventListener("input", () => {
    updateBookingSubmissionTitle(bookingForm);
    updateTutoringRate();
    saveBookingDraft();
  });
  bookingForm.addEventListener("change", () => {
    updateBookingSubmissionTitle(bookingForm);
    updateTutoringRate();
    saveBookingDraft();
  });
  bookingForm.addEventListener("submit", async (event) => {
    updateBookingSubmissionTitle(bookingForm);
    updateTutoringRate();

    if (bookingModeState === "booking" && termsApprovedCheckbox && !termsApprovedCheckbox.checked) {
      event.preventDefault();
      openTermsModal();
      alert("Please view and approve the Terms and Conditions before submitting.");
      return;
    }

    if (!useServerBooking) return;

    event.preventDefault();

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "Submit";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    let timeout;

    try {
      saveBookingDraft();
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 20000);
      const response = await fetch(bookingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getBookingPayload(bookingForm)),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          error: responseText && responseText.length < 180
            ? responseText
            : "The server returned an unexpected response. Please try again, or use Send via Email / Inquire on Facebook.",
        };
      }

      if (!response.ok) {
        throw new Error(data.error || `${bookingModeState === "booking" ? "Booking" : "Inquiry"} could not be submitted.`);
      }

      alert(`${bookingModeState === "booking" ? "Booking" : "Inquiry"} submitted successfully.`);
      clearBookingDraft();
      bookingForm.reset();
      setBookingMode(bookingModeState);
      updateBookingSubmissionTitle(bookingForm);
    } catch (error) {
      const message = error.name === "AbortError"
        ? "Submission took too long. Your details are still saved on this browser. Please try again, or use Send via Email / Inquire on Facebook."
        : `${error.message}\n\nYour details are still saved on this browser. You can try again, Send via Email, or Inquire on Facebook.`;
      alert(message);
    } finally {
      if (timeout) window.clearTimeout(timeout);
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
    const subject = encodeURIComponent(updateBookingSubmissionTitle(bookingForm) || "Pr1me Tutorial Services Inquiry");
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:ljairamirez@gmail.com,glaurenciano@gmail.com,tutorialservices.pr1me@gmail.com?subject=${subject}&body=${body}`;
  });
}

if (facebookBookingButton && bookingForm) {
  facebookBookingButton.addEventListener("click", async () => {
    if (!bookingForm.reportValidity()) return;

    const summary = getBookingSummary(bookingForm);

    try {
      await navigator.clipboard.writeText(summary);
      alert("Inquiry summary copied. Paste it into your Facebook message to Pr1me.");
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
  "Who teaches Mathematics?",
  "Solve 2x + 5 = 13",
  "Explain photosynthesis",
  "How do I inquire on Facebook?",
];

const tutorDirectory = [
  { name: "Teacher Gina", fullName: "Gina-Lyn Laurenciano-Calderon", subjects: ["Mathematics", "Statistics", "Review Support"], degree: "BS Mathematics and Science Teaching, Major in Mathematics", availability: "TBA" },
  { name: "Teacher IMG", fullName: "Ian Mhar Gabriel D. Aguila", subjects: ["Biology", "Chemistry", "Earth Science"], degree: "BS Mathematics and Science Teaching", availability: "TBA" },
  { name: "Teacher Dean", fullName: "Dean Angelo Calvendra Leyretana", subjects: ["Mathematics", "Physics", "SocSci"], degree: "BS Food Technology", availability: "MTWThFSat 9am-9pm" },
  { name: "Teacher Jam B.", fullName: "Jamela Verna L. Beniga", subjects: ["Mathematics", "Physics", "Land Surveying"], degree: "BS Geodetic Engineering", availability: "Monday-Friday, 9am to 4pm" },
  { name: "Teacher Lloyd", fullName: "Lloyd Ramirez", subjects: ["Mathematics", "Statistics", "Physics"], degree: "BS Geodetic Engineering", availability: "MTWThF - 9 AM - 4 PM" },
  { name: "Teacher Nicko", fullName: "Nicko Gonzales", subjects: ["Algebra", "Geometry", "Statistics"], degree: "BS Business Administration", availability: "TBA" },
  { name: "Teacher Triz", fullName: "Triz Darylle Agsunod", subjects: ["Chemistry", "Mathematics", "General Science"], degree: "BS Food Technology", availability: "MTWThF - 5PM - 10 PM, Sat - 9 AM - 5 PM" },
  { name: "Teacher Claire", fullName: "Claire Devis", subjects: ["Biology", "Chemistry", "Earth Science"], degree: "B Secondary Education Major in Biology", availability: "MTWThF - 6 PM - 9 PM" },
  { name: "Teacher Akhi", fullName: "Akhillis Dela Cruz Gochuico", subjects: ["Mathematics", "General Science", "Statistics"], degree: "BS Industrial Engineering", availability: "TBA" },
  { name: "Teacher Philipp", fullName: "Philipp Gandeaz Dolor Jr.", subjects: ["Mathematics", "Physics", "Robotics"], degree: "BS Electronics Engineering", availability: "MTWThF 7am-10:30am & 6pm-10pm, Sat-Sun 8am-8pm" },
  { name: "Teacher Kristina", fullName: "Kristina", subjects: ["Biology", "MBB", "Molecular Biology"], degree: "Details to be added soon", availability: "TBA" },
  { name: "Teacher Joshua", fullName: "Joshua S. Dela Paz", subjects: ["Biology", "Chemistry", "Earth Science"], degree: "B Secondary Education Major in Biology", availability: "MTWThF 6pm - 9pm" },
  { name: "Teacher Mitchie", fullName: "Mitchie Yance M. Sombria", subjects: ["English", "Reading Comprehension", "Business Math"], degree: "BS Business Economics", availability: "MTWThF 5pm - 8pm Sat 10 am - 6pm" },
  { name: "Teacher Steph", fullName: "Stephanie U. Cruz", subjects: ["Mathematics", "Physics", "Biology"], degree: "B Secondary Education Major in Mathematics Minor in Science", availability: "Tuesday and Thursday (5-9 pm), Saturday and Sunday (1-7 pm)" },
  { name: "Teacher Cedie", fullName: "Sean Cedrick J. Gavilan", subjects: ["Mathematics", "Language Proficiency", "Reading Comprehension"], degree: "BS Computer Engineering", availability: "MTWThF (7am - 10am) & (7pm - 10pm)" },
  { name: "Teacher Saree", fullName: "Saree Evidente", subjects: ["Subject TBA"], degree: "Details to be added soon", availability: "TBA" },
  { name: "Teacher Therese", fullName: "Vince Therese Turqueza", subjects: ["English", "Filipino", "Social Science"], degree: "III - B Library and Information Science", availability: "Tuesday to Saturday, 10AM - 8PM" },
  { name: "Teacher Root", fullName: "Reuter Dave Aquino", subjects: ["Physics", "Mathematics", "Earth Science"], degree: "B Secondary Education Major in Physics", availability: "MTWThF 6 pm - 9 pm" },
];

const pr1meFaqAnswers = [
  {
    keywords: ["service", "offer", "offered", "tutorial", "class"],
    answer:
      "Pr1me Tutorial Services offers One-on-One Tutorial, Regular Group Tutorial, Study-Buddy Tutoring, PSHS Regular Group Tutoring, Examination Reviews, Booster Program, and LEAP. Pr1me Academic Center (PAC) has its own page for Academic Center programs such as DOST-SEI Review.",
  },
  {
    keywords: ["program", "current", "promotion", "summer", "leap", "booster"],
    answer:
      "Current programs shown on the tutorial site include PSHS Regular Group Tutoring, Study-Buddy Tutoring, and One-on-One Tutoring. PAC programs include DOST-SEI Review, with more Academic Center programs to be added soon.",
  },
  {
    keywords: ["book", "booking", "reserve", "schedule", "avail", "form"],
    answer:
      "To book, open the Book a Service page. For general questions, use the Inquiry button on the Services page, Send via Email, or Inquire on Facebook.",
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
      "You can inquire through the Pr1me Facebook page here: https://www.facebook.com/PR1ME.ts/. The Services inquiry form also has an Inquire on Facebook option.",
  },
  {
    keywords: ["online", "face", "hybrid", "onsite", "in person", "f2f"],
    answer:
      "Yes. One-on-One Tutorial, Regular Group Tutorial, Study-Buddy Tutoring, and Examination Reviews can be Online or Face-to-Face. Booster is listed as Online, while LEAP is listed as Hybrid. DOST-SEI Review is now listed under the PAC page.",
  },
  {
    keywords: ["tutor", "teacher", "teachers", "subjects"],
    answer:
      "The Tutors page lists Pr1me teachers and their subjects. You can search or sort tutors there by name, subject, review support, grade level, or exam topic.",
  },
  {
    keywords: ["rate", "price", "fee", "cost", "payment"],
    answer:
      "Rates are not listed on the website right now. Please use the inquiry form, email, call button, or Facebook page so Pr1me can confirm the correct details.",
  },
];

const chatHistory = [
  {
    role: "assistant",
    content: "Hi! Tap a question below or ask about Pr1me services, tutors, booking, or a school question.",
  },
];

function normalizeChatText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findTutorByQuestion(normalized) {
  return tutorDirectory.find((tutor) => {
    const names = [tutor.name, tutor.fullName, tutor.name.replace(/^Teacher\s+/i, "")]
      .map(normalizeChatText)
      .filter(Boolean);
    return names.some((name) => normalized.includes(name));
  });
}

function findTutorsBySubject(normalized) {
  const subjectAliases = {
    math: "mathematics",
    maths: "mathematics",
    sci: "science",
    socsci: "socsci",
    social: "social",
    english: "english",
    physics: "physics",
    chemistry: "chemistry",
    biology: "biology",
    statistics: "statistics",
    robotics: "robotics",
    reading: "reading",
    language: "language",
    surveying: "surveying",
    earth: "earth",
  };
  const normalizedSubjects = Object.entries(subjectAliases)
    .filter(([alias]) => normalized.includes(alias))
    .map(([, subject]) => subject);

  if (!normalizedSubjects.length) return [];

  return tutorDirectory.filter((tutor) => {
    const subjectText = normalizeChatText(tutor.subjects.join(" "));
    return normalizedSubjects.some((subject) => subjectText.includes(subject));
  });
}

function getTutorChatReply(normalized) {
  const isTutorInquiry = /\b(who|which|what|available|handle|handles|teach|teaches|teacher|teachers|tutor|tutors|subject|subjects)\b/.test(normalized);
  if (!isTutorInquiry) return "";

  const specificTutor = findTutorByQuestion(normalized);
  if (specificTutor) {
    return `${specificTutor.name} (${specificTutor.fullName}) handles ${specificTutor.subjects.join(", ")}. Degree/program: ${specificTutor.degree}. Availability: ${specificTutor.availability}.`;
  }

  const subjectTutors = findTutorsBySubject(normalized);
  if (subjectTutors.length) {
    const names = subjectTutors
      .slice(0, 8)
      .map((tutor) => `${tutor.name} (${tutor.subjects.join(", ")})`)
      .join("; ");
    const extra = subjectTutors.length > 8 ? " You can see more by searching the Tutors page." : "";
    return `For that subject, available matching tutors include: ${names}.${extra}`;
  }

  return "";
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

  const tutorReply = getTutorChatReply(normalized);
  if (tutorReply) return tutorReply;

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
      <div class="ai-chat-suggestion-block">
        <p>Quick questions</p>
        <div class="ai-chat-suggestions"></div>
      </div>
      <form class="ai-chat-form">
        <input type="text" name="chat-message" placeholder="Ask Pr1me or a school question" autocomplete="off" required>
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
  return message;
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
  const submitButton = form.querySelector("button");

  function setChatBusy(isBusy) {
    input.disabled = isBusy;
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? "Wait" : "Send";
  }

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

    const typingMessage = addChatMessage(messages, "assistant", "Pr1me Assistant is thinking...");
    setChatBusy(true);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 18000);
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory.slice(-10) }),
        signal: controller.signal,
      };
      let response = await fetch("/api/chat", requestOptions);
      window.clearTimeout(timeout);
      const data = await response.json().catch(() => ({}));
      const reply = data.reply || data.error || "The AI chat could not respond right now. Please try again or contact Pr1me directly.";
      typingMessage.textContent = reply;
      chatHistory.push({ role: "assistant", content: reply });
    } catch {
      typingMessage.textContent = "The AI chat could not connect right now. Please try again or contact Pr1me directly.";
    } finally {
      setChatBusy(false);
      input.focus();
    }
  });
}

setupChatWidget();















