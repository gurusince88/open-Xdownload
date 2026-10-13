import { render, type RenderOptions } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { TooltipProvider } from "../components/ui/Overlay";

// Keep unit tests on zh so existing Chinese copy assertions stay stable.
void i18n.changeLanguage("zh");

// Radix Tooltip 必须挂在 Provider 下（真实应用里由 main.tsx 挂一次）。
// 组件测试单独渲染子树时补上，避免每个用例自己包一层。
export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>{ui}</TooltipProvider>
    </I18nextProvider>,
    options,
  );
}

export * from "@testing-library/react";
