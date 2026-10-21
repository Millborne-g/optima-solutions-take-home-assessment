// Mock for server-only package in Vitest environment.
// The real package throws when imported outside a server bundle;
// this no-op allows unit tests to import server modules safely.
export {};
