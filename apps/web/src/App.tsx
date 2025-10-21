import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type React from "react";
import { ToastContainer } from "react-toastify";
import { UserContextProvider } from "@/context/user/UserContext";
import { AppRouter } from "@/views/AppRouter";
import "react-toastify/dist/ReactToastify.css";
import "@/App.css";
import { TooltipProvider } from "@/components/molecules/tooltip/Tooltip";
import { ConfirmProvider } from "@/context/confirm/ConfirmContext";

export const App: React.FC = () => {
  dayjs.extend(duration);

  return (
    <TooltipProvider>
      <ConfirmProvider>
        <UserContextProvider>
          <ToastContainer
            icon={false}
            closeButton={false}
            theme={"colored"}
            position={"bottom-right"}
            hideProgressBar
          />

          <AppRouter />
        </UserContextProvider>
      </ConfirmProvider>
    </TooltipProvider>
  );
};
