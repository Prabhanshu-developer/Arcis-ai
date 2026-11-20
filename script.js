/*
  ARCIS WEBSITE SETTINGS
  Local APK: keep the APK at downloads/arcis.apk.
  Hosted release: replace DOWNLOAD_URL with your direct APK release URL.
*/
const ARCIS_CONFIG = {
  version: "1.0",
  minimumAndroid: "Android 8.0+",
  downloadUrl: "downloads/arcis.apk"
};

document.querySelectorAll("[data-version]").forEach(el => el.textContent = ARCIS_CONFIG.version);
document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

const downloadButton = document.getElementById("downloadButton");
const downloadNote = document.getElementById("downloadNote");
downloadButton.href = ARCIS_CONFIG.downloadUrl;

// If no APK exists at the configured URL, the host will show a 404.
// Keep the file in downloads/arcis.apk before publishing.
downloadButton.addEventListener("click", () => {
  if (ARCIS_CONFIG.downloadUrl === "downloads/arcis.apk") {
    downloadNote.textContent = "If the download does not start, the APK may not have been uploaded yet.";
  }
});
