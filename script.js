// Update these values whenever you publish a new ARCIS release.
const ARCIS_CONFIG = {
  version: "1.0",
  downloadUrl: "https://github.com/Prabhanshu-developer/arcis-website/releases/download/v1.0/arcis.apk"
};

document.querySelectorAll("[data-version]").forEach((node) => {
  node.textContent = ARCIS_CONFIG.version;
});

const downloadButton = document.getElementById("downloadButton");
if (downloadButton) {
  downloadButton.href = ARCIS_CONFIG.downloadUrl;
}

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});
