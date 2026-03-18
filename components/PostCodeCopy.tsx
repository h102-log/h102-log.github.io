"use client";

import { useEffect } from "react";

export default function PostCodeCopy() {
  useEffect(() => {
    const handleCodeCopy = async (event: MouseEvent) => {
      const clickedElement = event.target as HTMLElement | null;
      const copyButton = clickedElement?.closest(
        ".post-code-copy-button",
      ) as HTMLButtonElement | null;

      if (!copyButton) {
        return;
      }

      const codeBlock = copyButton.closest(".post-code-block");
      const codeElement = codeBlock?.querySelector("pre code");
      const copiedText = codeElement?.textContent ?? "";

      if (!copiedText.trim()) {
        return;
      }

      const originalLabel = copyButton.textContent ?? "Copy";

      try {
        await navigator.clipboard.writeText(copiedText);
        copyButton.textContent = "Copied";
        copyButton.classList.add("post-code-copy-button-copied");
      } catch {
        copyButton.textContent = "Failed";
      }

      window.setTimeout(() => {
        copyButton.textContent = originalLabel;
        copyButton.classList.remove("post-code-copy-button-copied");
      }, 1500);
    };

    document.addEventListener("click", handleCodeCopy);

    return () => {
      document.removeEventListener("click", handleCodeCopy);
    };
  }, []);

  return null;
}
