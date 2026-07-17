const SHEET_NAME = "Submissions";
const HEADERS = [
  "Submitted At",
  "Title",
  "Request Label",
  "Guardian Name",
  "Student Name",
  "Grade Level",
  "School",
  "Age",
  "Email",
  "Contact Number",
  "Service",
  "Request Type",
  "Package",
  "Mode",
  "Tutoring Rate",
  "Preferred Tutor and/or Subjects",
  "Preferred Schedule",
  "Notes",
  "Uploaded File Name",
  "Terms Approved"
];

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");
  const sheet = getSubmissionSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    sheet.appendRow([
      data.submittedAt || new Date(),
      data.title || "",
      data.requestLabel || "",
      data.guardianName || "",
      data.studentName || "",
      data.gradeLevel || "",
      data.school || "",
      data.age || "",
      data.email || "",
      data.contactNumber || "",
      data.service || "",
      data.requestType || "",
      data.package || "",
      data.mode || "",
      data.tutoringRate || "",
      data.preferredTutorSubjects || "",
      data.preferredSchedule || "",
      data.notes || "",
      data.uploadedFileName || "",
      data.termsApproved || ""
    ]);
  } finally {
    lock.releaseLock();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSubmissionSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}
