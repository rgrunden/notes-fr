// Permanent Notes (Slightly Organized) — Fresh Start
// First line becomes title, autosaves,

const NOTES_KEY = "pn_notes_v1";

// ----- grab elements (must match index.html IDs) -----
const addBtn    = document.getElementById("addBtn");
const deleteBtn = document.getElementById("deleteBtn");
const notesList = document.getElementById("notesList");
const editor    = document.getElementById("editor");
const statusEl  = document.getElementById("status");
const previewEl = document.getElementById("preview");
const mdPreviewBtn = document.getElementById("mdPreviewBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const mdToolBar  = document.getElementById("mdToolBar");
const mdBoldBtn  = document.getElementById("mdBoldBtn");
const mdItalicBtn= document.getElementById("mdItalicBtn");
const mdH1Btn    = document.getElementById("mdH1Btn");
const mdBulletsBtn= document.getElementById("mdBulletsBtn");
const exportBtn = document.getElementById("exportBtn");
const exportOneBtn = document.getElementById("exportOneBtn");
exportOneBtn?.addEventListener("click", exportActiveNote);

if (mdToolBar) mdToolBar.style.display = "flex";

exportBtn?.addEventListener("click", exportNotes);
function exportActiveNote() {
  const note = notes.find(n => n.id === activeId);

  if (!note) {
    alert("No note selected to export.");
    return;
  }

  const title = (note.title || "Untitled").trim();
  const text = note.text || "";

  // safe filename
  const safeTitle = title
    .replace(/[\/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

  const output = `# ${title}\n\n${text}\n`;

  const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `notes-fr-${safeTitle || "note"}.txt`;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportNotes() {
  if (!notes || notes.length === 0) {
    alert("No notes to export.");
    return;
  }

  let output = "";

  notes.forEach((note) => {
    const title = note.title || "Untitled";
    const text = note.text || "";

    output += `# ${title}\n`;
    output += `${text}\n\n`;
    output += `---\n\n`;
  });

  const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "notes-fr-export.txt";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
 
let previewMode = false;

mdPreviewBtn?.addEventListener("click", () => {
  previewMode = !previewMode;

  if (previewMode) {
    // show preview
    previewEl.innerHTML = renderMarkdown(editor.value);
    previewEl.style.display = "block";
    editor.style.display = "none";
    mdPreviewBtn.textContent = "Edit";
  } else {
    // back to edit
    previewEl.style.display = "none";
    editor.style.display = "block";
    mdPreviewBtn.textContent = "Preview";
    editor.focus();
  }
});

// --- auto-continue bullets on Enter ---
editor.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const value = editor.value;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  // Only handle when there's no selection (simpler + expected behavior)
  if (start !== end) return;

  // Find current line boundaries
  const lineStart = value.lastIndexOf("\n", start - 1) + 1; // 0 if not found
  const lineEnd = value.indexOf("\n", start);
  const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;

  const line = value.slice(lineStart, actualLineEnd);

  // Support optional indentation before "- "
  const m = line.match(/^(\s*)- (.*)$/);
  if (!m) return; // not a bullet line

  const indent = m[1];
  const textAfterDash = m[2];

  e.preventDefault();

  // If the bullet is empty ("- "), end the list: replace it with a blank line
  if (textAfterDash.trim() === "") {
    const before = value.slice(0, lineStart);
    const after = value.slice(actualLineEnd);
    editor.value = before + "\n" + after;
    editor.selectionStart = editor.selectionEnd = lineStart + 1;
    editor.dispatchEvent(new Event("input"));
    return;
  }

  // Otherwise, continue bullets
  const insert = "\n" + indent + "- ";
  editor.value = value.slice(0, start) + insert + value.slice(start);
  const caret = start + insert.length;
  editor.selectionStart = editor.selectionEnd = caret;
  editor.dispatchEvent(new Event("input"));
});

function wrapSelection(before, after) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;

  const selected = value.slice(start, end);

  editor.value =
    value.slice(0, start) + before + selected + after + value.slice(end);

  const newStart = start + before.length;
  const newEnd = newStart + selected.length;
  editor.setSelectionRange(newStart, newEnd);

  editor.dispatchEvent(new Event("input"));
  editor.focus();
}

let isPreview = false;

function renderMarkdown(md) {
  // escape HTML first (important)
  let s = escapeHtml(md || "");

  // headings (only # at start of line)
  s = s.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // bold and italic
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // bullets: lines that start with "- "
  // turn consecutive bullet lines into a <ul>
  s = s.replace(/(?:^-\s.+\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map(line => line.replace(/^-+\s*/, "").trim())
      .filter(Boolean)
      .map(text => `<li>${text}</li>`)
      .join("");
    return `<ul>${items}</ul>\n`;
  });

  // line breaks (keep paragraphs readable)
  // convert double newlines into paragraph breaks, single newlines into <br>
  s = s
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
  s = `<p>${s}<\p>`;    

  return s;
}

function setPreviewMode(on) {
  isPreview = on;

  if (!editor || !previewEl || !mdPreviewBtn) return;

  if (on) {
    previewEl.innerHTML = renderMarkdown(editor.value);
    previewEl.style.display = "block";
    editor.style.display = "none";
    mdPreviewBtn.textContent = "Edit";
  } else {
    previewEl.style.display = "none";
    editor.style.display = "block";
    mdPreviewBtn.textContent = "Preview";
    editor.focus();
  }
}


function prefixLine(prefix) {
  const value = editor.value;
  const pos = editor.selectionStart;
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;

  if (value.slice(lineStart, lineStart + prefix.length) === prefix) return;

  editor.value = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  editor.setSelectionRange(pos + prefix.length, pos + prefix.length);

  editor.dispatchEvent(new Event("input"));
  editor.focus();
}

function bulletSelectedLines() {
  const value = editor.value;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  const blockStart = value.lastIndexOf("\n", start - 1) + 1;
  let blockEnd = value.indexOf("\n", end);
  if (blockEnd === -1) blockEnd = value.length;

  const block = value.slice(blockStart, blockEnd);
  const lines = block.split("\n");

  const updated = lines
    .map((line) => {
      if (!line.trim()) return line;
      if (line.startsWith("- ")) return line;
      return "- " + line;
    })
    .join("\n");

  editor.value = value.slice(0, blockStart) + updated + value.slice(blockEnd);
  editor.setSelectionRange(blockStart, blockStart + updated.length);

  editor.dispatchEvent(new Event("input"));
  editor.focus();
 }

// ---- markdown toolbar actions ----
if (mdBoldBtn) {
  mdBoldBtn.addEventListener("click", () => wrapSelection("**", "**"));
}

if (mdItalicBtn) {
  mdItalicBtn.addEventListener("click", () => wrapSelection("*", "*"));
}

if (mdH1Btn) {
  mdH1Btn.addEventListener("click", () => prefixLine("# "));
}

if (mdBulletsBtn) {
  mdBulletsBtn.addEventListener("click", () => bulletSelectedLines());
}

// Safety check (helps if an ID is misspelled)
const required = { addBtn, deleteBtn, notesList, editor, statusEl };
for (const [name, el] of Object.entries(required)) {
  if (!el) {
    console.error(`Missing element: ${name}. Check the id="" in index.html.`);
  }
}

let previewOn = false;

function togglePreview() {
  previewOn = !previewOn;

  if (previewOn) {
    // show preview, hide editor
    previewEl.style.display = "block";
    editor.style.display = "none";
    mdPreviewBtn.textContent = "Edit";

    // simple preview (for now)
    previewEl.textContent = editor.value;
  } else {
    // show editor, hide preview
    previewEl.style.display = "none";
    editor.style.display = "block";
    mdPreviewBtn.textContent = "Preview";
    editor.focus();
  }
}

if (mdPreviewBtn) {
  mdPreviewBtn.addEventListener("click", togglePreview);
}

// ----- state -----
let notes = loadNotes(); 
let activeId = notes[0]?.id ?? null;
updateEmptyState();
render();
  

// ----- helpers -----


function nowISO() {
  return new Date().toISOString();
}

function updateEmptyState() {
  const empty = document.getElementById("emptyState");
  if (!empty) return;
  empty.style.display = notes.length === 0 ? "block" : "none";
}

function makeId() {
  return (crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function titleFromText(text) {
  const firstLine = (text || "").split("\n")[0].trim();
  if (!firstLine) return "Untitled";

  const words = firstLine.split(/\s+/);
  return words.slice(0, 4).join(" ");
}

function previewFromText(text) {
  const lines = (text || "").split("\n");
  const body = lines.slice(1).join(" ").trim();
  return body.slice(0, 60);
}

function escapeHtml(str) {
  return (str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }

}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function getActiveNote() {
  return notes.find(n => n.id === activeId) ?? null;
}

// ----- render -----
function render() {
  // keep activeId valid
  if (activeId && !notes.some(n => n.id === activeId)) {
    activeId = notes[0]?.id ?? null;
  }

  renderList();
  renderEditor();

  if (mdToolBar) {
    
  }
}

function renderList() {
  if (!notesList) return;

  notesList.innerHTML = "";

  const sorted = [...notes].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  sorted.forEach(note => {
    const li = document.createElement("li");
    li.dataset.id = note.id;

    const title = titleFromText(note.text);
    const preview = previewFromText(note.text);

    li.innerHTML = `
      <div class="note-title">${escapeHtml(title)}</div>
      <div class="note-preview">${escapeHtml(preview)}</div>
    `;

    if (note.id === activeId) li.classList.add("active");

    li.addEventListener("click", () => {
      activeId = note.id;
      render();
    });

    notesList.appendChild(li);
  });
}

function renderEditor() {
  const note = getActiveNote();

  if (!editor || !statusEl) return;

  if (!note) {
    editor.value = "";
    editor.disabled = true;
    statusEl.textContent = "No note selected.";
    return;
  }

  editor.disabled = false;
  editor.value = note.text ?? "";
  statusEl.textContent = "Saved.";
}

// ----- actions -----
function addNote() {

  const newNote = {
    id: makeId(),
    text: "New note\n",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  notes.push(newNote);
  activeId = newNote.id;
  saveNotes();
  render();
  updateEmptyState();

  editor?.focus();

  // Auto-select the first line ("New note") so typing replaces it
  const firstLineEnd = editor.value.indexOf("\n");
  const end = firstLineEnd === -1? editor.value.length : firstLineEnd;
  editor.setSelectionRange(0, end);
}

function deleteNote() {
  const note = getActiveNote();
  if (!note) return;

  const ok = confirm(`Delete "${titleFromText(note.text)}"? This cannot be undone.`);
  if (!ok) return;

  notes = notes.filter(n => n.id !== note.id);
  saveNotes();

  activeId = notes[0]?.id ?? null;
  render();
}

function deleteAllNotes() {
    if (notes.length === 0) {
        statusE1.text.Content = "No notes to delete.";
        return;
    }

    const ok = confirm("Delete All notes? This cannot be undone.");
    if (!ok) return;

    notes = [];
    activeId = null;
    saveNotes();
    render();
    updateEmptyState();

    statusEl.textContent = "All notes deleted.";
}


// Autosave as you type
let saveTimer = null;
editor?.addEventListener("input", () => {
  const note = getActiveNote();
  if (!note) return;
  if (previewOn && previewEl) previewEl.textContent = editor.value;

  note.text = editor.value;
  note.updatedAt = nowISO();

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveNotes();
    renderList(); // updates title from first line in real-time
    if (statusEl) statusEl.textContent = "Saved.";
  }, 150);
});

// ----- events -----
addBtn?.addEventListener("click", addNote);
deleteBtn?.addEventListener("click", deleteNote);
deleteAllBtn?.addEventListener("click", deleteAllNotes);

// ----- start -----
render();
