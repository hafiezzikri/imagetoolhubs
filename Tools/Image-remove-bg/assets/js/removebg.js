import { removeBackground } from "https://esm.sh/@imgly/background-removal@1.4.5";

let originalImg = new Image();
let noBgImg = new Image();
let canvas, ctx;
let isDrawing = false;
let currentMode = "erase"; // 'erase' atau 'restore'
let brushRadius = 20;
let historyStack = [];

window.processImage = async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadArea = document.getElementById("uploadArea");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const resultBox = document.getElementById("resultBox");
  const statusText = document.getElementById("statusText");

  uploadArea.style.display = "none";
  resultBox.style.display = "none";
  loadingSpinner.style.display = "block";
  statusText.innerHTML = "⏳ Mengunduh model AI & memproses gambar...";

  try {
    // 1. Simpan foto asli
    const originalUrl = URL.createObjectURL(file);
    await new Promise((resolve) => {
      originalImg.onload = resolve;
      originalImg.src = originalUrl;
    });

    // 2. Terapkan AI Remove BG
    const blob = await removeBackground(file);
    const noBgUrl = URL.createObjectURL(blob);
    await new Promise((resolve) => {
      noBgImg.onload = resolve;
      noBgImg.src = noBgUrl;
    });

    // 3. Inisialisasi Canvas Editor
    initCanvas();

    loadingSpinner.style.display = "none";
    resultBox.style.display = "block";
    uploadArea.style.display = "block";
  } catch (error) {
    console.error("Remove BG Error:", error);
    loadingSpinner.style.display = "none";
    uploadArea.style.display = "block";
    alert(
      "❌ Gagal memproses gambar: " + (error.message || "Terjadi kesalahan."),
    );
  }
};

function initCanvas() {
  canvas = document.getElementById("editorCanvas");
  ctx = canvas.getContext("2d");

  canvas.width = noBgImg.naturalWidth;
  canvas.height = noBgImg.naturalHeight;

  // Gambar hasil AI pertama kali
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(noBgImg, 0, 0);

  saveState(); // Simpan kondisi awal untuk fitur Undo

  // Event Listener untuk kuas (Mouse & Touch Screen)
  canvas.onmousedown = startDrawing;
  canvas.onmousemove = draw;
  canvas.onmouseup = stopDrawing;
  canvas.onmouseleave = stopDrawing;

  canvas.ontouchstart = (e) => {
    startDrawing(e.touches[0]);
  };
  canvas.ontouchmove = (e) => {
    draw(e.touches[0]);
    e.preventDefault();
  };
  canvas.ontouchend = stopDrawing;
}

function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function startDrawing(e) {
  isDrawing = true;
  saveState();
  draw(e);
}

function draw(e) {
  if (!isDrawing) return;

  const pos = getCanvasCoordinates(e);

  ctx.save();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, brushRadius, 0, Math.PI * 2);
  ctx.clip();

  if (currentMode === "erase") {
    // Mode Hapus
    ctx.clearRect(
      pos.x - brushRadius - 1,
      pos.y - brushRadius - 1,
      brushRadius * 2 + 2,
      brushRadius * 2 + 2,
    );
  } else if (currentMode === "restore") {
    // Mode Kembalikan dari Foto Asli
    ctx.drawImage(originalImg, 0, 0);
  }

  ctx.restore();
}

function stopDrawing() {
  isDrawing = false;
  ctx.beginPath();
}

window.setMode = function (mode) {
  currentMode = mode;
  document
    .getElementById("btnErase")
    .classList.toggle("active", mode === "erase");
  document
    .getElementById("btnRestore")
    .classList.toggle("active", mode === "restore");
};

window.updateBrushSize = function (val) {
  brushRadius = parseInt(val, 10);
  document.getElementById("brushSizeVal").innerText = val + "px";
};

function saveState() {
  if (historyStack.length >= 10) historyStack.shift(); // Batasi maksimal 10 step undo
  historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

window.undoCanvas = function () {
  if (historyStack.length > 1) {
    historyStack.pop(); // Hapus kondisi saat ini
    const previousState = historyStack[historyStack.length - 1];
    ctx.putImageData(previousState, 0, 0);
  }
};

window.downloadImage = function (format) {
  if (!canvas) return;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");

  if (format === "jpg") {
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  tempCtx.drawImage(canvas, 0, 0);

  let mimeType = "image/png";
  let extension = "png";

  if (format === "jpg") {
    mimeType = "image/jpeg";
    extension = "jpg";
  } else if (format === "webp") {
    mimeType = "image/webp";
    extension = "webp";
  }

  const dataUrl = tempCanvas.toDataURL(mimeType, 0.9);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `image-edited.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
