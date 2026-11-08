import { Injectable, UseFilters, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import * as dayjs from "dayjs";
import { Task, User } from "generated/prisma/client";
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
  CompleteWarmupCommand,
  CreateCardCommand,
  CreateTaskCommand,
  DeleteCardCommand,
  DeleteTaskCommand,
  DrawMachineCommand,
  MoveCardToColumnCommand,
  RemoveCardVoteCommand,
  ReorderColumnsCommand,
  StartWarmupDrawCommand,
  UpdateCardCommand,
  UpdateCreatingTaskStateCommand,
  UpdateReadyStateCommand,
  UpdateRoomStateCommand,
  UpdateTaskCommand,
  UpdateWarmupRoomUrlCommand,
  UpdateWriteStateCommand,
} from "shared/model/retro/retro.commands";
import {
  ColumnDescriptionChangedEvent,
  ColumnNameChangedEvent,
  ColumnsReorderedEvent,
  SlotMachineDrawnEvent,
  TimerChangedEvent,
  WarmupDrawStartedEvent,
  WarmupRoomUrlUpdatedEvent,
} from "shared/model/retro/retro.events";
import {
  Card,
  RetroColumn,
  User as SocketUser,
} from "shared/model/retro/retroRoom.interface";
import type { WarmupState } from "shared/model/warmup/warmup";
import { type Namespace, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { verifyAccessToken } from "../../auth/session/access-token.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamSocketGuard } from "../../security/team-socket.guard";
import { TeamSocketAccessService } from "../../security/team-socket-access.service";
import { validateWarmupLink } from "../../warmup/warmup-links";
import { RetroRoom } from "../domain/model/retroRoom.object";
import { RetroRoomPersistence } from "../domain/retro-room.persistence";
import { RetroCommandGuard } from "./retro-command.guard";
import { RetroWsExceptionFilter } from "./retro-ws-exception.filter";
import { canTransition } from "./roomstate.validator";

type SocketId = string;

@Injectable()
@UseGuards(TeamSocketGuard, RetroCommandGuard)
@UseFilters(RetroWsExceptionFilter)
@WebSocketGateway(3001, { cors: true, namespace: "retro" })
export class RetroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private users = new Map<
    SocketId,
    { roomId: string; teamId: string; user: User }
  >();
  private retroRooms = new Map<string, RetroRoom>();
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private roomPersistence: RetroRoomPersistence,
    private accessService: TeamSocketAccessService,
  ) {}

  async addRetroRoom(
    retroId: string,
    teamId: string,
    columns: RetroColumn[],
    warmup: WarmupState | null = null,
  ) {
    const retroRoom = new RetroRoom(retroId, teamId, columns, warmup);
    await this.roomPersistence.persist(retroRoom);
    this.retroRooms.set(retroId, retroRoom);
    return retroRoom;
  }

  async restoreRooms() {
    for (const room of await this.roomPersistence.recoverRunningRooms()) {
      this.retroRooms.set(room.id, room);
      if (room.warmup?.status === "spinning") {
        this.scheduleWarmupReveal(room.id, room.warmup.spinEndsAt);
      }
    }
  }

  private scheduleWarmupReveal(roomId: string, spinEndsAt: number | null) {
    if (spinEndsAt === null) return;
    setTimeout(
      async () => {
        const room = this.retroRooms.get(roomId);
        if (!room || room.warmup?.spinEndsAt !== spinEndsAt) return;
        room.revealWarmupIfFinished();
        if (room.warmup.status === "spinning") {
          this.scheduleWarmupReveal(roomId, spinEndsAt);
          return;
        }
        await this.emitRoomSync(roomId, room);
      },
      Math.max(1, spinEndsAt - Date.now()),
    );
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
    await this.accessService.flushBroadcasts(this.server.adapter);
    this.server.to(room.id).disconnectSockets(true);
  }

  async handleConnection(client: Socket) {
    const retroId = client.handshake.query.retro_id;
    if (typeof retroId !== "string" || retroId.trim().length === 0) {
      this.doException(
        client,
        ErrorTypes.Unauthorized,
        "Invalid retrospective",
      );
      return;
    }
    const user = this.getUserFromJWT(client);
    if (
      typeof user?.google_id !== "string" ||
      user.google_id.trim().length === 0
    ) {
      this.doException(client, ErrorTypes.JwtError, "Invalid token user");
      return;
    }
    const room = this.retroRooms.get(retroId);

    if (!room) {
      this.doException(
        client,
        ErrorTypes.RetrospectiveNotFound,
        `Retrospective (${retroId}) not found`,
      );
      return;
    }

    try {
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

      this.accessService.register(client, room.teamId, userQuery.id, (role) => {
        const roomUser = room.connectedUsers.get(client.id);
        if (roomUser) roomUser.role = role;
      });
      try {
        await this.accessService.authorize(client);
      } catch {
        room.removeUser(client.id, userQuery.id);
        this.doException(client, ErrorTypes.Unauthorized, "Team access denied");
        return;
      }

      client.join(retroId);

      this.server.to(room.id).emit("event_room_sync", room.getRoomSyncData());
    } catch {
      this.handleDisconnect(client);
      this.doException(client, ErrorTypes.Unauthorized, "Connection rejected");
    }
  }

  @SubscribeMessage("command_ready")
  async handleReady(client: Socket, { readyState }: UpdateReadyStateCommand) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    if (roomUser.isReady !== readyState) {
      roomUser.isReady = readyState;

      await this.emitRoomSync(roomId, room);
    }
  }

  @SubscribeMessage("command_start_warmup_draw")
  async handleStartWarmupDraw(client: Socket, _: StartWarmupDrawCommand) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id)?.roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room?.connectedUsers.get(client.id);
    if (!room || !roomUser || !this.hasAdminPrivileges(roomUser)) return;

    const draw = room.startWarmupDraw();
    if (!draw) return;
    const event: WarmupDrawStartedEvent = draw;
    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_warmup_draw_started", event);

    this.scheduleWarmupReveal(roomId, draw.spinEndsAt);
  }

  @SubscribeMessage("command_update_warmup_room_url")
  async handleUpdateWarmupRoomUrl(
    client: Socket,
    payload: UpdateWarmupRoomUrlCommand,
  ) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id)?.roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room?.connectedUsers.get(client.id);
    const actorId = this.users.get(client.id)?.user.id;
    if (!room || !roomUser || !actorId || !this.hasAdminPrivileges(roomUser)) {
      return;
    }

    const url = validateWarmupLink({ name: "room", url: payload.url }).url;
    if (!room.updateWarmupRoomUrl(url, actorId)) return;
    await this.roomPersistence.persist(room);
    const event: WarmupRoomUrlUpdatedEvent = {
      url,
      revision: room.warmup.sharedRoomUrlRevision,
      actorId,
    };
    this.server.to(roomId).emit("event_warmup_room_url_updated", event);
  }

  @SubscribeMessage("command_complete_warmup")
  async handleCompleteWarmup(client: Socket, _: CompleteWarmupCommand) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id)?.roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room?.connectedUsers.get(client.id);
    if (!room || !roomUser || !this.hasAdminPrivileges(roomUser)) return;
    if (!room.completeWarmup()) return;
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_slot_machine_visibility")
  async handleChangeSlotMachineVisibility(
    client: Socket,
    { isVisible }: ChangeSlotMachineVisibilityCommand,
  ) {
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
    if (payload.text.trim().length === 0) return;
    if (payload.text.length > 1000) payload.text = payload.text.slice(0, 1000);

    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);
    const roomUser = room.connectedUsers.get(client.id);

    const card: Card = {
      id: uuid(),
      text: payload.text,
      columnId: payload.columnId,
      authorId: roomUser.userId,
      parentCardId: null,
    };

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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    const roomUser = room.connectedUsers.get(client.id);
    if (
      !this.hasAdminPrivileges(roomUser) ||
      !canTransition(room, payload.roomState)
    )
      return;

    room.changeState(payload.roomState);

    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_timer_change")
  async handleChangeTimer(client: Socket, payload: ChangeTimerCommand) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    if (!this.hasAdminPrivileges(room.connectedUsers.get(client.id))) return;
    if (room.timerEnds === payload.timestamp) return;
    room.timerEnds = payload.timestamp;

    const event: TimerChangedEvent = {
      timerEnds: room.timerEnds,
    };

    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_timer_change", event);
  }

  @SubscribeMessage("command_vote_on_card")
  async handleVoteOnCard(client: Socket, payload: AddCardVoteCommand) {
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    if (!room.addCardToCard(payload.parentCardId, payload.cardId)) return;
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_move_card_to_column")
  async handleMoveCardToColumn(
    client: Socket,
    payload: MoveCardToColumnCommand,
  ) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    if (!room.moveCardToColumn(payload.cardId, payload.columnId)) return;
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_close_room")
  async handleCloseRoom(client: Socket) {
    if (!this.getCommandContext(client)) return;
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
    if (!this.getCommandContext(client)) return;
    if (
      typeof payload?.description !== "string" ||
      payload.description.trim().length === 0
    ) {
      return;
    }

    const userEntry = this.users.get(client.id);
    if (
      !userEntry ||
      (payload?.ownerId !== null &&
        (typeof payload?.ownerId !== "string" ||
          payload.ownerId.trim().length === 0))
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    const roomId = userEntry.roomId;
    const room = this.retroRooms.get(roomId);
    if (
      !room ||
      (payload?.ownerId !== null &&
        !(await this.isTeamMember(room.teamId, payload.ownerId)))
    ) {
      this.rejectTaskCommand(client);
      return;
    }

    const board = await this.prismaService.board.findUnique({
      where: {
        team_id: room.teamId,
      },
    });
    if (!board) return;
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
    if (!this.getCommandContext(client)) return;
    const userEntry = this.users.get(client.id);
    if (
      !userEntry ||
      typeof payload?.taskId !== "string" ||
      payload.taskId.trim().length === 0
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    const roomId = userEntry.roomId;
    const room = this.retroRooms.get(roomId);
    if (!room) return;
    try {
      await this.prismaService.task.delete({
        where: { id: payload.taskId, team_id: room.teamId, retro_id: room.id },
      });
    } catch {
      this.rejectTaskCommand(client);
      return;
    }

    room.deleteTask(payload.taskId);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_update_action_point")
  async handleUpdateTask(client: Socket, payload: UpdateTaskCommand) {
    if (!this.getCommandContext(client)) return;
    const userEntry = this.users.get(client.id);
    if (
      !userEntry ||
      typeof payload?.taskId !== "string" ||
      payload.taskId.trim().length === 0 ||
      typeof payload?.description !== "string" ||
      (payload?.ownerId !== null &&
        (typeof payload?.ownerId !== "string" ||
          payload.ownerId.trim().length === 0))
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    const roomId = userEntry.roomId;
    const room = this.retroRooms.get(roomId);
    if (
      !room ||
      (payload?.ownerId !== null &&
        !(await this.isTeamMember(room.teamId, payload.ownerId)))
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    let task: Task;
    try {
      task = await this.prismaService.task.update({
        data: {
          description: payload.description,
          owner_id: payload.ownerId,
        },
        where: { id: payload.taskId, team_id: room.teamId, retro_id: room.id },
      });
    } catch {
      this.rejectTaskCommand(client);
      return;
    }

    room.updateTask(task);
    await this.emitRoomSync(roomId, room);
  }

  @SubscribeMessage("command_change_discussion_card")
  async handleChangeDiscussionCard(
    client: Socket,
    payload: ChangeCurrentDiscussCardCommand,
  ) {
    if (!this.getCommandContext(client)) return;
    const roomId = this.users.get(client.id).roomId;
    const room = this.retroRooms.get(roomId);

    if (!room.changeDiscussionCard(payload.cardId)) return;
    await this.emitRoomSync(roomId, room);
  }

  async handleDisconnect(client: Socket) {
    this.accessService.unregister(client);
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

  private async emitRoomSync(roomId: string, room: RetroRoom) {
    const data = room.getRoomSyncData();
    // Detach the emitted state from subsequent concurrent commands.
    const snapshot = JSON.parse(JSON.stringify(data));
    await this.roomPersistence.persist(room);
    this.server.to(roomId).emit("event_room_sync", snapshot);
  }

  private getCommandContext(client: Socket) {
    const entry = this.users.get(client.id);
    if (!entry) return null;
    const room = this.retroRooms.get(entry.roomId);
    const roomUser = room?.connectedUsers.get(client.id);
    if (!room || !roomUser) return null;
    return { entry, room, roomUser };
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
    this.accessService.unregister(client);
    this.users.delete(client.id);

    client.emit("error", {
      type,
      message,
    });
    client.disconnect();
  }

  private getUserFromJWT(client: Socket) {
    try {
      const claims = verifyAccessToken(
        this.jwtService,
        client.handshake.headers.authorization,
      );
      client.data ??= {};
      client.data.authClaims = claims;
      return claims.user;
    } catch {
      this.doException(client, ErrorTypes.JwtError, "JWT must be provided!");
      return null;
    }
  }

  private async isTeamMember(teamId: string, userId: string) {
    try {
      return !!(await this.prismaService.teamUsers.findFirst({
        where: { team_id: teamId, user_id: userId },
        select: { user_id: true },
      }));
    } catch {
      return false;
    }
  }

  private rejectTaskCommand(client: Socket) {
    client.emit("error", {
      type: ErrorTypes.Unauthorized,
      message: "Task command rejected",
    });
  }

  private hasAdminPrivileges(user: SocketUser): boolean {
    return user.role === "ADMIN" || user.role === "OWNER";
  }
}
