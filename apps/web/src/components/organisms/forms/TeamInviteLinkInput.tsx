import { RefreshCwIcon, TrashIcon } from "lucide-react";
import type React from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import { useConfirm } from "@/context/confirm/ConfirmContext.hook";

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
          data-testid="invitation-link"
          disabled
          value={
            inviteKey ? `${window.location.origin}/invitation/${inviteKey}` : ""
          }
          setValue={() => {}}
        />
        {inviteKey ? (
          <>
            <Button
              data-testid="copy-invitation-link"
              onClick={onCopyInviteLinkPress}
            >
              Skopiuj
            </Button>
            <Button
              data-testid="regenerate-invitation-link"
              size={"icon"}
              variant={"destructive"}
              onClick={onRegenerateInviteLinkPress}
            >
              <RefreshCwIcon className={"size-4"} />
            </Button>
            <Button
              data-testid="remove-invitation-link"
              size={"icon"}
              variant={"destructive"}
              onClick={onDeleteInviteLinkPress}
            >
              <TrashIcon className={"size-4"} />
            </Button>
          </>
        ) : (
          <Button
            data-testid="generate-invitation-link"
            onClick={onGenerateInviteLinkPress}
          >
            Wygeneruj
          </Button>
        )}
      </div>
    </div>
  );
};
