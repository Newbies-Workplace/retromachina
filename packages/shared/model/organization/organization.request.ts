import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class OrganizationRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  name: string;

  @IsString()
  @MaxLength(63)
  @Matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  slug: string;
}

export class OrganizationMemberRequest {
  @IsEmail()
  email: string;

  @IsIn(["ADMIN", "USER"])
  role: "ADMIN" | "USER";
}
