import { computed, state, subscribe } from './state';

interface Events {
  onPackageNameInput: (value: string) => void;
  onCheck: () => void;
}

export function subscribeRenderer(events: Events) {
  document.addEventListener('DOMContentLoaded', () => {
    const packageNameInput = document.getElementById('package-name') as HTMLInputElement;
    const messageElement = document.getElementById('message') as HTMLDivElement;
    const checkButton = document.getElementById('check') as HTMLButtonElement;
    const resultElement = document.getElementById('result') as HTMLDivElement;

    packageNameInput.addEventListener('input', () => {
      events.onPackageNameInput(packageNameInput.value);
    });

    checkButton.addEventListener('click', () => {
      events.onCheck();
    });

    computed('packageInfo', ({ info, parsed }) => {
      if (info?.status === 'success') {
        return {
          className: undefined,
          text: info.data.size
            ? `Checking will stream whatever ${info.data.size} bytes gzipped is`
            : `Checking will stream the gzipped package`,
        };
      }
      if (parsed?.error) {
        return {
          className: 'error',
          text: parsed.error,
        };
      }
      if (info?.error) {
        return {
          className: 'error',
          text: info.error,
        };
      }
    }, message => {
      messageElement.textContent = message?.text ?? null;
      messageElement.className = message?.className ?? '';
    });
    
    subscribe('packageInfo.info.status', () => {
      if (state.packageInfo.info?.status === 'success') {
        checkButton.className = '';
      }
      else {
        checkButton.className = 'display-none';
      }
    });

    subscribe('checks', () => {
      if (state.checks?.status === 'success') {
        resultElement.textContent = JSON.stringify(state.checks.data, null, 2);
      }
      else {
        resultElement.textContent = null;
      }
    });
  });
}