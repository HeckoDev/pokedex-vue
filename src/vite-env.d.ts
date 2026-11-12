/// <reference types="vite/client" />

declare module "*.json" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON shape is validated by consumers
  const value: any;
  export default value;
}
