import { FlashcardData } from '../flashcards/types';
import './CardFront.css';

type CardFrontProps = {
  card: Pick<FlashcardData, 'name' | 'imageUrl' | 'frontText' | 'backgroundColor'>;
  /** Alt text for a picture; pass "" when something else already names the card. */
  alt?: string;
  className?: string;
};

// Pick dark or white text so words stay readable on any background color the parent chose.
function textColorFor(background?: string) {
  const hex = background?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return '#0f172a';
  const full = hex.length === 3 ? hex.replace(/./g, (digit) => digit + digit) : hex;
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = parseInt(full.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Above ~0.2, dark text has more contrast than white.
  return luminance > 0.2 ? '#0f172a' : '#ffffff';
}

// Count what a reader sees as characters, so an emoji (several code units, e.g. 👩‍🚒) sizes like one letter.
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : null;
const visibleLength = (text: string) => (segmenter ? [...segmenter.segment(text)].length : Array.from(text).length);

const textSize = (text: string) => {
  const length = visibleLength(text);
  return length <= 3 ? 's' : length <= 10 ? 'm' : 'l';
};

/** The front of a card: its picture, its text, or just its color. */
export function CardFront({ card, alt, className }: CardFrontProps) {
  const style = card.backgroundColor ? { background: card.backgroundColor } : undefined;
  const text = card.frontText?.trim();
  return (
    <div className={['card-front', className ?? ''].filter(Boolean).join(' ')} style={style}>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={alt ?? card.name} loading="lazy" />
      ) : text ? (
        <span
          className={`card-front__text card-front__text--${textSize(text)}`}
          style={{ color: textColorFor(card.backgroundColor) }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}
