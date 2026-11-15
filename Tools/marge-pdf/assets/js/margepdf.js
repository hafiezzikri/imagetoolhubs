const fileInput = document.getElementById("pdf-file-input");
const fileListContainer = document.getElementById("file-list-container");
const selectedFilesList = document.getElementById("selected-files");
const fileCountSpan = document.getElementById("file-count");
const mergeBtn = document.getElementById("merge-btn");

let uploadedFiles = [];

fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  files.forEach((file) => {
    if (file.type === "application/pdf") {
      uploadedFiles.push(file);
    }
  });

  renderFileList();
});

function renderFileList() {
  selectedFilesList.innerHTML = "";

  if (uploadedFiles.length > 0) {
    fileListContainer.style.display = "block";
    fileCountSpan.textContent = uploadedFiles.length;

    uploadedFiles.forEach((file, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>📄 ${file.name}</span>
        <button onclick="removeFile(${index})"><i class='bx bx-trash'></i></button>
      `;
      selectedFilesList.appendChild(li);
    });
  } else {
    fileListContainer.style.display = "none";
  }
}

window.removeFile = function (index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
};

mergeBtn.addEventListener("click", () => {
  if (uploadedFiles.length < 2) {
    alert("Pilih minimal 2 file PDF untuk digabungkan!");
    return;
  }

  alert(
    "Fitur pemrosesan PDF aktif! Selanjutnya kita integrasikan library pdf-lib.",
  );
});
