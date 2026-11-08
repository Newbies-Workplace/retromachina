import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { MESSAGE_METADATA } from "@nestjs/websockets/constants";
import { RetroCommandGuard, validateRetroCommand } from "./retro-command.guard";

const cases: Array<[string, Record<string, unknown>]> = [
  ["command_ready", { readyState: true }],
  ["command_start_warmup_draw", {}],
  ["command_update_warmup_room_url", { url: "https://example.com" }],
  ["command_complete_warmup", {}],
  ["command_change_slot_machine_visibility", { isVisible: false }],
  ["command_draw_slot_machine", {}],
  ["command_creating_task_state", { creatingTaskState: true }],
  ["command_create_card", { id: "id", text: "text", columnId: "column" }],
  ["command_update_card", { cardId: "card", text: "text" }],
  ["command_delete_card", { cardId: "card" }],
  ["command_write_state", { writeState: true, columnId: "column" }],
  ["command_change_column_name", { columnId: "column", name: "name" }],
  [
    "command_change_column_description",
    { columnId: "column", description: "description" },
  ],
  ["command_reorder_columns", { fromColumnId: "from", toColumnId: "to" }],
  ["command_room_state", { roomState: "warmup" }],
  ["command_timer_change", { timestamp: null }],
  ["command_vote_on_card", { parentCardId: "parent" }],
  ["command_remove_vote_on_card", { parentCardId: "parent" }],
  ["command_change_vote_amount", { votesAmount: 0 }],
  ["command_card_add_to_card", { parentCardId: "parent", cardId: "card" }],
  ["command_move_card_to_column", { columnId: "column", cardId: "card" }],
  ["command_close_room", {}],
  ["command_create_action_point", { description: "task", ownerId: null }],
  ["command_delete_action_point", { taskId: "task" }],
  [
    "command_update_action_point",
    { taskId: "task", ownerId: null, description: "task" },
  ],
  ["command_change_discussion_card", { cardId: "card" }],
];

describe("validateRetroCommand", () => {
  it.each(cases)("accepts valid payload for %s", (message, data) => {
    expect(validateRetroCommand(message, data)).toBe(true);
  });

  it.each(cases)("rejects missing required fields for %s", (message, data) => {
    if (Object.keys(data).length === 0) return;
    const requiredField = Object.keys(data)[0];
    const missing = { ...data };
    delete missing[requiredField];
    expect(validateRetroCommand(message, missing)).toBe(false);
  });

  it.each(cases)("rejects non-object payloads for %s", (message) => {
    expect(validateRetroCommand(message, "unexpected primitive")).toBe(false);
    expect(validateRetroCommand(message, [])).toBe(false);
    expect(validateRetroCommand(message, new Date())).toBe(false);
  });

  it("allows marker commands to omit data or use a plain object", () => {
    for (const message of [
      "command_start_warmup_draw",
      "command_complete_warmup",
      "command_draw_slot_machine",
      "command_close_room",
    ]) {
      expect(validateRetroCommand(message, undefined)).toBe(true);
      expect(validateRetroCommand(message, null)).toBe(true);
      expect(validateRetroCommand(message, { ignored: true })).toBe(true);
      expect(validateRetroCommand(message, true)).toBe(false);
    }
  });

  it("rejects malformed values, invalid enums, and unknown commands", () => {
    expect(validateRetroCommand("command_ready", { readyState: "true" })).toBe(
      false,
    );
    expect(
      validateRetroCommand("command_create_card", {
        id: " ",
        text: "x",
        columnId: "c",
      }),
    ).toBe(false);
    expect(
      validateRetroCommand("command_room_state", { roomState: "other" }),
    ).toBe(false);
    expect(
      validateRetroCommand("command_timer_change", {
        timestamp: 8_640_000_000_000_001,
      }),
    ).toBe(false);
    expect(
      validateRetroCommand("command_change_vote_amount", { votesAmount: 1.5 }),
    ).toBe(false);
    expect(
      validateRetroCommand("command_change_vote_amount", {
        votesAmount: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toBe(false);
    expect(
      validateRetroCommand("command_create_action_point", {
        description: "task",
        ownerId: 2,
      }),
    ).toBe(false);
    expect(validateRetroCommand("not_a_command", {})).toBe(false);
  });
});

describe("RetroCommandGuard", () => {
  const reflector = new Reflector();
  const guard = new RetroCommandGuard(reflector);
  const handler = () => undefined;

  function context(message: string, data: unknown): ExecutionContext {
    Reflect.defineMetadata(MESSAGE_METADATA, message, handler);
    return {
      getHandler: () => handler,
      switchToWs: () => ({ getData: () => data }) as never,
    } as unknown as ExecutionContext;
  }

  it("reads SubscribeMessage metadata and validates data before activation", () => {
    expect(
      guard.canActivate(context("command_ready", { readyState: true })),
    ).toBe(true);
    expect(() =>
      guard.canActivate(context("command_ready", { readyState: 1 })),
    ).toThrow(new WsException("Invalid command payload"));
  });

  it("fails closed when handler metadata is missing", () => {
    Reflect.deleteMetadata(MESSAGE_METADATA, handler);
    expect(() => guard.canActivate(context("", {}))).toThrow(WsException);
  });
});
