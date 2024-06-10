import { ReloadIcon, TrashIcon } from "@radix-ui/react-icons";
import type React from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useConfirm } from "../../../context/confirm/ConfirmContext.hook";
import { Button } from "../../atoms/button/Button";
import { Input } from "../../atoms/input/Input";

type TeamInviteLinkInputProps = {
  inviteKey: string | undefined;
  setInviteKey: (inviteKey: string | undefined) => void;
};

export const TeamInviteLinkInput: React.FC<TeamInviteLinkInputProps> = ({
  inviteKey,
  setInviteKey,
}) => {
  const { showConfirm } = useConfirm();

  const onGenerateInviteLinkPress = async () => {
    const newInviteKey = uuidv4();

    setInviteKey(newInviteKey);
  };

  const onRegenerateInviteLinkPress = async () => {
    showConfirm({
      title: "Czy na pewno chcesz wygenerować nowy link?",
      content: "Stary link z zaproszeniem przestanie być ważny",
      onConfirmed: () => {
        onGenerateInviteLinkPress();
      },
    });
  };

  const onDeleteInviteLinkPress = async () => {
    showConfirm({
      title: "Czy na pewno chcesz usunąć link?",
      content: "Zaproszenie nie będzie już dostępne",
      onConfirmed: () => {
        setInviteKey(undefined);
      },
    });
  };

  const onCopyInviteLinkPress = () => {
    if (inviteKey) {
      navigator.clipboard
        .writeText(`${window.location.origin}/invitation/${inviteKey}`)
        .then(() => {
          toast.success("Link skopiowano do schowka");
        });
    }
  };

  return (
    <div>
      <h1>Link do zaproszenia</h1>

      <div className={"flex flex-row gap-2 items-center"}>
        <Input
          disabled
          value={
            inviteKey ? `${window.location.origin}/invitation/${inviteKey}` : ""
          }
          setValue={() => {}}
        />
        {inviteKey ? (
          <>
            <Button onClick={onCopyInviteLinkPress}>Skopiuj</Button>
            <Button
              size={"icon"}
              variant={"destructive"}
              onClick={onRegenerateInviteLinkPress}
            >
              <ReloadIcon className={"size-6"} />
            </Button>
            <Button
              size={"icon"}
              variant={"destructive"}
              onClick={onDeleteInviteLinkPress}
            >
              <TrashIcon className={"size-6"} />
            </Button>
          </>
        ) : (
          <Button onClick={onGenerateInviteLinkPress}>Wygeneruj</Button>
        )}
      </div>
    </div>
  );
};
