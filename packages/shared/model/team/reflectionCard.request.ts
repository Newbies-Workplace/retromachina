import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export const MAX_REFLECTION_CARD_LENGTH = 5000;

export class ReflectionCardRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_REFLECTION_CARD_LENGTH)
  text: string;
}
