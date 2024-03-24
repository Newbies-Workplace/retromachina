import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { User } from "@prisma/client";
import * as dayjs from "dayjs";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import {
  AddCardToCardCommand,
  AddCardVoteCommand,
  ChangeCurrentDiscussCardCommand,
  ChangeTimerCommand,
  ChangeVoteAmountCommand,
  CreateCardCommand,
  CreateTaskCommand,
  DeleteCardCommand,
  DeleteTaskCommand,
  MoveCardToColumnCommand,
  RemoveCardVoteCommand,
  UpdateCardCommand,
  UpdateCreatingTaskStateCommand,
  UpdateReadyStateCommand,
  UpdateRoomStateCommand,
  UpdateTaskCommand,
  UpdateWriteStateCommand,
} from "shared/model/retro/retro.commands";
import { TimerChangedEvent } from "shared/model/retro/retro.events";
import { Card, RetroColumn } from "shared/model/retro/retroRoom.interface";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { JWTUser } from "../../auth/jwt/JWTUser";
import { PrismaService } from "../../prisma/prisma.service";
import { RetroRoom } from "../domain/model/retroRoom.object";
import { RoomStateValidator } from "./roomstate.validator";

@Injectable()
@WebSocketGateway(3001, { cors: true, namespace: "retro" })
export class RetroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users = new Map<string, { roomId: string; user: User }>();
  private retroRooms = new Map<string, RetroRoom>();

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async addRetroRoom(
    retroId: string,
    teamId: string,
    scrumMasterId: string,
    columns: RetroColumn[],
  ) {
    const retroRoom = new RetroRoom(retroId, teamId, scrumMasterId, columns);
    this.retroRooms.set(retroId, retroRoom);
    return retroRoom;
  }

  async closeStaleRooms(): Promise<number> {
    let closedRooms = 0;

    for (const [, room] of this.retroRooms) {
      const isStaleRoom =
        room.users.size === 0 &&
        dayjs(room.lastDisconnectionDate).add(30, "m").isBefore(dayjs());

      if (isStaleRoom) {
        closedRooms += 1;
        await this.closeRoom(room);
      }
    }

    return closedRooms;
  }

  async closeRoom(room: RetroRoom) {
    await this.prismaService.retrospective.update({
      where: { id: room.id },
      data: { is_running: false },
    });

    this.retroRooms.delete(room.id);
    this.server.to(room.id).emit("event_close_room");
  }

  async handleConnection(client: Socket) {
    const retroId = client.handshake.query.retro_id as string;
    const user = this.getUserFromJWT(client);
    const room = this.retroRooms.get(retroId);

    if (!room) {
      this.doException(
        client,
        ErrorTypes.RetrospectiveNotFound,
        `Retrospective (${retroId}) not found`,
      );
      return;
    }

    const userQuery = await this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        TeamUsers: {
          where: {
            team_id: room.teamId,
          },
        },
      },
    });

    if (!userQuery) {
      this.doException(
        client,
        ErrorTypes.UserNotFound,
        `User (${user.id}) not found`,
      );
      return;
    }

    room.addUser(client.id, user.id, userQuery.TeamUsers[0].role);

    this.users.set(client.id, {
      user: userQuery,
      roomId: room.id,
    });

    client.join(retroId);

    this.server.to(room.id).emit("event_room_sync", room.getRoomSyncData());
  }

  @SubscribeMessage("command_ready")
  async handleReady(client: Socket, { readyState }: UpdateReadyStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    if (roomUser.isReady !== readyState) {
      roomUser.isReady = readyState;

      this.emitRoomSync(roomId, room);
    }
  }

  @SubscribeMessage("command_creating_task_state")
  async handleCreatingTaskState(
    client: Socket,
    { creatingTaskState }: UpdateCreatingTaskStateCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    if (roomUser.isCreatingTask !== creatingTaskState) {
      roomUser.isCreatingTask = creatingTaskState;

      this.emitRoomSync(roomId, room);
    }
  }

  @SubscribeMessage("command_create_card")
  async handleNewCard(client: Socket, payload: CreateCardCommand) {
    if (payload.text.trim().length === 0) return;
    if (payload.text.length > 1000) payload.text = payload.text.slice(0, 1000);

    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    const card = payload as unknown as Card;
    card.id = uuid();
    card.authorId = roomUser.userId;
    card.parentCardId = null;

    const column = room.retroColumns.find(
      (column) => column.id === card.columnId,
    );
    if (!column) {
      return;
    }
    room.cards.unshift(card);

    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_update_card")
  async handleUpdateCard(client: Socket, payload: UpdateCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    if (payload.text.trim().length === 0) return;
    if (payload.text.length > 1000) payload.text = payload.text.slice(0, 1000);

    const cardIndex = room.cards.findIndex(
      (card) => card.id === payload.cardId && card.authorId === roomUser.userId,
    );
    if (cardIndex === -1) {
      return;
    }

    room.cards[cardIndex].text = payload.text;

    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_delete_card")
  handleDeleteCard(client: Socket, { cardId }: DeleteCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    const cardIndex = room.cards.findIndex(
      (card) => card.id === cardId && card.authorId === roomUser.userId,
    );

    if (cardIndex === -1) {
      return;
    }

    room.cards = room.cards.filter(
      (card) => !(card.id === cardId && card.authorId === roomUser.userId),
    );
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_write_state")
  handleWriteState(client: Socket, payload: UpdateWriteStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    const column = room.retroColumns.find((column) => {
      return column.id === payload.columnId;
    });

    if (!column) {
      return;
    }

    if (payload.writeState) {
      roomUser.writingInColumns.add(column.id);
    } else {
      roomUser.writingInColumns.delete(column.id);
    }

    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_room_state")
  handleRoomState(client: Socket, payload: UpdateRoomStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    const isValid = RoomStateValidator.validate(payload.roomState);
    if (!isValid) {
      this.doException(
        client,
        ErrorTypes.InvalidRoomState,
        `Invalid room state value (${payload.roomState})`,
      );
      return;
    }

    room.changeState(payload.roomState);

    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_timer_change")
  handleChangeTimer(client: Socket, payload: ChangeTimerCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.timerEnds = payload.timestamp;

    const event: TimerChangedEvent = {
      timerEnds: room.timerEnds,
    };

    this.server.to(roomId).emit("event_timer_change", event);
  }

  @SubscribeMessage("command_vote_on_card")
  handleVoteOnCard(client: Socket, payload: AddCardVoteCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    const userVotes = room.votes.filter(
      (vote) => vote.voterId === roomUser.userId,
    ).length;

    if (userVotes >= room.maxVotes) {
      return;
    }

    const card = room.cards.find((card) => card.id === payload.parentCardId);
    if (!card) {
      return;
    }

    room.addVote(roomUser.userId, payload.parentCardId);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_remove_vote_on_card")
  handleRemoveVoteOnCard(client: Socket, payload: RemoveCardVoteCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    room.removeVote(roomUser.userId, payload.parentCardId);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_vote_amount")
  handleChangeVoteAmount(client: Socket, payload: ChangeVoteAmountCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);
    if (room.scrumMasterId !== roomUser.userId) {
      return;
    }

    room.setVoteAmount(payload.votesAmount);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_card_add_to_card")
  handleCardAddToCard(client: Socket, payload: AddCardToCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.addCardToCard(payload.parentCardId, payload.cardId);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_move_card_to_column")
  handleMoveCardToColumn(client: Socket, payload: MoveCardToColumnCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.moveCardToColumn(payload.cardId, payload.columnId);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_close_room")
  async handleCloseRoom(client: Socket) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.users.get(client.id);

    if (roomUser.userId !== room.scrumMasterId && roomUser.role !== "ADMIN") {
      return;
    }

    await this.closeRoom(room);
  }

  @SubscribeMessage("command_create_action_point")
  async handleAddTask(client: Socket, payload: CreateTaskCommand) {
    if (payload.description.trim().length === 0) {
      return;
    }

    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    const board = await this.prismaService.board.findUnique({
      where: {
        team_id: room.teamId,
      },
    });
    const task = await this.prismaService.task.create({
      data: {
        description: payload.description,
        owner_id: payload.ownerId,
        retro_id: room.id,
        team_id: room.teamId,
        column_id: board.default_column_id,
      },
    });

    room.addTask({ ...task, parentCardId: room.discussionCardId });
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_delete_action_point")
  async handleDeleteTask(client: Socket, payload: DeleteTaskCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    await this.prismaService.task.delete({
      where: { id: payload.taskId },
    });

    room.deleteTask(payload.taskId);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_update_action_point")
  async handleUpdateTask(client: Socket, payload: UpdateTaskCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    const task = await this.prismaService.task.update({
      data: {
        description: payload.description,
        owner_id: payload.ownerId,
      },
      where: { id: payload.taskId },
    });

    room.updateTask(task);
    this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_discussion_card")
  handleChangeDiscussionCard(
    client: Socket,
    payload: ChangeCurrentDiscussCardCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.changeDiscussionCard(payload.cardId);
    this.emitRoomSync(roomId, room);
  }

  async handleDisconnect(client: Socket) {
    const user = this.users.get(client.id);
    if (!user) {
      return;
    }
    const roomId = user.roomId;
    const room = this.retroRooms.get(user.roomId);

    this.users.delete(client.id);

    if (!room) {
      return;
    }
    room.removeUser(client.id, user.user.id);

    this.server.to(roomId).emit("event_room_sync", room.getRoomSyncData());
  }

  private emitRoomSync(roomId: string, room: RetroRoom) {
    this.server.to(roomId).emit("event_room_sync", room.getRoomSyncData());
  }

  private doException(client: Socket, type: ErrorTypes, message: string) {
    this.users.delete(client.id);

    client.emit("error", {
      type,
      message,
    });
    client.disconnect();
  }

  private getUserFromJWT(client: Socket): JWTUser {
    try {
      const result = this.jwtService.verify(
        client.handshake.headers.authorization,
        { secret: process.env.JWT_SECRET },
      );
      return result.user;
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        this.doException(client, ErrorTypes.JwtError, "JWT must be provided!");
      }
    }
  }
}
