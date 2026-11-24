import { ForbiddenError, subject } from "@casl/ability";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import type {
  PokerDeckRequest,
  PokerDeckResponse,
} from "shared/model/poker/poker.types";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { PrismaService } from "../../prisma/prisma.service";
import {
  getEffectivePokerDecks,
  parsePokerDeckRequest,
  toTeamPokerDeckResponse,
} from "../poker-decks";
import { PokerGateway } from "./poker.gateway";

/**
 * Team poker decks. Every team member can manage them, the same way every
 * member can switch the deck used at the poker table.
 */
@Controller("teams/:id/poker_decks")
@UseGuards(JwtGuard)
export class PokerDeckController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly abilityFactory: AuthAbilityFactory,
    private readonly pokerGateway: PokerGateway,
  ) {}

  @Get()
  async getDecks(
    @User() user: JWTUser,
    @Param("id") teamId: string,
  ): Promise<PokerDeckResponse[]> {
    await this.assertTeamMember(user, teamId);
    return getEffectivePokerDecks(this.prismaService, teamId);
  }

  @Post()
  async createDeck(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Body() request: PokerDeckRequest,
  ): Promise<PokerDeckResponse> {
    await this.assertTeamMember(user, teamId);
    const data = parsePokerDeckRequest(request);
    const created = await this.prismaService.pokerDeck.create({
      data: { team_id: teamId, name: data.name, cards: data.cards },
    });
    return toTeamPokerDeckResponse(created);
  }

  @Put(":deckId")
  async updateDeck(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Param("deckId") deckId: string,
    @Body() request: PokerDeckRequest,
  ): Promise<PokerDeckResponse> {
    await this.assertTeamMember(user, teamId);
    const data = parsePokerDeckRequest(request);
    const { count } = await this.prismaService.pokerDeck.updateMany({
      where: { id: deckId, team_id: teamId },
      data: { name: data.name, cards: data.cards },
    });
    if (count === 0) throw new NotFoundException("Poker deck not found");

    const deck: PokerDeckResponse = { id: deckId, ...data, source: "team" };
    this.pokerGateway.notifyDeckUpdated(teamId, deck);
    return deck;
  }

  @Delete(":deckId")
  @HttpCode(204)
  async deleteDeck(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Param("deckId") deckId: string,
  ): Promise<void> {
    await this.assertTeamMember(user, teamId);
    const { count } = await this.prismaService.pokerDeck.deleteMany({
      where: { id: deckId, team_id: teamId },
    });
    if (count === 0) throw new NotFoundException("Poker deck not found");

    // Forget the deck as the team's last choice, so the next room starts on
    // the default deck.
    await this.prismaService.team.updateMany({
      where: { id: teamId, poker_deck_id: deckId },
      data: { poker_deck_id: null },
    });
    this.pokerGateway.notifyDeckRemoved(teamId, deckId);
  }

  private async assertTeamMember(user: JWTUser, teamId: string) {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: { id: teamId },
    });
    ForbiddenError.from(this.abilityFactory.create(user)).throwUnlessCan(
      "read",
      subject("Team", team),
    );
  }
}
