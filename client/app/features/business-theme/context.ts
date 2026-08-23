import { createContext, useContext } from "react";
import type { IBusinessTheme } from "@template/contracts";

export type BusinessThemeContextValue = {
  theme: IBusinessTheme | null;
  title: string | null;
  loginTagline: string | null;
  logoUrl: string | null;
  sidebarStyle: IBusinessTheme["sidebarStyle"] | null;
  density: IBusinessTheme["density"] | null;
};

const BusinessThemeContext = createContext<BusinessThemeContextValue>({
  theme: null,
  title: null,
  loginTagline: null,
  logoUrl: null,
  sidebarStyle: null,
  density: null,
});

export const BusinessThemeProvider = BusinessThemeContext.Provider;

export function useBusinessTheme(): BusinessThemeContextValue {
  return useContext(BusinessThemeContext);
}
