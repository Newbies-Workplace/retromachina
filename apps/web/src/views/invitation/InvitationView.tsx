import React from "react";
import { useParams } from "react-router";
import Navbar from "../../component/organisms/navbar/Navbar";

export const InvitationView: React.FC = () => {
  const { invitationKey } = useParams<{ invitationKey: string }>();

  return (
    <div>
      <Navbar />
      Invitation View: {invitationKey}
    </div>
  );
};
