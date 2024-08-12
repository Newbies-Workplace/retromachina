import { IsNotEmpty, IsString } from "class-validator";

export class ReflectionCardRequest {
  @IsString()
  @IsNotEmpty()
  text: string;
}
