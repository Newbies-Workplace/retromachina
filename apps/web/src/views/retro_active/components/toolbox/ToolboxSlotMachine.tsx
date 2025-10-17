import React, { useEffect, useRef } from "react";
import {
  SlotMachine,
  SlotMachineRef,
} from "@/components/organisms/slot_machine/SlotMachine";
import { SlotMachineDrawnListener } from "@/context/retro/RetroContext";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";

export const ToolboxSlotMachine: React.FC = () => {
  const {
    teamId,
    roomState,
    activeUsers,
    drawMachine,
    highlightedUserId,
    slotMachineVisible,
    setSlotMachineVisible,
    addDrawSlotMachineListener,
    removeDrawSlotMachineListener,
  } = useRetro();
  const { isAdmin } = useTeamRole(teamId!);
  const { user } = useUser();
  const slotMachineRef = useRef<SlotMachineRef>(null);

  useEffect(() => {
    const listener: SlotMachineDrawnListener = async (event) => {
      await slotMachineRef?.current?.animateSlotMachine(
        event.actorId !== user?.id,
      );
    };

    addDrawSlotMachineListener(listener);

    return () => {
      removeDrawSlotMachineListener(listener);
    };
  }, []);

  return (
    <SlotMachine
      ref={slotMachineRef}
      className={"m-auto absolute left-0 right-0 w-96"}
      visible={roomState === "group" && slotMachineVisible}
      hideMachineEnabled={isAdmin}
      onHideMachine={() => setSlotMachineVisible(false)}
      onMachineDrawn={() => drawMachine()}
      highlightedUserId={highlightedUserId}
      userPool={activeUsers.map((u) => ({
        id: u.userId,
        avatar_link: u.avatar_link,
      }))}
    />
  );
};
