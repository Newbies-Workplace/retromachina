import { BadRequestException } from "@nestjs/common";
import type { RetroCreateRequest } from "shared/model/retro/retro.request";

export const MAX_RETRO_COLUMNS = 20;
export const MAX_COLUMN_NAME_LENGTH = 100;
export const MAX_COLUMN_DESCRIPTION_LENGTH = 1000;
const MAX_ID_LENGTH = 191;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= MAX_ID_LENGTH;

function isWarmupSelection(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  switch (value.mode) {
    case "none":
    case "deferred-random":
      return true;
    case "selected":
      return isId(value.warmupId);
    default:
      return false;
  }
}

function isColumn(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.id === undefined || isId(value.id)) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    value.name.length <= MAX_COLUMN_NAME_LENGTH &&
    (value.desc === null ||
      value.desc === undefined ||
      (typeof value.desc === "string" &&
        value.desc.length <= MAX_COLUMN_DESCRIPTION_LENGTH))
  );
}

/**
 * RetroCreateRequest is a shared interface, so the global ValidationPipe does
 * not validate it. Reject malformed bodies before they reach Prisma or the room.
 */
export function validateRetroCreateRequest(
  request: unknown,
): RetroCreateRequest {
  if (
    !isRecord(request) ||
    !isId(request.teamId) ||
    !Array.isArray(request.columns) ||
    request.columns.length === 0 ||
    request.columns.length > MAX_RETRO_COLUMNS ||
    !request.columns.every(isColumn) ||
    !isWarmupSelection(request.warmup)
  ) {
    throw new BadRequestException("Invalid retrospective request");
  }
  return request as unknown as RetroCreateRequest;
}
