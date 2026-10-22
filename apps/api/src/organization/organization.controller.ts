import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  OrganizationMemberRequest,
  OrganizationRequest,
} from "shared/model/organization/organization.request";
import type { OrganizationMembershipResponse } from "shared/model/organization/organization.response";
import { JWTUser } from "../auth/jwt/JWTUser";
import { JwtGuard } from "../auth/jwt/jwt.guard";
import { User } from "../auth/jwt/jwtuser.decorator";
import { OrganizationService } from "./organization.service";

@Controller("organizations")
@UseGuards(JwtGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  list(@User() user: JWTUser): Promise<OrganizationMembershipResponse[]> {
    return this.organizationService.listForUser(user.id);
  }

  @Get(":id")
  async get(@User() user: JWTUser, @Param("id") organizationId: string) {
    return this.organizationService.details(user.id, organizationId);
  }

  @Post()
  create(@User() user: JWTUser, @Body() request: OrganizationRequest) {
    return this.organizationService.create(user.id, request);
  }

  @Put(":id/members")
  putMember(
    @User() user: JWTUser,
    @Param("id") id: string,
    @Body() request: OrganizationMemberRequest,
  ) {
    return this.organizationService.putMember(user.id, id, request);
  }

  @Delete(":id/members/:memberId")
  removeMember(
    @User() user: JWTUser,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
  ) {
    return this.organizationService.removeMember(user.id, id, memberId);
  }
}
