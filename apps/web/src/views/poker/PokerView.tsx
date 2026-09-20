import type React from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import type { PokerCard } from "shared/model/poker/poker.types";
import Navbar from "@/components/organisms/navbar/Navbar";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { usePoker } from "@/context/poker/PokerContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { DeckPicker } from "@/views/poker/components/DeckPicker";
import { PokerTable } from "@/views/poker/components/PokerTable";
import { PokerToolbar } from "@/views/poker/components/PokerToolbar";
import { pokerDecks } from "@/views/poker/components/pokerDecks";

export const PokerView: React.FC = () => {
  const {
    deckId,
    cardsRevealed,
    selectedCard,
    activeUsers,
    selectDeck,
    selectCard,
    revealCards,
    clearTable,
  } = usePoker();
  const { user } = useUser();
  const selectedDeck =
    pokerDecks.find((deck) => deck.id === deckId) ?? pokerDecks[1];
  const cardVoteCounts = cardsRevealed
    ? getCardVoteCounts(activeUsers)
    : undefined;

  return (
    <>
      <Navbar
        topContent={
          <NavbarAction>
            <DeckPicker selectedDeckId={deckId} onDeckChange={selectDeck} />
          </NavbarAction>
        }
      />

      <div className="relative flex-1 overflow-hidden px-6 pt-8 pb-36">
        <PokerTable
          users={activeUsers}
          currentUserId={user?.id}
          cardsRevealed={cardsRevealed}
          onRevealCards={revealCards}
          onClearTable={clearTable}
        />

        <PokerToolbar
          cards={selectedDeck.values}
          selectedCard={selectedCard}
          cardVoteCounts={cardVoteCounts}
          onCardSelect={selectCard}
        />
      </div>
    </>
  );
};

const getCardVoteCounts = (users: ActivePokerUser[]) => {
  return users.reduce<Partial<Record<PokerCard, number>>>((counts, user) => {
    if (user.revealedCard !== null) {
      counts[user.revealedCard] = (counts[user.revealedCard] ?? 0) + 1;
    }

    return counts;
  }, {});
};
