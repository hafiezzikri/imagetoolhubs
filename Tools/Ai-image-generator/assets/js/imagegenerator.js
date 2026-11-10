window.generateImage = async function () {
  const promptText = document.getElementById("promptInput").value.trim();
  if (!promptText) {
    alert("Please enter a prompt first!");
    return;
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
    // Menggunakan Pollinations AI (Tanpa API Key, langsung jadi URL gambar)
    const encodedPrompt = encodeURIComponent(promptText);
    // Tambahkan &nologo=true di ujung URL untuk menghilangkan watermark
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    // Validasi apakah gambar berhasil dimuat
    const img = new Image();
    img.src = imageUrl;

    img.onload = async function () {
      // Ambil sebagai blob agar fungsi download tetap berfungsi normal
      const response = await fetch(imageUrl);
      generatedBlob = await response.blob();

      outputImg.src = imageUrl;
      loadingSpinner.style.display = "none";
      resultBox.style.display = "block";
    };

    img.onerror = function () {
      throw new Error("Gagal memuat gambar dari server AI.");
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    loadingSpinner.style.display = "none";
    promptBox.style.display = "flex";
    alert("❌ Gagal: " + error.message);
  }
};
