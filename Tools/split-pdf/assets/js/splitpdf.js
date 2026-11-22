const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("pdf-file-input");
const editorContainer = document.getElementById("split-editor-container");
const pagesGrid = document.getElementById("pages-grid");
const loadedFileNameEl = document.getElementById("loaded-file-name");
const pageCountInfoEl = document.getElementById("page-count-info");
const pageRangeInput = document.getElementById("pageRangeInput");
const rangeInputBox = document.getElementById("rangeInputBox");
const selectAllPagesBtn = document.getElementById("selectAllPagesBtn");
const unselectAllPagesBtn = document.getElementById("unselectAllPagesBtn");
const resetSplitBtn = document.getElementById("resetSplitBtn");
const splitBtn = document.getElementById("split-btn");

let currentFile = null;
let currentArrayBuffer = null;
let totalPages = 0;
let selectedPages = new Set(); // menyimpan nomor halaman 1-based

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function getSplitMode() {
  const checked = document.querySelector('input[name="splitMode"]:checked');
  return checked ? checked.value : "selected";
}

function isPdfFile(file) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function syncRangeInputFromSelection() {
  if (!pageRangeInput) return;
  const sorted = Array.from(selectedPages).sort((a, b) => a - b);
  if (sorted.length === 0) {
    pageRangeInput.value = "";
    return;
  }

  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }

  pageRangeInput.value = ranges.join(", ");
}

function parsePageRange(inputStr, maxPage) {
  const result = new Set();
  const parts = inputStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const pageNum = Number(part);
      if (pageNum >= 1 && pageNum <= maxPage) {
        result.add(pageNum);
      }
    } else if (/^(\d+)\s*-\s*(\d+)$/.test(part)) {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start >= 1 && end >= start && end <= maxPage) {
        for (let p = start; p <= end; p++) {
          result.add(p);
        }
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

function updateCardSelectionUI() {
  document.querySelectorAll(".pdf-page-card").forEach((card) => {
    const pageNum = Number(card.dataset.page);
    if (selectedPages.has(pageNum)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  pageCountInfoEl.textContent = `${totalPages} halaman • ${selectedPages.size} dipilih`;
}

async function renderPageThumb(pdfDoc, pageNum, wrapperEl) {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const desiredWidth = 145;
    const viewport = page.getViewport({ scale: 1 });
    const scale = desiredWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.className = "pdf-thumb-canvas";

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;

    wrapperEl.innerHTML = "";
    wrapperEl.appendChild(canvas);
  } catch (err) {
    console.warn(`Gagal render halaman ${pageNum}:`, err);
  }
}

async function loadPdfForSplit(file) {
  if (!isPdfFile(file)) {
    alert("Hanya file berformat PDF yang didukung.");
    return;
  }

  if (!window.pdfjsLib) {
    alert("Library PDF.js belum termuat. Periksa koneksi internet Anda.");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    // Salin buffer karena PDF.js bisa me-detach ArrayBuffer aslinya
    currentArrayBuffer = buffer.slice(0);
    currentFile = file;

    const loadingTask = window.pdfjsLib.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;

    selectedPages = new Set();
    for (let i = 1; i <= totalPages; i++) {
      selectedPages.add(i);
    }

    loadedFileNameEl.textContent = file.name;
    uploadArea.style.display = "none";
    editorContainer.style.display = "block";
    pagesGrid.innerHTML = "";
    syncRangeInputFromSelection();
    updateCardSelectionUI();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const li = document.createElement("li");
      li.className = "pdf-page-card selected";
      li.dataset.page = pageNum;

      li.innerHTML = `
        <span class="pdf-page-number">${pageNum}</span>
        <span class="pdf-page-check"><i class='bx bx-check'></i></span>
        <div class="pdf-thumb-box" id="page-thumb-${pageNum}">
          <i class='bx bxs-file-pdf pdf-thumb-fallback'></i>
          <span class="pdf-thumb-loading">Memuat...</span>
        </div>
        <span class="pdf-page-label">Halaman ${pageNum}</span>
      `;

      li.addEventListener("click", () => {
        if (selectedPages.has(pageNum)) {
          selectedPages.delete(pageNum);
        } else {
          selectedPages.add(pageNum);
        }
        syncRangeInputFromSelection();
        updateCardSelectionUI();
      });

      pagesGrid.appendChild(li);

      const thumbBox = li.querySelector(`#page-thumb-${pageNum}`);
      renderPageThumb(pdfDoc, pageNum, thumbBox);
    }
  } catch (err) {
    console.error("Gagal memuat PDF:", err);
    alert(
      "Gagal membaca file PDF. Pastikan file tidak rusak atau terproteksi password.",
    );
  }
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    loadPdfForSplit(e.target.files[0]);
  }
  fileInput.value = "";
});

if (uploadArea) {
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove("drag-over");
    });
  });

  uploadArea.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      loadPdfForSplit(dt.files[0]);
    }
  });
}

document.querySelectorAll('input[name="splitMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const isSelectedMode = getSplitMode() === "selected";
    rangeInputBox.style.display = isSelectedMode ? "flex" : "none";
  });
});

if (pageRangeInput) {
  pageRangeInput.addEventListener("input", () => {
    const parsed = parsePageRange(pageRangeInput.value, totalPages);
    selectedPages = new Set(parsed);
    updateCardSelectionUI();
  });
}

if (selectAllPagesBtn) {
  selectAllPagesBtn.addEventListener("click", () => {
    selectedPages.clear();
    for (let i = 1; i <= totalPages; i++) {
      selectedPages.add(i);
    }
    syncRangeInputFromSelection();
    updateCardSelectionUI();
  });
}

if (unselectAllPagesBtn) {
  unselectAllPagesBtn.addEventListener("click", () => {
    selectedPages.clear();
    syncRangeInputFromSelection();
    updateCardSelectionUI();
  });
}

if (resetSplitBtn) {
  resetSplitBtn.addEventListener("click", () => {
    currentFile = null;
    currentArrayBuffer = null;
    totalPages = 0;
    selectedPages.clear();
    pagesGrid.innerHTML = "";
    pageRangeInput.value = "";
    editorContainer.style.display = "none";
    uploadArea.style.display = "";
  });
}

function triggerDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

splitBtn.addEventListener("click", async () => {
  if (!currentArrayBuffer || totalPages === 0) {
    alert("Pilih file PDF terlebih dahulu.");
    return;
  }

  if (!window.PDFLib) {
    alert("Library pdf-lib belum termuat. Periksa koneksi internet Anda.");
    return;
  }

  const mode = getSplitMode();
  const baseName = (currentFile?.name || "document").replace(/\.pdf$/i, "");
  const stamp = getTimestamp();

  const originalHtml = splitBtn.innerHTML;
  splitBtn.disabled = true;
  splitBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Memproses...`;

  try {
    const { PDFDocument } = window.PDFLib;
    const sourcePdf = await PDFDocument.load(currentArrayBuffer);

    if (mode === "all") {
      for (let i = 0; i < totalPages; i++) {
        const singlePdf = await PDFDocument.create();
        const [copiedPage] = await singlePdf.copyPages(sourcePdf, [i]);
        singlePdf.addPage(copiedPage);
        const bytes = await singlePdf.save();
        triggerDownload(bytes, `${baseName}-halaman-${i + 1}-${stamp}.pdf`);
        await new Promise((r) => setTimeout(r, 250));
      }
    } else {
      const pagesToExtract = Array.from(selectedPages).sort((a, b) => a - b);
      if (pagesToExtract.length === 0) {
        alert("Pilih minimal 1 halaman untuk dipisahkan.");
        return;
      }

      const extractedPdf = await PDFDocument.create();
      const indices = pagesToExtract.map((p) => p - 1);
      const copiedPages = await extractedPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => extractedPdf.addPage(page));

      const bytes = await extractedPdf.save();
      triggerDownload(bytes, `${baseName}-terpisah-${stamp}.pdf`);
    }
  } catch (err) {
    console.error("Gagal memisahkan PDF:", err);
    alert(
      "Terjadi kesalahan saat memproses PDF. Pastikan file tidak terproteksi password.",
    );
  } finally {
    splitBtn.disabled = false;
    splitBtn.innerHTML = originalHtml;
  }
});