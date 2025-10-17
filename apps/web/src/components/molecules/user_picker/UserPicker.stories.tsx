import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { TeamUserRequest } from "shared/model/team/team.request";
import { UserPicker } from "@/components/molecules/user_picker/UserPicker";

const meta = {
  title: "molecules/UserPicker",
  component: UserPicker,
} satisfies Meta<typeof UserPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => {
  const [users, setUsers] = useState<TeamUserRequest[]>([
    { email: "john.snow@test.pl", role: "USER" },
    { email: "mr.bean@hihi.en", role: "ADMIN" },
  ]);

  return (
    <UserPicker
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
