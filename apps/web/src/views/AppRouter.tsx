import type React from "react";
import { Navigate } from "react-router";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { RequireAuth } from "../context/user/RequireAuth";
import { NotFoundView } from "./404/NotFoundView";
import Loading from "./auth/loading/LoadingView";
import { PrivacyPolicyView } from "./auth/privacy_policy/PrivacyPolicyView";
import { SignInView } from "./auth/sign_in/SignInView";
import HomeView from "./home/HomeView";
import RetroActiveView from "./retro_active/RetroActiveView";
import { RetroWrapper } from "./retro_active/RetroWrapper";
import { RetroCreateView } from "./retro_create/RetroCreateView";
import { RetroSummaryView } from "./retro_summary/RetroSummaryView";
import { TeamBoardView } from "./team_board/TeamBoardView";
import { TeamBoardWrapper } from "./team_board/TeamBoardWrapper";
import { TeamBoardEditView } from "./team_board_edit/TeamBoardEditView";
import { TeamCreateView } from "./team_create/TeamCreateView";
import TeamEditView from "./team_edit/TeamEditView";

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignInView />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/privacy" element={<PrivacyPolicyView />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <HomeView />
            </RequireAuth>
          }
        />

        <Route
          path="/team/create"
          element={
            <RequireAuth>
              <TeamCreateView />
            </RequireAuth>
          }
        />
        <Route
          path="/team/:teamId/edit"
          element={
            <RequireAuth>
              <TeamEditView />
            </RequireAuth>
          }
        />

        <Route
          path="/team/:teamId/board"
          element={
            <RequireAuth>
              <TeamBoardWrapper>
                <TeamBoardView />
              </TeamBoardWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/team/:teamId/board/edit"
          element={
            <RequireAuth>
              <TeamBoardEditView />
            </RequireAuth>
          }
        />

        <Route
          path="/retro/create"
          element={
            <RequireAuth>
              <RetroCreateView />
            </RequireAuth>
          }
        />
        <Route
          path="/retro/:retroId/*"
          element={
            <RequireAuth>
              <RetroWrapper>
                <RetroActiveView />
              </RetroWrapper>
            </RequireAuth>
          }
        />

        <Route
          path="/retro/:retroId/summary"
          element={
            <RequireAuth>
              <RetroSummaryView />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to={"/404"} />} />
        <Route path="/404" element={<NotFoundView />} />
      </Routes>
    </Router>
  );
};
