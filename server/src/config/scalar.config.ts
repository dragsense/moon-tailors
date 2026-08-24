import { registerAs } from "@nestjs/config";

export type ScalarConfig = {
  theme: string;
  title: string;
  description: string;
  showSidebar: boolean;
  hideDownloadButton: boolean;
  hideTryItPanel: boolean;
  layout: string;
};

export default registerAs(
  "scalar",
  (): ScalarConfig => ({
    theme: process.env.SCALAR_THEME || "purple",
    title: process.env.SCALAR_TITLE || "Moon Tailors API",
    description:
      process.env.SCALAR_DESCRIPTION ||
      "Moon Tailors API with shared Zod contracts",
    showSidebar: process.env.SCALAR_SHOW_SIDEBAR !== "false",
    hideDownloadButton: process.env.SCALAR_HIDE_DOWNLOAD === "true",
    hideTryItPanel: process.env.SCALAR_HIDE_TRY_IT === "true",
    layout: process.env.SCALAR_LAYOUT || "modern",
  }),
);
