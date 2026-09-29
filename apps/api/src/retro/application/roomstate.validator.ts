import { RoomState } from "shared/model/retro/retro.events";

export const validate = (value: RoomState) => {
  const possibleValues = [
    "warmup",
    "reflection",
    "group",
    "vote",
    "discuss",
    "summary",
  ];

  return possibleValues.includes(value);
};
