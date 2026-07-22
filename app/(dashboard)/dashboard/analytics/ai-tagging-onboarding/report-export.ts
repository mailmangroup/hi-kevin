import type { AiTaggingReport } from "@/lib/api/ai-tagging-onboarding"

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "ai-tagging-report"
}

function pageStyles() {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      const css = Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n")
      return `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`
    } catch {
      return sheet.href ? `<link rel="stylesheet" href="${sheet.href}">` : ""
    }
  }).join("\n")
}

export function downloadAiTaggingHtml(report: AiTaggingReport) {
  const reportElement = document.getElementById("ai-tagging-report")
  if (!reportElement) throw new Error("The report is not ready to download.")

  const clone = reportElement.cloneNode(true) as HTMLElement

  const title = `${report.brand.name || report.brand.id} — AI Tagging Onboarding Analysis`
  const html = `<!doctype html>
<html lang="en" class="${document.documentElement.className}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${window.location.origin}/">
  <title>${title.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] || character)}</title>
  ${pageStyles()}
  <style>
    body { margin: 0; padding: 32px; }
    .ai-tagging-export { width: min(1200px, 100%); margin: 0 auto; }
    @media (max-width: 640px) { body { padding: 16px; } }
    @media print { body { padding: 0; } [data-report-tabs] { display: none !important; } [data-report-panel] { display: block !important; break-before: page; } [data-report-panel]:first-of-type { break-before: auto; } }
  </style>
</head>
<body class="${document.body.className}">
  <main class="ai-tagging-export">${clone.outerHTML}</main>
  <script>
    (() => {
      const tabs = Array.from(document.querySelectorAll("[data-report-tab]"));
      const panels = Array.from(document.querySelectorAll("[data-report-panel]"));

      const selectTab = (value, moveFocus = false) => {
        tabs.forEach((tab) => {
          const isActive = tab.dataset.reportTab === value;
          tab.dataset.state = isActive ? "active" : "inactive";
          tab.setAttribute("aria-selected", String(isActive));
          tab.tabIndex = isActive ? 0 : -1;
          if (isActive && moveFocus) tab.focus();
        });
        panels.forEach((panel) => {
          panel.hidden = panel.dataset.reportPanel !== value;
        });
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectTab(tab.dataset.reportTab));
        tab.addEventListener("keydown", (event) => {
          let nextIndex;
          if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
          if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = tabs.length - 1;
          if (nextIndex === undefined) return;
          event.preventDefault();
          selectTab(tabs[nextIndex].dataset.reportTab, true);
        });
      });

      const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
      if (selectedTab) selectTab(selectedTab.dataset.reportTab);
    })();
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${safeFilename(report.brand.name || report.brand.id)}-ai-tagging-onboarding.html`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
