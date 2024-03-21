import type { RoomState } from "shared/model/retro/retro.events";

export class RoomStateValidator {
  static validate(value: RoomState) {
    const possibleValues = [
      "reflection",
      "group",
      "vote",
      "discuss",
      "summary",
    ];

    return possibleValues.includes(value);
  }
}
