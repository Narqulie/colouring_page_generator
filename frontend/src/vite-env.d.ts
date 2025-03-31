/// <reference types="vite/client" />

declare module '*/package.json' {
  interface PackageJson {
    version: string;
    // Add other package.json fields if needed
  }
  const value: PackageJson;
  export default value;
}
