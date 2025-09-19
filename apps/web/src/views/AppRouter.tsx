import type React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import { RequireAuth } from "@/context/user/RequireAuth";
import { NotFoundView } from "@/views/404/NotFoundView";
import { LoadingView } from "@/views/auth/loading/LoadingView";
import { PrivacyPolicyView } from "@/views/auth/privacy_policy/PrivacyPolicyView";
import { SignInView } from "@/views/auth/sign_in/SignInView";
import { HeroView } from "@/views/hero/HeroView";
import { HomeView } from "@/views/home/HomeView";
import { InviteView } from "@/views/invitation/InviteView";
import { PreferencesView } from "@/views/preferences/PreferencesView";
import { RetroActiveView } from "@/views/retro_active/RetroActiveView";
import { RetroWrapper } from "@/views/retro_active/RetroWrapper";
import { RetroArchiveView } from "@/views/retro_archive/RetroArchiveView";
import { RetroCreateView } from "@/views/retro_create/RetroCreateView";
import { RetroSummaryView } from "@/views/retro_summary/RetroSummaryView";
import { TeamBoardView } from "@/views/team_board/TeamBoardView";
import { TeamBoardWrapper } from "@/views/team_board/TeamBoardWrapper";
import { TeamBoardEditView } from "@/views/team_board_edit/TeamBoardEditView";
import { TeamCreateView } from "@/views/team_create/TeamCreateView";
import { TeamEditView } from "@/views/team_edit/TeamEditView";

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/hero" element={<HeroView />} />

        <Route path="/signin" element={<SignInView />} />
        <Route path="/loading" element={<LoadingView />} />
        <Route path="/privacy" element={<PrivacyPolicyView />} />

        <Route
          path="/"
          element={
            <RequireAuth fallback={<Navigate to={"/hero"} />}>
              <HomeView />
            </RequireAuth>
          }
        />
        <Route
          path="/preferences"
          element={
            <RequireAuth>
              <PreferencesView />
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
          path="/team/:teamId/archive"
          element={
            <RequireAuth>
              <RetroArchiveView />
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
          path="/invitation/:inviteKey"
          element={
            <RequireAuth>
              <InviteView />
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

        <Route path="*" element={<NotFoundView />} />
        <Route path="/404" element={<NotFoundView />} />
      </Routes>
    </Router>
  );
};
