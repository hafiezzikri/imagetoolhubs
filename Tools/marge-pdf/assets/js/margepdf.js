const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("pdf-file-input");
const fileListContainer = document.getElementById("file-list-container");
const selectedFilesList = document.getElementById("selected-files");
const fileCountSpan = document.getElementById("file-count");
const clearButton = document.getElementById("clearButton");
const mergeBtn = document.getElementById("merge-btn");

let uploadedFiles = [];
let draggedIndex = null;

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function isPdfFile(file) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function addFiles(fileList) {
  const files = Array.from(fileList);
  let addedCount = 0;

  files.forEach((file) => {
    if (isPdfFile(file)) {
      uploadedFiles.push(file);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    renderFileList();
  } else if (files.length > 0) {
    alert("Hanya file berformat PDF yang didukung.");
  }
}

fileInput.addEventListener("change", (e) => {
  addFiles(e.target.files);
  fileInput.value = "";
});

function syncUploadAreaVisibility() {
  if (!uploadArea) return;
  uploadArea.style.display = uploadedFiles.length > 0 ? "none" : "";
}

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
    if (dt && dt.files && dt.files.length > 0) {
      addFiles(dt.files);
    }
  });
}

async function renderPdfThumbnail(file, wrapperEl) {
  if (!window.pdfjsLib) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const desiredWidth = 150;
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
    console.warn("Gagal render preview PDF:", file.name, err);
  }
}

function renderFileList() {
  selectedFilesList.innerHTML = "";
  syncUploadAreaVisibility();

  if (uploadedFiles.length > 0) {
    fileListContainer.style.display = "block";
    fileCountSpan.textContent = `${uploadedFiles.length} file siap digabung`;

    uploadedFiles.forEach((file, index) => {
      const li = document.createElement("li");
      li.className = "pdf-file-item";
      li.draggable = true;
      li.dataset.index = index;

      li.innerHTML = `
        <span class="pdf-order-badge">${index + 1}</span>
        <button
          type="button"
          class="pdf-remove-badge"
          onclick="removeFile(${index})"
          title="Hapus file"
        >
          <i class='bx bx-x'></i>
        </button>

        <div class="pdf-thumb-box" id="pdf-thumb-${index}">
          <i class='bx bxs-file-pdf pdf-thumb-fallback'></i>
          <span class="pdf-thumb-loading">Memuat...</span>
        </div>

        <span class="pdf-file-name" title="${file.name}">${file.name}</span>
      `;

      li.addEventListener("dragstart", () => {
        draggedIndex = index;
        li.classList.add("dragging");
      });

      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        li.classList.add("drag-target");
      });

      li.addEventListener("dragleave", () => {
        li.classList.remove("drag-target");
      });

      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.classList.remove("drag-target");
        const targetIndex = Number(li.dataset.index);

        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          const [movedItem] = uploadedFiles.splice(draggedIndex, 1);
          uploadedFiles.splice(targetIndex, 0, movedItem);
          renderFileList();
        }
      });

      li.addEventListener("dragend", () => {
        draggedIndex = null;
        li.classList.remove("dragging");
        document
          .querySelectorAll(".pdf-file-item")
          .forEach((el) => el.classList.remove("drag-target"));
      });

      selectedFilesList.appendChild(li);

      const thumbBox = li.querySelector(`#pdf-thumb-${index}`);
      renderPdfThumbnail(file, thumbBox);
    });
  } else {
    fileListContainer.style.display = "none";
    fileCountSpan.textContent = "0 file";
  }
}

window.removeFile = function (index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
};

if (clearButton) {
  clearButton.addEventListener("click", () => {
    uploadedFiles = [];
    fileInput.value = "";
    renderFileList();
  });
}

mergeBtn.addEventListener("click", async () => {
  if (uploadedFiles.length < 2) {
    alert("Pilih minimal 2 file PDF untuk digabungkan!");
    return;
  }

  if (!window.PDFLib) {
    alert(
      "Library pdf-lib belum termuat. Cek koneksi internet atau tag script CDN.",
    );
    return;
  }

  const originalText = mergeBtn.innerHTML;
  mergeBtn.disabled = true;
  mergeBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Menggabungkan...`;

  try {
    const { PDFDocument } = window.PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of uploadedFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices(),
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged-document.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("Gagal menggabungkan PDF:", error);
    alert(
      "Terjadi kesalahan saat menggabungkan file PDF. Pastikan file tidak terproteksi password.",
    );
  } finally {
    mergeBtn.disabled = false;
    mergeBtn.innerHTML = originalText;
  }
});
