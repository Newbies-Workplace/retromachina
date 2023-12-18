import type {Meta, StoryObj} from '@storybook/react';
import { Button } from './Button';
import ActionIcon from '../../../assets/icons/action-icon.svg'

const meta = {
    title: 'atoms/Button',
    component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
    args: {
        size: 'medium',
        children: 'Test button',
    }
}

export const Big: Story = {
    args: {
        ...Medium.args,
        size: 'big',
    }
}

export const Small: Story = {
    args: {
        ...Medium.args,
        size: 'small',
    }
}

export const Disabled: Story = {
    args: {
        ...Medium.args,
        disabled: true,
    }
}

export const Round: Story = {
    args: {
        size: 'round',
        children: <ActionIcon />
    }
}