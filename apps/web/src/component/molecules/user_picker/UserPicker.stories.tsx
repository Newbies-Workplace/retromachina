import type {Meta, StoryObj} from '@storybook/react';
import { UserPicker } from './UserPicker';
import {useState} from "react";

const meta = {
    title: 'molecules/UserPicker',
    component: UserPicker,
} satisfies Meta<typeof UserPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => {
    const [users, setUsers] = useState<string[]>([
        'john.snow@test.pl',
        'mr.bean@hihi.en'
    ]);

    return (
        <UserPicker
            users={users}
            onAdd={(email) => { setUsers([...users, email]) }}
            onDelete={(email) => { setUsers([...users.filter(user => user !== email)]) }} />
    );
}