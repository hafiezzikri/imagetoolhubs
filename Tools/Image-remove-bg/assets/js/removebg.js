import { removeBackground } from "https://esm.sh/@imgly/background-removal@1.4.5";

let processedBlob = null;

window.processImage = async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadArea = document.getElementById("uploadArea");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const resultBox = document.getElementById("resultBox");
  const outputImg = document.getElementById("outputImg");
  const statusText = document.getElementById("statusText");

  // Sembunyikan area upload & hasil sebelumnya, lalu tampilkan spinner loading
  uploadArea.style.display = "none";
  resultBox.style.display = "none";
  loadingSpinner.style.display = "block";
  statusText.innerHTML = "⏳ Mengunduh model AI & memproses gambar...";

  try {
    processedBlob = await removeBackground(file);
    const url = URL.createObjectURL(processedBlob);

    outputImg.src = url;

    // Sembunyikan spinner, tampilkan hasil
    loadingSpinner.style.display = "none";
    resultBox.style.display = "block";
    uploadArea.style.display = "block"; // Munculkan kembali area upload jika ingin edit foto lain
  } catch (error) {
    console.error("Remove BG Error:", error);
    loadingSpinner.style.display = "none";
    uploadArea.style.display = "block";
    alert(
      "❌ Gagal memproses gambar: " + (error.message || "Terjadi kesalahan."),
    );
  }
};

window.downloadImage = function (format) {
  if (!processedBlob) return;

  const img = document.getElementById("outputImg");
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");

  if (format === "jpg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  let mimeType = "image/png";
  let extension = "png";

  if (format === "jpg") {
    mimeType = "image/jpeg";
    extension = "jpg";
  } else if (format === "webp") {
    mimeType = "image/webp";
    extension = "webp";
  }

  const dataUrl = canvas.toDataURL(mimeType, 0.9);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `image-no-bg.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
