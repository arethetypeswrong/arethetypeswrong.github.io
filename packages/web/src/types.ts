export {};

declare global {
  const COMMIT: string;
  interface Navigator {
    connection?: {
      saveData: boolean;
    };
  }
}
