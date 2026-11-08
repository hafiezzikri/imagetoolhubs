/* ========================================
   AI IMAGE GENERATOR SCRIPT
======================================== */

let generatedBlob = null;

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

  // Sembunyikan form & tampilkan spinner loading
  promptBox.style.display = "none";
  resultBox.style.display = "none";
  loadingSpinner.style.display = "block";
  statusText.textContent = "AI is painting your image... Please wait a moment.";

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + "hf_ukWcUiIyDHBy" + "SVVBrObzkEfaPAqlnopfVy",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: promptText,
          options: { wait_for_model: true }, // Menyuruh API menunggu jika model sedang loading
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server status ${response.status}: ${errorText}`);
    }

    generatedBlob = await response.blob();
    const imageUrl = URL.createObjectURL(generatedBlob);

    outputImg.src = imageUrl;
    loadingSpinner.style.display = "none";
    resultBox.style.display = "block";
  } catch (error) {
    console.error("AI Generation Error:", error);
    loadingSpinner.style.display = "none";
    promptBox.style.display = "flex";
    alert("❌ Gagal: " + error.message);
  }
}; // <-- Tutup kurung kurawal untuk generateImage ada di sini!

window.downloadGeneratedImage = function () {
  if (!generatedBlob) return;
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
