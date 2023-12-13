import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import HomeView from "./home/HomeView";
import {SignInView} from "./auth/sign_in/SignInView";
import Loading from './auth/loading/LoadingView';
import {RequireAuth} from '../context/user/RequireAuth';
import {RetroCreateView} from './retro_create/RetroCreateView';
import TeamEditView from './team_edit/TeamEditView';
import RetroActiveView from './retro_active/RetroActiveView';
import {TeamCreateView} from "./team_create/TeamCreateView";
import {RetroWrapper} from "./retro_active/RetroWrapper";
import { RetroSummaryView } from './retro_summary/RetroSummaryView';
import {NotFoundView} from "./404/NotFoundView";
import {Navigate} from "react-router";
import {TeamBoardView} from "./team_board/TeamBoardView";
import {TeamBoardEditView} from "./team_board_edit/TeamBoardEditView";
import {TeamBoardWrapper} from "./team_board/TeamBoardWrapper";
import {PrivacyPolicyView} from "./auth/privacy_policy/PrivacyPolicyView";

export const AppRouter: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route
                    path="/signin"
                    element={<SignInView/>}/>
                <Route
                    path="/loading"
                    element={<Loading/>}/>
                <Route
                    path="/privacy"
                    element={<PrivacyPolicyView/>}/>

                <Route
                    path="/"
                    element={<RequireAuth><HomeView/></RequireAuth>}/>

                <Route
                    path="/team/create"
                    element={<RequireAuth><TeamCreateView/></RequireAuth>}/>
                <Route
                    path="/team/:teamId/edit"
                    element={<RequireAuth><TeamEditView/></RequireAuth>}/>

                <Route
                    path="/team/:teamId/board"
                    element={
                        <RequireAuth>
                            <TeamBoardWrapper>
                                <TeamBoardView/>
                            </TeamBoardWrapper>
                        </RequireAuth>
                    }/>
                <Route
                    path="/team/:teamId/board/edit"
                    element={<RequireAuth><TeamBoardEditView/></RequireAuth>}/>

                <Route
                    path="/retro/create"
                    element={<RequireAuth><RetroCreateView/></RequireAuth>}/>
                <Route
                    path="/retro/:retroId/*"
                    element={
                        <RequireAuth>
                            <RetroWrapper>
                                <RetroActiveView/>
                            </RetroWrapper>
                        </RequireAuth>
                    }/>

                <Route
                    path="/retro/:retroId/summary"
                    element={
                        <RequireAuth>
                            <RetroSummaryView/>
                        </RequireAuth>
                    }/>

                <Route
                    path="*"
                    element={<Navigate to={"/404"}/>}/>
                <Route
                    path="/404"
                    element={<NotFoundView/>}/>
            </Routes>
        </Router>
    )
}