import { computed, state, subscribe } from "./state";

interface Events {
  onPackageNameInput: (value: string) => void;
  onCheck: () => void;
}

export function subscribeRenderer(events: Events) {
  document.addEventListener("DOMContentLoaded", () => {
    const packageNameInput = document.getElementById("package-name") as HTMLInputElement;
    const messageElement = document.getElementById("message") as HTMLDivElement;
    const checkButton = document.getElementById("check") as HTMLButtonElement;
    const form = document.getElementById("form") as HTMLFormElement;
    const problemsElement = document.getElementById("problems") as HTMLParagraphElement;
    const detailsElement = document.getElementById("details") as HTMLDivElement;
    const detailsPreElement = detailsElement.querySelector("pre") as HTMLPreElement;

    packageNameInput.addEventListener("input", () => {
      events.onPackageNameInput(packageNameInput.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      events.onCheck();
    });

    computed(
      "packageInfo",
      ({ info, parsed }) => {
        if (parsed?.error) {
          return {
            className: "error",
            text: parsed.error,
          };
        }
        if (info?.error) {
          return {
            className: "error",
            text: info.error,
          };
        }
        if (info?.status === "success") {
          return {
            className: "",
            // Unfortunately, the registry entry only contains the unpacked size, and only
            // sometimes, and a HEAD request of the tarball doesn't send the length. Boo.
            text: info.data.size
              ? `Checking will stream whatever ${info.data.size} bytes gzipped is`
              : `Checking will stream the gzipped package`,
          };
        }
      },
      (message) => {
        messageElement.textContent = message?.text ?? null;
        messageElement.className = message?.className ?? "";
      }
    );

    subscribe("packageInfo.parsed", () => {
      if (state.packageInfo.parsed) {
        clearResult();
      }
    });

    subscribe("packageInfo.info.status", () => {
      if (state.packageInfo.info?.status === "success") {
        checkButton.disabled = false;
      } else {
        checkButton.disabled = true;
      }
    });

    subscribe("checks", () => {
      if (state.checks?.status === "success") {
        clearMessage();
        detailsElement.className = "";
        const { analysis, problems } = state.checks.data;
        detailsPreElement.textContent = JSON.stringify(analysis, null, 2);
        if (problems.length) {
          problemsElement.innerHTML = `<ul>${problems
            .map((problem) => {
              return `<li>${problem.messageHtml}</li>`;
            })
            .join("")}</ul>`;
        } else {
          problemsElement.textContent = "No problems found 🌟";
        }
      } else {
        clearResult();
      }
    });

    function clearResult() {
      detailsElement.className = "display-none";
      detailsPreElement.textContent = null;
      problemsElement.textContent = null;
    }

    function clearMessage() {
      messageElement.textContent = null;
      messageElement.className = "";
    }
  });
}
