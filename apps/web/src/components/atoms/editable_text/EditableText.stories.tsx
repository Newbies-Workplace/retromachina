import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EditableText } from "@/components/atoms/editable_text/EditableText";
import { CardContextProvider } from "@/components/molecules/card/CardContext";

const meta = {
  title: "atoms/EditableText",
  component: EditableText,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CardContextProvider>
        <div
          style={{
            width: 300,
            height: 100,
            border: "1px dashed #ccc",
            padding: 8,
          }}
        >
          <Story />
        </div>
      </CardContextProvider>
    ),
  ],
} satisfies Meta<typeof EditableText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (props) => <EditableText {...props} />,
  args: { text: "Hello world" },
};

export const NonEditable: Story = {
  render: (props) => <EditableText {...props} />,
  args: { text: "Read only content", editable: false },
};

export const WithLongText: Story = {
  render: (props) => <EditableText {...props} />,
  args: {
    text: "This is a longer piece of text that wraps to multiple lines and demonstrates how the component handles extended content with line breaks",
  },
};

export const WithUrl: Story = {
  render: (props) => <EditableText {...props} />,
  args: { text: "Check out https://example.com for more info" },
};

export const AutoFocus: Story = {
  render: () => {
    const [isEditing, setIsEditing] = useState(false);
    return (
      <CardContextProvider>
        <EditableText
          text="Auto focus me"
          autoFocus
          onEditingChange={(v) => setIsEditing(v)}
        />
        <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
          Editing: {isEditing ? "yes" : "no"}
        </div>
      </CardContextProvider>
    );
  },
};
