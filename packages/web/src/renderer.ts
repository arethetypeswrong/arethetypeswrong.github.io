import { type ProblemKind, type ResolutionKind, type ResolutionProblemKind } from "are-the-types-wrong-core";
import { allResolutionKinds } from "are-the-types-wrong-core/utils";
import { computed, state, subscribe } from "./state";

interface Events {
  onPackageNameInput: (value: string) => void;
  onCheck: () => void;
  onSelectFile: (blob: Blob) => void;
}

const problemEmoji: Record<ProblemKind, string> = {
  NoTypes: "",
  Wildcard: "❔",
  NoResolution: "💀",
  UntypedResolution: "❌",
  FalseCJS: "🎭",
  FalseESM: "👺",
  CJSResolvesToESM: "😵‍💫",
};

const problemShortDescriptions: Record<ResolutionProblemKind, string> = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
};

const resolutionKinds: Record<ResolutionKind, string> = {
  node10: "<code>node10</code>",
  "node16-cjs": "<code>node16</code> (from CJS)",
  "node16-esm": "<code>node16</code> (from ESM)",
  bundler: "<code>bundler</code>",
};

const moduleKinds = {
  1: "(CJS)",
  99: "(ESM)",
  "": "",
};

export function subscribeRenderer(events: Events) {
  document.addEventListener("DOMContentLoaded", () => {
    const packageNameInput = document.getElementById("package-spec") as HTMLInputElement;
    const messageElement = document.getElementById("message") as HTMLDivElement;
    const checkButton = document.getElementById("check") as HTMLButtonElement;
    const fileInput = document.getElementById("file") as HTMLInputElement;
    const form = document.getElementById("form") as HTMLFormElement;
    const problemsElement = document.getElementById("problems") as HTMLParagraphElement;
    const resolutionsElement = document.getElementById("resolutions") as HTMLTableElement;
    const detailsElement = document.getElementById("details") as HTMLDivElement;
    const detailsPreElement = detailsElement.querySelector("pre") as HTMLPreElement;

    packageNameInput.addEventListener("input", () => {
      events.onPackageNameInput(packageNameInput.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      events.onCheck();
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files?.length) {
        events.onSelectFile(fileInput.files[0]);
      }
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
        const { analysis, problemSummaries, resolutionProblems } = state.checks.data;
        detailsPreElement.textContent = JSON.stringify(analysis, null, 2);
        if (problemSummaries.length) {
          problemsElement.innerHTML = `<dl>${problemSummaries
            .flatMap((problem) =>
              problem.kind === "NoTypes"
                ? []
                : problem.messages.map((message) => {
                    return `<dt>${problemEmoji[problem.kind]}</dt><dd>${message.messageHtml}</dd>`;
                  })
            )
            .join("")}</dl>`;
        } else {
          problemsElement.textContent = "No problems found 🌟";
        }

        if (analysis.containsTypes) {
          const subpaths = Object.keys(analysis.entrypointResolutions);
          const entrypoints = subpaths.map((s) =>
            s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`
          );
          resolutionsElement.className = "";
          resolutionsElement.innerHTML = `
            <thead>
              <tr>
                <th></th>
                ${entrypoints.map((entrypoint) => `<th><code>"${entrypoint}"</code></th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${allResolutionKinds
                .map(
                  (resolutionKind) => `
                <tr>
                  <td>${resolutionKinds[resolutionKind]}</td>
                  ${subpaths
                    .map((subpath) => {
                      const problems = resolutionProblems.filter(
                        (problem) => problem.entrypoint === subpath && problem.resolutionKind === resolutionKind
                      );
                      return `<td>${
                        problems.length
                          ? problems.map((problem) => problemShortDescriptions[problem.kind]).join("<br />")
                          : "✅ " +
                            moduleKinds[
                              analysis.entrypointResolutions[subpath][resolutionKind].resolution?.moduleKind || ""
                            ]
                      }</td>`;
                    })
                    .join("")}
                </tr>`
                )
                .join("")}
              </tbody>`;
        }
      } else {
        clearResult();
      }
    });

    function clearResult() {
      detailsElement.className = "display-none";
      detailsPreElement.textContent = null;
      problemsElement.textContent = null;
      resolutionsElement.className = "display-none";
    }

    function clearMessage() {
      messageElement.textContent = null;
      messageElement.className = "";
    }
  });
}
