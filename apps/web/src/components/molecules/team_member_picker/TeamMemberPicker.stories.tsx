import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { TeamUserRequest } from "shared/model/team/team.request";
import { TeamMemberPicker } from "@/components/molecules/team_member_picker/TeamMemberPicker";

const meta = {
  title: "molecules/TeamMemberPicker",
  component: TeamMemberPicker,
} satisfies Meta<typeof TeamMemberPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => {
  const [users, setUsers] = useState<TeamUserRequest[]>([
    { email: "john.snow@test.pl", role: "USER" },
    { email: "mr.bean@hihi.en", role: "ADMIN" },
  ]);

  return (
    <TeamMemberPicker
      users={users}
      onAdd={(email) => {
        setUsers([...users, email]);
      }}
      onRoleChange={(email, role) => {
        setUsers([
          ...users.map((user) => {
            if (user.email === email) {
              return { ...user, role };
            }
            return user;
          }),
        ]);
      }}
      onDelete={(email) => {
        setUsers([...users.filter((user) => user.email !== email)]);
      }}
    />
  );
};
