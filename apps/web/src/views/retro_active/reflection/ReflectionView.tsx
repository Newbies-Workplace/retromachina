import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { TrashIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import { Column } from "@/components/molecules/column/Column";
import { ColumnInput } from "@/components/molecules/column/ColumnInput";
import { DraggableColumn } from "@/components/molecules/column/DraggableColumn";
import { ColumnCards } from "@/components/molecules/dragndrop/ColumnCards";
import { DraggableCard } from "@/components/molecules/dragndrop/DraggableCard";
import { Button } from "@/components/ui/button";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";
import { useReflectionCardStore } from "@/store/useReflectionCardStore";

export const ReflectionView: React.FC = () => {
  const { user } = useUser();
  const {
    teamUsers,
    teamId,
    columns,
    cards,
    moveCard,
    setWriting,
    createCard,
    updateCard,
    deleteCard,
    changeColumnName,
    changeColumnDescription,
    reorderColumns,
  } = useRetro();
  const { isAdmin } = useTeamRole(teamId ?? "");
  const { reflectionCards, deleteReflectionCard } = useReflectionCardStore();
  const [previewColumnIds, setPreviewColumnIds] = useState<string[]>(() =>
    columns.map((column) => column.id),
  );
  const previewColumnIdsRef = useRef(previewColumnIds);

  useEffect(() => {
    const nextOrder = columns.map((column) => column.id);
    previewColumnIdsRef.current = nextOrder;
    setPreviewColumnIds(nextOrder);
  }, [columns]);

  const previewColumnReorder = useCallback(
    (fromColumnId: string, toColumnId: string) => {
      const current = previewColumnIdsRef.current;
      const fromIndex = current.indexOf(fromColumnId);
      const toIndex = current.indexOf(toColumnId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
      }
      const nextOrder = reorder({
        list: current,
        startIndex: fromIndex,
        finishIndex: toIndex,
      });
      previewColumnIdsRef.current = nextOrder;
      setPreviewColumnIds(nextOrder);
    },
    [],
  );

  const commitColumnReorder = useCallback(
    (columnId: string) => {
      const originalOrder = columns.map((column) => column.id);
      const originalIndex = originalOrder.indexOf(columnId);
      const previewIndex = previewColumnIdsRef.current.indexOf(columnId);
      if (originalIndex === previewIndex || previewIndex === -1) {
        previewColumnIdsRef.current = originalOrder;
        setPreviewColumnIds(originalOrder);
        return;
      }
      const targetColumnId = originalOrder[previewIndex];
      if (targetColumnId) reorderColumns(columnId, targetColumnId);
    },
    [columns, reorderColumns],
  );

  const displayedColumns = useMemo(() => {
    const columnsById = new Map(columns.map((column) => [column.id, column]));
    const orderedColumns = previewColumnIds.flatMap((id) => {
      const column = columnsById.get(id);
      return column ? [column] : [];
    });
    return orderedColumns.length === columns.length ? orderedColumns : columns;
  }, [columns, previewColumnIds]);

  const onReflectionCardDrop = (reflectionCardId: string, columnId: string) => {
    if (!teamId) {
      return;
    }

    const card = reflectionCards.find((c) => c.id === reflectionCardId);
    if (!card) {
      console.log("Reflection card not found for id:", reflectionCardId);
      return;
    }

    deleteReflectionCard(teamId, reflectionCardId).then(() => {
      createCard(card.text, columnId);
    });
  };

  return (
    <div
      className={
        "grid grid-flow-col [grid-auto-columns:minmax(300px,1fr)] h-full"
      }
    >
      {displayedColumns.map((column) => {
        const columnCards = cards.filter((c) => c.columnId === column.id);

        return (
          <DraggableColumn
            key={column.id}
            columnId={column.id}
            enabled={isAdmin}
            onPreviewReorder={previewColumnReorder}
            onDragEnd={commitColumnReorder}
          >
            {(dragHandle) => (
              <Column
                columnData={{
                  name: column.name,
                  description: column.description,
                }}
                editable={isAdmin}
                headerRight={dragHandle}
                onNameSave={(name) => changeColumnName(column.id, name)}
                onDescriptionSave={(description) =>
                  changeColumnDescription(column.id, description)
                }
              >
                <ColumnInput
                  columnData={column}
                  onCardCreated={(value) => {
                    createCard(value, column.id);
                  }}
                  onIsWriting={(value) => {
                    setWriting(value, column.id);
                  }}
                />

                <ColumnCards
                  columnId={column.id}
                  onReflectionCardDropped={({ id }) => {
                    onReflectionCardDrop(id, column.id);
                  }}
                  onCardDropped={moveCard}
                >
                  {columnCards
                    ?.filter((card) => card.authorId === user?.id)
                    .map((card) => {
                      const user = teamUsers.find(
                        (user) => user.id === card.authorId,
                      );

                      return (
                        <DraggableCard
                          key={card.id}
                          parentCardId={card.parentCardId}
                          cardId={card.id}
                          columnId={column.id}
                          changeOpacityOnDrag
                        >
                          <Card id={card.id} key={card.id}>
                            <CardContent
                              text={card.text}
                              editable
                              onSave={(text) => updateCard(card.id, text)}
                            />
                            <CardAuthor
                              author={{
                                avatar: user?.avatar_link || "",
                                name: user?.nick || "",
                                id: card.authorId,
                              }}
                            />
                            <CardActions>
                              <Button
                                size={"icon"}
                                variant={"destructive"}
                                onClick={() => deleteCard(card.id)}
                              >
                                <TrashIcon className={"size-4"} />
                              </Button>
                            </CardActions>
                          </Card>
                        </DraggableCard>
                      );
                    })}
                </ColumnCards>
              </Column>
            )}
          </DraggableColumn>
        );
      })}
    </div>
  );
};
