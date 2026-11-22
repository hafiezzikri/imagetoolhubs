const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("pdf-file-input");
const editorContainer = document.getElementById("compress-editor-container");
const fileNameEl = document.getElementById("compress-file-name");
const fileMetaEl = document.getElementById("compress-file-meta");
const thumbBoxEl = document.getElementById("compress-thumb-box");
const originalSizeEl = document.getElementById("original-size-text");
const compressedSizeEl = document.getElementById("compressed-size-text");
const savingsBadgeEl = document.getElementById("savings-badge-text");
const resetBtn = document.getElementById("resetCompressBtn");
const compressBtn = document.getElementById("compress-btn");

let currentFile = null;
let currentArrayBuffer = null;
let totalPages = 0;

const COMPRESSION_PRESETS = {
  low: { scale: 1.35, quality: 0.78 },
  medium: { scale: 1.05, quality: 0.58 },
  high: { scale: 0.82, quality: 0.38 },
};

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function isPdfFile(file) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function getSelectedLevel() {
  const checked = document.querySelector('input[name="compressLevel"]:checked');
  return checked ? checked.value : "medium";
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function renderFirstPagePreview(pdfDoc) {
  if (!thumbBoxEl) return;

  try {
    const page = await pdfDoc.getPage(1);
    const desiredWidth = 180;
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

    thumbBoxEl.innerHTML = "";
    thumbBoxEl.appendChild(canvas);
  } catch (err) {
    console.warn("Gagal render preview halaman 1:", err);
  }
}

async function loadPdfForCompress(file) {
  if (!isPdfFile(file)) {
    alert("Hanya file berformat PDF yang didukung.");
    return;
  }

  if (!window.pdfjsLib) {
    alert("Library PDF.js belum termuat. Periksa koneksi internet Anda.");
    return;
  }

  try {
    const rawBuffer = await file.arrayBuffer();
    currentArrayBuffer = rawBuffer.slice(0);
    currentFile = file;

    const pdfDoc = await window.pdfjsLib.getDocument({ data: rawBuffer })
      .promise;
    totalPages = pdfDoc.numPages;

    fileNameEl.textContent = file.name;
    fileMetaEl.textContent = `${totalPages} halaman • ${formatBytes(file.size)}`;
    originalSizeEl.textContent = formatBytes(file.size);
    compressedSizeEl.textContent = "Siap dikompres";
    savingsBadgeEl.textContent = "-";

    uploadArea.style.display = "none";
    editorContainer.style.display = "block";
    thumbBoxEl.innerHTML = `
      <i class='bx bxs-file-pdf pdf-thumb-fallback'></i>
      <span class="pdf-thumb-loading">Memuat pratinjau...</span>
    `;

    await renderFirstPagePreview(pdfDoc);
  } catch (err) {
    console.error("Gagal memuat PDF:", err);
    alert(
      "Gagal membaca file PDF. Pastikan file tidak rusak atau terproteksi password.",
    );
  }
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    loadPdfForCompress(e.target.files[0]);
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
      loadPdfForCompress(dt.files[0]);
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    currentFile = null;
    currentArrayBuffer = null;
    totalPages = 0;
    editorContainer.style.display = "none";
    uploadArea.style.display = "";
  });
}

compressBtn.addEventListener("click", async () => {
  if (!currentArrayBuffer || !currentFile || totalPages === 0) {
    alert("Pilih file PDF terlebih dahulu.");
    return;
  }

  if (!window.pdfjsLib || !window.PDFLib) {
    alert("Library PDF.js atau pdf-lib belum termuat.");
    return;
  }

  const level = getSelectedLevel();
  const preset = COMPRESSION_PRESETS[level] || COMPRESSION_PRESETS.medium;
  const originalHtml = compressBtn.innerHTML;

  compressBtn.disabled = true;
  compressBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Mengompres...`;
  compressedSizeEl.textContent = "Memproses...";

  try {
    const sourcePdfjs = await window.pdfjsLib.getDocument({
      data: currentArrayBuffer.slice(0),
    }).promise;

    const { PDFDocument } = window.PDFLib;
    const outputPdf = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      compressBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Halaman ${pageNum}/${totalPages}...`;

      const page = await sourcePdfjs.getPage(pageNum);
      const viewport = page.getViewport({ scale: preset.scale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const jpegDataUrl = canvas.toDataURL("image/jpeg", preset.quality);
      const base64Data = jpegDataUrl.split(",")[1];
      const jpegBytes = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0),
      );

      const embeddedImage = await outputPdf.embedJpg(jpegBytes);
      const pdfPage = outputPdf.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    const compressedBytes = await outputPdf.save();
    const compressedSize = compressedBytes.byteLength;
    const originalSize = currentFile.size;

    compressedSizeEl.textContent = formatBytes(compressedSize);

    if (originalSize > 0) {
      const diffPercent = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);
      if (compressedSize < originalSize) {
        savingsBadgeEl.textContent = `-${diffPercent}%`;
      } else {
        savingsBadgeEl.textContent = "Lebih besar (coba level Kuat)";
      }
    }

    const baseName = currentFile.name.replace(/\.pdf$/i, "");
    const blob = new Blob([compressedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-kompres-${getTimestamp()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Gagal mengompres PDF:", err);
    compressedSizeEl.textContent = "Gagal";
    alert(
      "Terjadi kesalahan saat mengompres PDF. Pastikan file tidak terproteksi password.",
    );
  } finally {
    compressBtn.disabled = false;
    compressBtn.innerHTML = originalHtml;
  }
});
