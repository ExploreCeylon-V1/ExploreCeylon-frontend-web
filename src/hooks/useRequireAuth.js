import { createContext, useContext } from "react";

export const AuthPromptContext = createContext(null);

export function useRequireAuth() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx)
    throw new Error("useRequireAuth must be used within AuthPromptProvider");
  return ctx;
}
