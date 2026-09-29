import { ButtonBase } from '@mui/material';
import { FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import './SetTiles.css';

export type SetTile = {
  id: string;
  name: string;
  cards: FlashcardData[];
  /** Cards to show on the tile; defaults to the first ones in the set. */
  cover?: FlashcardData[];
};

type SetTilesProps = {
  tiles: SetTile[];
  onOpen: (setId: string) => void;
};

/** Big, tappable tiles for picking what to learn, each showing a peek at its cards. */
export function SetTiles({ tiles, onOpen }: SetTilesProps) {
  return (
    <div className="set-tiles">
      {tiles.map((tile) => {
        const candidates = tile.cover ?? tile.cards;
        const cover = candidates.length >= 4 ? candidates.slice(0, 4) : candidates.slice(0, 1);
        return (
          <ButtonBase
            key={tile.id}
            focusRipple
            className="set-tile"
            onClick={() => onOpen(tile.id)}
            aria-label={`${tile.name}, ${tile.cards.length} card${tile.cards.length === 1 ? '' : 's'}`}
          >
            <span className={`set-tile__cover${cover.length === 4 ? ' set-tile__cover--grid' : ''}`} aria-hidden>
              {cover.map((card) => (
                <span key={card.id} className="set-tile__cell">
                  <CardFront card={card} alt="" />
                </span>
              ))}
            </span>
            <span className="set-tile__label">
              <span className="set-tile__name">{tile.name}</span>
              <span className="set-tile__count">{tile.cards.length}</span>
            </span>
          </ButtonBase>
        );
      })}
    </div>
  );
}
