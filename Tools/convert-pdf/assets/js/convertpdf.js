/* ========================================
   TAB SWITCHING
======================================== */
const tabButtons = document.querySelectorAll(".convert-tab");
const panelImgToPdf = document.getElementById("panel-img-to-pdf");
const panelPdfToImg = document.getElementById("panel-pdf-to-img");

function switchTab(tabName) {
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  if (panelImgToPdf) {
    panelImgToPdf.style.display = tabName === "img-to-pdf" ? "" : "none";
  }
  if (panelPdfToImg) {
    panelPdfToImg.style.display = tabName === "pdf-to-img" ? "" : "none";
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTab(btn.dataset.tab);
  });
});

/* ========================================
   MODE 1: GAMBAR KE PDF
======================================== */
const imgUploadArea = document.getElementById("imgUploadArea");
const imgFileInput = document.getElementById("img-file-input");
const imgEditorContainer = document.getElementById("img-editor-container");
const selectedImagesList = document.getElementById("selected-images");
const imgCountText = document.getElementById("img-count-text");
const pageOrientationSelect = document.getElementById("pageOrientationSelect");
const clearImagesBtn = document.getElementById("clearImagesBtn");
const convertImgToPdfBtn = document.getElementById("convertImgToPdfBtn");

let imageItems = []; // { id, file, url }
let draggedImgId = null;

function isSupportedImage(file) {
  return (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function renderImagesGrid() {
  if (!selectedImagesList) return;

  if (imageItems.length === 0) {
    imgEditorContainer.style.display = "none";
    imgUploadArea.style.display = "";
    selectedImagesList.innerHTML = "";
    return;
  }

  imgUploadArea.style.display = "none";
  imgEditorContainer.style.display = "block";
  imgCountText.textContent = `${imageItems.length} gambar`;
  selectedImagesList.innerHTML = "";

  imageItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "convert-item-card draggable";
    li.draggable = true;
    li.dataset.id = item.id;

    li.innerHTML = `
      <span class="item-order-badge">${index + 1}</span>
      <button type="button" class="item-remove-badge" title="Hapus gambar">
        <i class='bx bx-x'></i>
      </button>
      <div class="item-thumb-box">
        <img src="${item.url}" alt="${item.file.name}" class="item-thumb-img" />
      </div>
      <span class="item-name" title="${item.file.name}">${item.file.name}</span>
    `;

    li.querySelector(".item-remove-badge").addEventListener("click", (e) => {
      e.stopPropagation();
      URL.revokeObjectURL(item.url);
      imageItems = imageItems.filter((img) => img.id !== item.id);
      renderImagesGrid();
    });

    li.addEventListener("dragstart", () => {
      draggedImgId = item.id;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      draggedImgId = null;
      li.classList.remove("dragging");
      document
        .querySelectorAll("#selected-images .convert-item-card")
        .forEach((el) => el.classList.remove("drag-target"));
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedImgId && draggedImgId !== item.id) {
        li.classList.add("drag-target");
      }
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-target");
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-target");
      if (!draggedImgId || draggedImgId === item.id) return;

      const fromIdx = imageItems.findIndex((i) => i.id === draggedImgId);
      const toIdx = imageItems.findIndex((i) => i.id === item.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = imageItems.splice(fromIdx, 1);
      imageItems.splice(toIdx, 0, moved);
      renderImagesGrid();
    });

    selectedImagesList.appendChild(li);
  });
}

function addImageFiles(fileList) {
  const validFiles = Array.from(fileList).filter(isSupportedImage);
  if (validFiles.length === 0) {
    alert("Pilih file gambar berformat JPG, PNG, atau WebP.");
    return;
  }

  validFiles.forEach((file) => {
    imageItems.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      url: URL.createObjectURL(file),
    });
  });

  renderImagesGrid();
}

if (imgFileInput) {
  imgFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addImageFiles(e.target.files);
    }
    imgFileInput.value = "";
  });
}

if (imgUploadArea) {
  ["dragenter", "dragover"].forEach((ev) => {
    imgUploadArea.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      imgUploadArea.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((ev) => {
    imgUploadArea.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      imgUploadArea.classList.remove("drag-over");
    });
  });

  imgUploadArea.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) {
      addImageFiles(e.dataTransfer.files);
    }
  });
}

if (clearImagesBtn) {
  clearImagesBtn.addEventListener("click", () => {
    imageItems.forEach((item) => URL.revokeObjectURL(item.url));
    imageItems = [];
    renderImagesGrid();
  });
}

function fileToJpegBytes(file, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengonversi gambar ke JPEG"));
            return;
          }
          const arrBuf = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(arrBuf),
            width: canvas.width,
            height: canvas.height,
          });
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Gagal memuat gambar ${file.name}`));
    };

    img.src = objectUrl;
  });
}

function applyOrientation(width, height, mode) {
  if (mode === "portrait" && width > height) {
    return { w: height, h: width };
  }
  if (mode === "landscape" && height > width) {
    return { w: height, h: width };
  }
  return { w: width, h: height };
}

if (convertImgToPdfBtn) {
  convertImgToPdfBtn.addEventListener("click", async () => {
    if (imageItems.length === 0) {
      alert("Pilih minimal 1 gambar terlebih dahulu.");
      return;
    }

    if (!window.PDFLib) {
      alert("Library pdf-lib belum termuat.");
      return;
    }

    const originalHtml = convertImgToPdfBtn.innerHTML;
    convertImgToPdfBtn.disabled = true;
    convertImgToPdfBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Membuat PDF...`;

    try {
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const orientationMode = pageOrientationSelect
        ? pageOrientationSelect.value
        : "auto";

      for (const item of imageItems) {
        const { bytes, width, height } = await fileToJpegBytes(item.file, 0.9);
        const jpgImage = await pdfDoc.embedJpg(bytes);
        const dims = applyOrientation(width, height, orientationMode);
        const page = pdfDoc.addPage([dims.w, dims.h]);

        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: dims.w,
          height: dims.h,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gambar-ke-pdf-${getTimestamp()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      alert("Terjadi kesalahan saat mengonversi gambar ke PDF.");
    } finally {
      convertImgToPdfBtn.disabled = false;
      convertImgToPdfBtn.innerHTML = originalHtml;
    }
  });
}

/* ========================================
   MODE 2: PDF KE GAMBAR
======================================== */
const pdfConvertUploadArea = document.getElementById("pdfConvertUploadArea");
const pdfConvertInput = document.getElementById("pdf-convert-input");
const pdfToImgEditor = document.getElementById("pdf-to-img-editor");
const pdfRenderedPagesList = document.getElementById("pdf-rendered-pages");
const pdfConvertFileNameEl = document.getElementById("pdfConvertFileName");
const pdfConvertPageCountEl = document.getElementById("pdfConvertPageCount");
const imageFormatSelect = document.getElementById("imageFormatSelect");
const imageScaleSelect = document.getElementById("imageScaleSelect");
const resetPdfToImgBtn = document.getElementById("resetPdfToImgBtn");
const downloadAllImagesBtn = document.getElementById("downloadAllImagesBtn");

let currentPdfFile = null;
let currentPdfArrayBuffer = null;
let renderedCanvases = []; // { pageNum, canvas }

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function isPdf(file) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function downloadCanvasImage(canvas, filename, mimeType) {
  const quality = mimeType === "image/jpeg" ? 0.9 : undefined;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function renderPdfPagesForExport() {
  if (!currentPdfArrayBuffer || !window.pdfjsLib) return;

  const scale = imageScaleSelect ? Number(imageScaleSelect.value) : 2.0;
  const pdfDoc = await window.pdfjsLib.getDocument({
    data: currentPdfArrayBuffer.slice(0),
  }).promise;

  const numPages = pdfDoc.numPages;
  pdfConvertPageCountEl.textContent = `${numPages} halaman`;
  pdfRenderedPagesList.innerHTML = "";
  renderedCanvases = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const viewport = page.getViewport({ scale });

    const fullCanvas = document.createElement("canvas");
    const fullCtx = fullCanvas.getContext("2d");
    fullCanvas.width = Math.max(1, Math.floor(viewport.width));
    fullCanvas.height = Math.max(1, Math.floor(viewport.height));

    await page.render({
      canvasContext: fullCtx,
      viewport,
    }).promise;

    renderedCanvases.push({ pageNum: p, canvas: fullCanvas });

    // Canvas kecil untuk pratinjau grid
    const previewScale = 150 / viewport.width;
    const previewViewport = page.getViewport({ scale: previewScale });
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = previewViewport.width;
    thumbCanvas.height = previewViewport.height;
    thumbCanvas.className = "item-thumb-canvas";
    thumbCanvas.getContext("2d").drawImage(
      fullCanvas,
      0,
      0,
      thumbCanvas.width,
      thumbCanvas.height,
    );

    const li = document.createElement("li");
    li.className = "convert-item-card";
    li.innerHTML = `
      <span class="item-order-badge">${p}</span>
      <div class="item-thumb-box"></div>
      <span class="item-name">Halaman ${p}</span>
      <button type="button" class="single-download-btn">Unduh Halaman</button>
    `;

    li.querySelector(".item-thumb-box").appendChild(thumbCanvas);
    li.querySelector(".single-download-btn").addEventListener("click", () => {
      const mimeType = imageFormatSelect ? imageFormatSelect.value : "image/jpeg";
      const ext = mimeType === "image/png" ? "png" : "jpg";
      const baseName = (currentPdfFile?.name || "dokumen").replace(
        /\.pdf$/i,
        "",
      );
      downloadCanvasImage(
        fullCanvas,
        `${baseName}-hal-${p}-${getTimestamp()}.${ext}`,
        mimeType,
      );
    });

    pdfRenderedPagesList.appendChild(li);
  }
}

async function handlePdfFileSelect(file) {
  if (!isPdf(file)) {
    alert("Pilih file berformat PDF.");
    return;
  }

  if (!window.pdfjsLib) {
    alert("Library PDF.js belum termuat.");
    return;
  }

  try {
    currentPdfFile = file;
    const buf = await file.arrayBuffer();
    currentPdfArrayBuffer = buf.slice(0);

    pdfConvertFileNameEl.textContent = file.name;
    pdfConvertUploadArea.style.display = "none";
    pdfToImgEditor.style.display = "block";

    await renderPdfPagesForExport();
  } catch (err) {
    console.error("Gagal memuat PDF:", err);
    alert("Gagal membaca file PDF.");
  }
}

if (pdfConvertInput) {
  pdfConvertInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfFileSelect(e.target.files[0]);
    }
    pdfConvertInput.value = "";
  });
}

if (pdfConvertUploadArea) {
  ["dragenter", "dragover"].forEach((ev) => {
    pdfConvertUploadArea.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      pdfConvertUploadArea.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((ev) => {
    pdfConvertUploadArea.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      pdfConvertUploadArea.classList.remove("drag-over");
    });
  });

  pdfConvertUploadArea.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFileSelect(e.dataTransfer.files[0]);
    }
  });
}

if (imageScaleSelect) {
  imageScaleSelect.addEventListener("change", () => {
    if (currentPdfArrayBuffer) {
      renderPdfPagesForExport();
    }
  });
}

if (resetPdfToImgBtn) {
  resetPdfToImgBtn.addEventListener("click", () => {
    currentPdfFile = null;
    currentPdfArrayBuffer = null;
    renderedCanvases = [];
    pdfRenderedPagesList.innerHTML = "";
    pdfToImgEditor.style.display = "none";
    pdfConvertUploadArea.style.display = "";
  });
}

if (downloadAllImagesBtn) {
  downloadAllImagesBtn.addEventListener("click", async () => {
    if (renderedCanvases.length === 0) {
      alert("Belum ada halaman PDF yang siap diunduh.");
      return;
    }

    const mimeType = imageFormatSelect ? imageFormatSelect.value : "image/jpeg";
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const baseName = (currentPdfFile?.name || "dokumen").replace(
      /\.pdf$/i,
      "",
    );
    const stamp = getTimestamp();

    const originalHtml = downloadAllImagesBtn.innerHTML;
    downloadAllImagesBtn.disabled = true;
    downloadAllImagesBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Mengunduh...`;

    try {
      for (const item of renderedCanvases) {
        downloadCanvasImage(
          item.canvas,
          `${baseName}-hal-${item.pageNum}-${stamp}.${ext}`,
          mimeType,
        );
        await new Promise((r) => setTimeout(r, 220));
      }
    } finally {
      downloadAllImagesBtn.disabled = false;
      downloadAllImagesBtn.innerHTML = originalHtml;
    }
  });
}