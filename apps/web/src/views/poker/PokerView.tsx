import type React from "react";
import Navbar from "@/components/organisms/navbar/Navbar";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  AvatarStatus,
} from "@/components/ui/avatar";
import { usePoker } from "@/context/poker/PokerContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { DeckPicker, decks } from "@/views/poker/components/DeckPicker";
import { PokerToolbar } from "@/views/poker/components/PokerToolbar";

export const PokerView: React.FC = () => {
  const { deckId, selectedCard, activeUsers, selectDeck, selectCard } =
    usePoker();
  const { user } = useUser();
  const selectedDeck = decks.find((deck) => deck.id === deckId) ?? decks[1];

  return (
    <>
      <Navbar
        avatarProps={{
          isReady: selectedCard !== undefined,
        }}
        topContent={
          <>
            <NavbarAction>
              <DeckPicker selectedDeckId={deckId} onDeckChange={selectDeck} />
            </NavbarAction>

            <AvatarGroup className="mt-0.5">
              {activeUsers
                .filter((activeUser) => activeUser.userId !== user?.id)
                .map((activeUser) => (
                  <Avatar key={activeUser.userId}>
                    <AvatarImage src={activeUser.avatarLink} />
                    <AvatarFallback>:)</AvatarFallback>
                    {activeUser.selectedCard !== null && <AvatarStatus />}
                  </Avatar>
                ))}
            </AvatarGroup>
          </>
        }
      />

      <div className="relative flex-1">
        <PokerToolbar
          cards={selectedDeck.values}
          selectedCard={selectedCard}
          onCardSelect={selectCard}
        />
      </div>
    </>
  );
};
