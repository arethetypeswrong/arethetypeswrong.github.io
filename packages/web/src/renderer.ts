import { subscribe, type State } from "./state";
import { updateView } from "./utils/updateView";
import { CheckButton } from "./views/CheckButton";
import { ChecksTable } from "./views/ChecksTable";
import { Details } from "./views/Details";
import { Message } from "./views/Message";
import { ProblemList } from "./views/ProblemList";
import corePackageJson from "are-the-types-wrong-core/package.json";
import tsPackageJson from "typescript/package.json";

interface Events {
  onPackageNameInput: (value: string) => void;
  onCheck: () => void;
  onSelectFile: (blob: Blob) => void;
}

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
    const webVersionElement = document.getElementById("web-version") as HTMLAnchorElement;
    const coreVersionElement = document.getElementById("core-version") as HTMLElement;
    const tsVersionElement = document.getElementById("ts-version") as HTMLElement;

    coreVersionElement.innerText = `v${corePackageJson.version}`;
    tsVersionElement.innerText = `v${tsPackageJson.version}`;
    webVersionElement.innerText = COMMIT;
    webVersionElement.href = `https://github.com/arethetypeswrong/arethetypeswrong.github.io/commit/${COMMIT}`;

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

    subscribe(render);

    function render(state: State) {
      updateView(messageElement, Message, { isError: state.message?.isError, text: state.message?.text || "" });
      updateView(problemsElement, ProblemList, {
        problems: state.checks?.problemSummaries,
        containsTypes: state.checks?.analysis.containsTypes,
      });
      updateView(resolutionsElement, ChecksTable, { checks: state.checks });
      updateView(checkButton, CheckButton, { disabled: !state.packageInfo.info });
      updateView(detailsElement, Details, { analysis: state.checks?.analysis });
    }
  });
}
