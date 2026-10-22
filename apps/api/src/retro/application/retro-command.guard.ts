import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { MESSAGE_METADATA } from "@nestjs/websockets/constants";

import { validate as isRoomState } from "./roomstate.validator";

const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000;

type RecordValue = Record<string, unknown>;

function isPlainObject(value: unknown): value is RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function nonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

type Validator = (data: unknown) => boolean;
const hasFields =
  (fields: Record<string, (value: unknown) => boolean>): Validator =>
  (data) =>
    isPlainObject(data) &&
    Object.entries(fields).every(([field, validate]) => validate(data[field]));

const stringField = (field: string) => ({ [field]: nonemptyString });
const booleanField = (field: string) => ({
  [field]: (value: unknown) => typeof value === "boolean",
});
const marker: Validator = (data) =>
  data === undefined || data === null || isPlainObject(data);

const COMMAND_VALIDATORS: Record<string, Validator> = {
  command_ready: hasFields(booleanField("readyState")),
  command_start_warmup_draw: marker,
  command_update_warmup_room_url: hasFields(stringField("url")),
  command_complete_warmup: marker,
  command_change_slot_machine_visibility: hasFields(booleanField("isVisible")),
  command_draw_slot_machine: marker,
  command_creating_task_state: hasFields(booleanField("creatingTaskState")),
  command_create_card: hasFields({
    ...stringField("id"),
    ...stringField("text"),
    ...stringField("columnId"),
  }),
  command_update_card: hasFields({
    ...stringField("cardId"),
    ...stringField("text"),
  }),
  command_delete_card: hasFields(stringField("cardId")),
  command_write_state: hasFields({
    ...booleanField("writeState"),
    ...stringField("columnId"),
  }),
  command_change_column_name: hasFields({
    ...stringField("columnId"),
    ...stringField("name"),
  }),
  command_change_column_description: hasFields({
    ...stringField("columnId"),
    description: (value: unknown) => typeof value === "string",
  }),
  command_reorder_columns: hasFields({
    ...stringField("fromColumnId"),
    ...stringField("toColumnId"),
  }),
  command_room_state: hasFields({
    roomState: isRoomState,
  }),
  command_timer_change: hasFields({
    timestamp: (value: unknown) =>
      value === null ||
      (typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0 &&
        value <= MAX_DATE_TIMESTAMP),
  }),
  command_vote_on_card: hasFields(stringField("parentCardId")),
  command_remove_vote_on_card: hasFields(stringField("parentCardId")),
  command_change_vote_amount: hasFields({
    votesAmount: safeCount,
  }),
  command_card_add_to_card: hasFields({
    ...stringField("parentCardId"),
    ...stringField("cardId"),
  }),
  command_move_card_to_column: hasFields({
    ...stringField("columnId"),
    ...stringField("cardId"),
  }),
  command_close_room: marker,
  command_create_action_point: hasFields({
    description: nonemptyString,
    ownerId: (value: unknown) => value === null || nonemptyString(value),
  }),
  command_delete_action_point: hasFields(stringField("taskId")),
  command_update_action_point: hasFields({
    ...stringField("taskId"),
    description: (value: unknown) => typeof value === "string",
    ownerId: (value: unknown) => value === null || nonemptyString(value),
  }),
  command_change_discussion_card: hasFields(stringField("cardId")),
};

const validators = new Map(Object.entries(COMMAND_VALIDATORS));

export function validateRetroCommand(message: string, data: unknown): boolean {
  return validators.get(message)?.(data) ?? false;
}

@Injectable()
export class RetroCommandGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const message = this.reflector.get<string>(
      MESSAGE_METADATA,
      context.getHandler(),
    );
    if (
      !message ||
      !validateRetroCommand(message, context.switchToWs().getData())
    ) {
      throw new WsException("Invalid command payload");
    }
    return true;
  }
}
