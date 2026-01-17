export {};

declare global {
  interface Window {
    rybbit?: {
      event?: (action: string) => void;
    };
  }
}
