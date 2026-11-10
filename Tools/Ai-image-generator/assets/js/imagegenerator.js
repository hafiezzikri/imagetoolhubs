/* ========================================
   AI IMAGE GENERATOR SCRIPT (POLLINATIONS)
======================================== */

let generatedBlob = null;

window.generateImage = async function () {
  const promptText = document.getElementById("promptInput").value.trim();
  if (!promptText) {
    alert("Please enter a prompt first!");
    return;
  }

  // Ambil pilihan rasio dari dropdown (jika ada, default ke 1024x1024)
  const ratioSelect = document.getElementById("aspectRatio");
  let width = 1024;
  let height = 1024;

  if (ratioSelect) {
    const dimensions = ratioSelect.value.split("x");
    width = dimensions[0];
    height = dimensions[1];
  }

  const promptBox = document.getElementById("promptBox");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const resultBox = document.getElementById("resultBox");
  const outputImg = document.getElementById("outputImg");
  const statusText = document.getElementById("statusText");

  promptBox.style.display = "none";
  resultBox.style.display = "none";
  loadingSpinner.style.display = "block";
  statusText.textContent = "AI is painting your image... Please wait a moment.";

  try {
    const encodedPrompt = encodeURIComponent(promptText);
    // URL dengan ukuran dinamis dan tanpa logo/watermark (&nologo=true)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Mencegah masalah CORS saat di-download
    img.src = imageUrl;

    img.onload = async function () {
      try {
        // Ubah gambar ke bentuk blob menggunakan canvas agar tombol download pasti berfungsi
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(function (blob) {
          generatedBlob = blob;
          outputImg.src = imageUrl;
          loadingSpinner.style.display = "none";
          resultBox.style.display = "block";
        }, "image/png");
      } catch (err) {
        // Fallback jika canvas diblokir, tetap tampilkan gambar
        outputImg.src = imageUrl;
        loadingSpinner.style.display = "none";
        resultBox.style.display = "block";
      }
    };

    img.onerror = function () {
      throw new Error("Gagal memuat gambar dari server AI. Coba prompt lain.");
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    loadingSpinner.style.display = "none";
    promptBox.style.display = "flex";
    alert("❌ Gagal: " + error.message);
  }
};

window.downloadGeneratedImage = function () {
  if (!generatedBlob) {
    // Fallback jika blob kosong tapi gambar sudah tampil
    const outputImg = document.getElementById("outputImg");
    if (outputImg && outputImg.src) {
      const link = document.createElement("a");
      link.href = outputImg.src;
      link.download = "ai-generated-art.png";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Belum ada gambar yang digenerate!");
    }
    return;
  }

  const downloadURL = URL.createObjectURL(generatedBlob);
  const link = document.createElement("a");
  link.href = downloadURL;
  link.download = "ai-generated-art.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadURL);
};

window.resetGenerator = function () {
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("promptBox").style.display = "flex";
  document.getElementById("promptInput").value = "";
  generatedBlob = null;
};
