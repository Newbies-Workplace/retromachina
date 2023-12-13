import type {Meta, StoryObj} from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
    title: 'atoms/Avatar',
    component: Avatar,
    parameters: {
        backgrounds: { default: 'dark' },
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
    args: {
        url: 'assets/sample.png'
    }
}

export const Inactive: Story = {
    args: {
        ...Active.args,
        inactive: true,
    }
}

export const Big: Story = {
    args: {
        ...Active.args,
        size: 100,
    }
}