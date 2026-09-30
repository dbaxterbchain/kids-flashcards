import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { printSheets, PrintSheet } from '../flashcards/printLayout';
import { fitStyle } from '../flashcards/textFit';
import { FlashcardData, FlashcardSet } from '../flashcards/types';
import { CardFront } from './CardFront';
import './PrintSetDialog.css';

type PrintSetDialogProps = {
  /** The set to print, or null when the dialog is closed. */
  set: FlashcardSet | null;
  /** The set's cards, in the order they're shown. */
  cards: FlashcardData[];
  onClose: () => void;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function PrintCard({ card, side, withPrompts }: { card: FlashcardData | null; side: 'front' | 'back'; withPrompts: boolean }) {
  if (!card) return <div className="print-card print-card--empty" />;
  return side === 'front' ? (
    <div className="print-card">
      <CardFront card={card} alt={card.name} />
    </div>
  ) : (
    <div className="print-card print-card--back">
      <p className="print-card__word" style={fitStyle(card.name, 800)} lang={card.lang}>
        {card.name}
      </p>
      {withPrompts && card.prompt && <p className="print-card__prompt">{card.prompt}</p>}
    </div>
  );
}

function Sheets({ sheets, withPrompts }: { sheets: PrintSheet[]; withPrompts: boolean }) {
  return (
    <>
      {sheets.flatMap((sheet, index) => [
        <div key={`front-${index}`} className="print-page">
          {sheet.fronts.map((card, spot) => (
            <PrintCard key={spot} card={card} side="front" withPrompts={withPrompts} />
          ))}
        </div>,
        <div key={`back-${index}`} className="print-page">
          {sheet.backs.map((card, spot) => (
            <PrintCard key={spot} card={card} side="back" withPrompts={withPrompts} />
          ))}
        </div>,
      ])}
    </>
  );
}

/** Previews a set as printable two-sided cards and prints it. */
export function PrintSetDialog({ set, cards, onClose }: PrintSetDialogProps) {
  const [withPrompts, setWithPrompts] = useState(true);
  const open = Boolean(set);
  const sheets = printSheets(cards);
  const hasPrompts = cards.some((card) => card.prompt);

  // While the dialog is open, printing shows only the cards (see PrintSetDialog.css).
  useEffect(() => {
    if (!open) return undefined;
    document.documentElement.classList.add('printing-cards');
    return () => document.documentElement.classList.remove('printing-cards');
  }, [open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
          <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
            Print &ldquo;{set?.name}&rdquo;
          </Box>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ maxWidth: 720, mx: 'auto' }}>
            <Typography>
              {plural(cards.length, 'card')} on {plural(sheets.length, 'sheet')} of paper, printed on both sides.
            </Typography>
            <Typography component="ol" sx={{ m: 0, pl: 3 }}>
              <li>Print in color on both sides of the paper, flipping on the long edge.</li>
              <li>Cut along the dashed lines.</li>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If your printer can&apos;t print on both sides, print just the odd pages, put the paper back in turned
              over, and print the even pages. Thicker paper or card stock works best.
            </Typography>
            {hasPrompts && (
              <FormControlLabel
                control={<Switch checked={withPrompts} onChange={(event) => setWithPrompts(event.target.checked)} />}
                label="Include the talk-about-it questions on the backs"
              />
            )}
            <Box>
              <Button variant="contained" size="large" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Print
              </Button>
            </Box>
            <Box className="print-preview" aria-label="Preview">
              <Sheets sheets={sheets} withPrompts={withPrompts} />
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
      {open && createPortal(<div className="print-sheets"><Sheets sheets={sheets} withPrompts={withPrompts} /></div>, document.body)}
    </>
  );
}
