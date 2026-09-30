import { splitRanges } from '../flashcards/textFit';

/** Text whose number ranges ("0-10") never break across lines, so a line never ends with "0-". */
export function KeepRangesTogether({ text }: { text: string }) {
  return (
    <>
      {splitRanges(text).map((part, index) =>
        /^\d/.test(part) && part.includes('-') ? (
          <span key={index} style={{ whiteSpace: 'nowrap' }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
