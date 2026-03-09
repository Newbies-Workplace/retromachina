import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type React from "react";
import { UserContextProvider } from "@/context/user/UserContext";
import { AppRouter } from "@/views/AppRouter";
import "@/App.css";
import { ThemeChanger } from "@/components/organisms/ThemeChanger";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/context/confirm/ConfirmContext";

export const App: React.FC = () => {
  dayjs.extend(duration);

  return (
    <TooltipProvider>
      <ConfirmProvider>
        <UserContextProvider>
          <ThemeChanger />

          <Toaster />

          <AppRouter />
        </UserContextProvider>
      </ConfirmProvider>
    </TooltipProvider>
  );
};
