const copyBtn = document.getElementById("copy-command");
const commandText = document.getElementById("command-text");
const copyStatus = document.getElementById("copy-status");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

if (copyBtn && commandText && copyStatus) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(commandText.textContent ?? "");
      copyStatus.textContent = "Command copied.";
      window.setTimeout(() => {
        copyStatus.textContent = "";
      }, 1600);
    } catch {
      copyStatus.textContent = "Clipboard failed. Copy manually.";
    }
  });
}

const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.18 },
);

for (const el of revealEls) {
  observer.observe(el);
}
