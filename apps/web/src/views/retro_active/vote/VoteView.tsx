import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import CardVotesCounter from "@/components/molecules/card/CardVotesCounter";
import { Column } from "@/components/molecules/column/Column";
import { CardGroup } from "@/components/molecules/dragndrop/CardGroup";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";

export const VoteView = () => {
  const { columns, cards, teamUsers, votes, maxVotes, addVote, removeVote } =
    useRetro();
  const { user } = useUser();

  const votesLeft =
    maxVotes - votes.filter((vote) => user?.id === vote.voterId).length;

  return (
    <div
      className={
        "grid grid-flow-col [grid-auto-columns:minmax(300px,1fr)] h-full"
      }
    >
      {columns?.map((column) => {
        const columnCards = cards.filter((c) => c.columnId === column.id);

        return (
          <Column
            key={column.id}
            columnData={{
              name: column.name,
              description: column.description,
            }}
          >
            {columnCards
              .filter((c) => c.parentCardId === null)
              .map((group) => {
                const groupCards = [
                  group,
                  ...cards.filter((c) => c.parentCardId === group.id),
                ];
                return (
                  <CardGroup
                    key={group.id}
                    columnId={column.id}
                    parentCardId={group.id}
                  >
                    {groupCards.map((card, index) => {
                      const author = teamUsers.find(
                        (user) => user.id === card.authorId,
                      );
                      const userVotes = votes.filter(
                        (vote) =>
                          user?.id === vote.voterId &&
                          (vote.parentCardId === card.id ||
                            vote.parentCardId === card.parentCardId),
                      ).length;

                      return (
                        <Card
                          id={card.id}
                          key={card.id}
                          style={{ marginTop: index === 0 ? 0 : -80 }}
                        >
                          <CardContent text={card.text} />
                          <CardAuthor
                            author={{
                              avatar: author?.avatar_link || "",
                              name: author?.nick || "",
                              id: card.authorId,
                            }}
                          />
                          {groupCards.length === index + 1 && (
                            <CardActions>
                              <CardVotesCounter
                                className={"h-full"}
                                canIncrement={votesLeft > 0}
                                count={userVotes}
                                onIncrement={() => {
                                  addVote(card.id);
                                }}
                                onDecrement={() => {
                                  removeVote(card.id);
                                }}
                              />
                            </CardActions>
                          )}
                        </Card>
                      );
                    })}
                  </CardGroup>
                );
              })}
          </Column>
        );
      })}
    </div>
  );
};
