import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import * as dayjs from "dayjs";
import { User } from "generated/prisma/client";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import {
  AddCardToCardCommand,
  AddCardVoteCommand,
  ChangeColumnDescriptionCommand,
  ChangeColumnNameCommand,
  ChangeCurrentDiscussCardCommand,
  ChangeSlotMachineVisibilityCommand,
  ChangeTimerCommand,
  ChangeVoteAmountCommand,
  CreateCardCommand,
  CreateTaskCommand,
  DeleteCardCommand,
  DeleteTaskCommand,
  DrawMachineCommand,
  MoveCardToColumnCommand,
  RemoveCardVoteCommand,
  ReorderColumnsCommand,
  UpdateCardCommand,
  UpdateCreatingTaskStateCommand,
  UpdateReadyStateCommand,
  UpdateRoomStateCommand,
  UpdateTaskCommand,
  UpdateWriteStateCommand,
} from "shared/model/retro/retro.commands";
import {
  ColumnDescriptionChangedEvent,
  ColumnNameChangedEvent,
  ColumnsReorderedEvent,
  SlotMachineDrawnEvent,
  TimerChangedEvent,
} from "shared/model/retro/retro.events";
import {
  Card,
  RetroColumn,
  User as SocketUser,
} from "shared/model/retro/retroRoom.interface";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { JWTUser } from "../../auth/jwt/JWTUser";
import { PrismaService } from "../../prisma/prisma.service";
import { RetroRoom } from "../domain/model/retroRoom.object";
import { RetroRoomPersistence } from "../domain/retro-room.persistence";
import { validate as validateRoomState } from "./roomstate.validator";

type SocketId = string;

@Injectable()
@WebSocketGateway(3001, { cors: true, namespace: "retro" })
export class RetroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users = new Map<
    SocketId,
    { roomId: string; teamId: string; user: User }
  >();
  private retroRooms = new Map<string, RetroRoom>();
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private roomPersistence: RetroRoomPersistence,
  ) {}

  async addRetroRoom(retroId: string, teamId: string, columns: RetroColumn[]) {
    const retroRoom = new RetroRoom(retroId, teamId, columns);
    await this.roomPersistence.persist(retroRoom);
    this.retroRooms.set(retroId, retroRoom);
    return retroRoom;
  }

  async restoreRooms() {
    for (const room of await this.roomPersistence.recoverRunningRooms()) {
      this.retroRooms.set(room.id, room);
    }
  }

  async handleTeamUserAdded(teamId: string, userId: string) {
    const teamRooms = Array.from(this.retroRooms.values()).filter(
      (room) => room.teamId === teamId,
    );

    for (const room of teamRooms) {
      room.onTeamUserAdded(userId);

      this.server.to(room.id).emit("event_team_users_change");

      await this.emitRoomSync(room.id, room);
    }
  }

  async handleTeamUserRemoved(teamId: string, userId: string) {
    const teamRooms = Array.from(this.retroRooms.values()).filter(
      (room) => room.teamId === teamId,
    );

    for (const room of teamRooms) {
      room.onTeamUserRemoved(userId);

      this.server.to(room.id).emit("event_team_users_change");

      await this.emitRoomSync(room.id, room);
    }

    // Disconnect all user sessions from the team
    const userSocketIds: string[] = [];
    for (const [socketId, entry] of Array.from(this.users.entries())) {
      if (entry.teamId === teamId && entry.user.id === userId) {
        userSocketIds.push(socketId);
      }
    }
    for (const socket of await this.server.fetchSockets()) {
      if (userSocketIds.includes(socket.id)) {
        socket.disconnect();
      }
    }
  }

  async handleTeamDeleted(teamId: string) {
    const teamRooms = Array.from(this.retroRooms.values()).filter(
      (room) => room.teamId === teamId,
    );

    for (const room of teamRooms) {
      await this.closeRoom(room);
    }
  }

  async closeStaleRooms(): Promise<number> {
    let closedRooms = 0;

    for (const [, room] of this.retroRooms) {
      const isStaleRoom =
        room.connectedUsers.size === 0 &&
        dayjs(room.lastDisconnectionDate).add(30, "m").isBefore(dayjs());

      if (isStaleRoom) {
        closedRooms += 1;
        await this.closeRoom(room);
      }
    }

    return closedRooms;
  }

  async closeRoom(room: RetroRoom) {
    await this.roomPersistence.markFinished(room.id);

    this.retroRooms.delete(room.id);
    this.server.to(room.id).emit("event_close_room");
    this.server.to(room.id).disconnectSockets(true);
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

    const userQuery = await this.prismaService.user.findFirst({
      where: {
        google_id: user.google_id,
      },
      include: {
        TeamUsers: {
          where: {
            team_id: room.teamId,
          },
        },
      },
    });

    if (!userQuery || userQuery.TeamUsers.length === 0) {
      this.doException(
        client,
        ErrorTypes.UserNotFound,
        `User (${user.google_id}) not found or is not a member of the retrospective team`,
      );
      return;
    }

    const userRole = userQuery.TeamUsers.at(0).role;

    room.addUser(client.id, userQuery, userRole);

    this.users.set(client.id, {
      user: userQuery,
      teamId: room.teamId,
      roomId: room.id,
    });

    client.join(retroId);

    this.server.to(room.id).emit("event_room_sync", room.getRoomSyncData());
  }

  @SubscribeMessage("command_ready")
  async handleReady(client: Socket, { readyState }: UpdateReadyStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (roomUser.isReady !== readyState) {
      roomUser.isReady = readyState;

      await this.emitRoomSync(roomId, room);
    }
  }

  @SubscribeMessage("command_change_slot_machine_visibility")
  async handleChangeSlotMachineVisibility(
    client: Socket,
    { isVisible }: ChangeSlotMachineVisibilityCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (!this.hasAdminPrivileges(roomUser)) {
      return;
    }

    room.setSlotMachineVisibility(isVisible);

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_draw_slot_machine")
  async handleDrawSlotMachine(client: Socket, _: DrawMachineCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.drawMachine();

    const event: SlotMachineDrawnEvent = {
      highlightedUserId: room.highlightedUserId,
      actorId: this.users.get(client.id).user.id,
    };

    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_slot_machine_drawn", event);
  }

  @SubscribeMessage("command_creating_task_state")
  async handleCreatingTaskState(
    client: Socket,
    { creatingTaskState }: UpdateCreatingTaskStateCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (roomUser.isCreatingTask !== creatingTaskState) {
      roomUser.isCreatingTask = creatingTaskState;

      await this.emitRoomSync(roomId, room);
    }
  }

  @SubscribeMessage("command_create_card")
  async handleNewCard(client: Socket, payload: CreateCardCommand) {
    if (payload.text.trim().length === 0) return;
    if (payload.text.length > 1000) payload.text = payload.text.slice(0, 1000);

    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

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

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_update_card")
  async handleUpdateCard(client: Socket, payload: UpdateCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (payload.text.trim().length === 0) return;
    if (payload.text.length > 1000) payload.text = payload.text.slice(0, 1000);

    const cardIndex = room.cards.findIndex(
      (card) => card.id === payload.cardId && card.authorId === roomUser.userId,
    );
    if (cardIndex === -1) {
      return;
    }

    room.cards[cardIndex].text = payload.text;

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_delete_card")
  async handleDeleteCard(client: Socket, { cardId }: DeleteCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    const cardIndex = room.cards.findIndex(
      (card) => card.id === cardId && card.authorId === roomUser.userId,
    );

    if (cardIndex === -1) {
      return;
    }

    room.cards = room.cards.filter(
      (card) => !(card.id === cardId && card.authorId === roomUser.userId),
    );
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_write_state")
  async handleWriteState(client: Socket, payload: UpdateWriteStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

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

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_column_name")
  handleChangeColumnName(client: Socket, payload: ChangeColumnNameCommand) {
    const context = this.getColumnEditContext(client);
    if (!context) return;

    const name = payload.name.trim();
    if (
      name.length === 0 ||
      !context.room.changeColumnName(payload.columnId, name)
    ) {
      return;
    }

    const event: ColumnNameChangedEvent = { columnId: payload.columnId, name };
    this.server.to(context.roomId).emit("event_column_name_changed", event);
  }

  @SubscribeMessage("command_change_column_description")
  handleChangeColumnDescription(
    client: Socket,
    payload: ChangeColumnDescriptionCommand,
  ) {
    const context = this.getColumnEditContext(client);
    if (!context) return;

    const description = payload.description.trim().slice(0, 1000);
    if (!context.room.changeColumnDescription(payload.columnId, description)) {
      return;
    }

    const event: ColumnDescriptionChangedEvent = {
      columnId: payload.columnId,
      description,
    };
    this.server
      .to(context.roomId)
      .emit("event_column_description_changed", event);
  }

  @SubscribeMessage("command_reorder_columns")
  handleReorderColumns(client: Socket, payload: ReorderColumnsCommand) {
    const context = this.getColumnEditContext(client);
    if (!context) return;
    if (
      !context.room.reorderColumns(payload.fromColumnId, payload.toColumnId)
    ) {
      return;
    }

    const event: ColumnsReorderedEvent = {
      columnIds: context.room.retroColumns.map((column) => column.id),
    };
    this.server.to(context.roomId).emit("event_columns_reordered", event);
  }

  @SubscribeMessage("command_room_state")
  async handleRoomState(client: Socket, payload: UpdateRoomStateCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    const isValid = validateRoomState(payload.roomState);
    if (!isValid) {
      this.doException(
        client,
        ErrorTypes.InvalidRoomState,
        `Invalid room state value (${payload.roomState})`,
      );
      return;
    }

    room.changeState(payload.roomState);

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_timer_change")
  async handleChangeTimer(client: Socket, payload: ChangeTimerCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.timerEnds = payload.timestamp;

    const event: TimerChangedEvent = {
      timerEnds: room.timerEnds,
    };

    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_timer_change", event);
  }

  @SubscribeMessage("command_vote_on_card")
  async handleVoteOnCard(client: Socket, payload: AddCardVoteCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

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
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_remove_vote_on_card")
  async handleRemoveVoteOnCard(client: Socket, payload: RemoveCardVoteCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    room.removeVote(roomUser.userId, payload.parentCardId);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_vote_amount")
  async handleChangeVoteAmount(
    client: Socket,
    payload: ChangeVoteAmountCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (!this.hasAdminPrivileges(roomUser)) {
      return;
    }

    room.setVoteAmount(payload.votesAmount);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_card_add_to_card")
  async handleCardAddToCard(client: Socket, payload: AddCardToCardCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.addCardToCard(payload.parentCardId, payload.cardId);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_move_card_to_column")
  async handleMoveCardToColumn(
    client: Socket,
    payload: MoveCardToColumnCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.moveCardToColumn(payload.cardId, payload.columnId);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_close_room")
  async handleCloseRoom(client: Socket) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (!this.hasAdminPrivileges(roomUser)) {
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
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_delete_action_point")
  async handleDeleteTask(client: Socket, payload: DeleteTaskCommand) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    await this.prismaService.task.delete({
      where: { id: payload.taskId },
    });

    room.deleteTask(payload.taskId);
    await this.emitRoomSync(roomId, room);
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
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_discussion_card")
  async handleChangeDiscussionCard(
    client: Socket,
    payload: ChangeCurrentDiscussCardCommand,
  ) {
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    room.changeDiscussionCard(payload.cardId);
    await this.emitRoomSync(roomId, room);
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

    client.disconnect(true);

    this.server.to(roomId).emit("event_room_sync", room.getRoomSyncData());
  }

  private async emitRoomSync(roomId: string, room: RetroRoom) {
    const data = room.getRoomSyncData();
    // Detach the emitted state from subsequent concurrent commands.
    const snapshot = JSON.parse(JSON.stringify(data));
    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_room_sync", snapshot);
  }

  private getColumnEditContext(client: Socket) {
    const userEntry = this.users.get(client.id);
    if (!userEntry) return null;
    const room = this.retroRooms.get(userEntry.roomId);
    const roomUser = room?.connectedUsers.get(client.id);
    if (
      !room ||
      !roomUser ||
      room.roomState !== "reflection" ||
      !this.hasAdminPrivileges(roomUser)
    ) {
      return null;
    }
    return { roomId: userEntry.roomId, room };
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

  private hasAdminPrivileges(user: SocketUser): boolean {
    return user.role === "ADMIN" || user.role === "OWNER";
  }
}
