import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, Dialog, DialogActions, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { speakAloud, stopSpeaking } from '../audio/sound';
import { explanationBlocks } from '../flashcards/explain';
import { fitStyle } from '../flashcards/textFit';
import { FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import './ExplainDialog.css';

/** What to explain: one card's "How it works", or a whole set's introduction. */
export type Explanation = { card: FlashcardData; text: string } | { setName: string; text: string };

type ExplainDialogProps = {
  /** What to explain, or null when the dialog is closed. */
  explanation: Explanation | null;
  onClose: () => void;
};

/** "How it works": a longer explanation to read together, with the card it's about. */
export function ExplainDialog({ explanation, onClose }: ExplainDialogProps) {
  const [reading, setReading] = useState(false);
  // Bumped when reading stops or the dialog changes, so a finished read-aloud doesn't reset a newer one.
  const runRef = useRef(0);

  // Start fresh for each explanation, and stop reading when it closes.
  useEffect(() => {
    if (!explanation) return undefined;
    runRef.current += 1;
    setReading(false);
    return () => {
      runRef.current += 1;
      stopSpeaking();
    };
  }, [explanation]);

  const close = () => {
    stopSpeaking();
    onClose();
  };

  const toggleReading = () => {
    if (!explanation) return;
    if (reading) {
      stopSpeaking();
      return;
    }
    const run = (runRef.current += 1);
    setReading(true);
    void speakAloud(explanation.text).then(() => {
      if (run === runRef.current) setReading(false);
    });
  };

  const card = explanation && 'card' in explanation ? explanation.card : null;
  const title = card ? card.name : explanation && 'setName' in explanation ? explanation.setName : '';

  return (
    <Dialog
      open={Boolean(explanation)}
      onClose={close}
      maxWidth="sm"
      fullWidth
      aria-labelledby="explain-heading"
      scroll="paper"
      // Narrower margins on phones leave more room for the words.
      slotProps={{ paper: { sx: { m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' } } } }}
    >
      {explanation && (
        <>
          <Box className="explain__header">
            <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <CloseIcon />
            </IconButton>
            <Typography id="explain-heading" variant="h6" component="h2" className="explain__heading">
              <LightbulbIcon aria-hidden className="explain__bulb" />
              {card ? 'How it works' : 'How this set works'}
            </Typography>
            {card ? (
              <Stack direction="row" spacing={2} alignItems="center" className="explain__subject">
                <Box className="explain__card">
                  <CardFront card={card} alt="" />
                </Box>
                <p className="explain__word" style={fitStyle(card.name, 800)} lang={card.lang}>
                  {card.name}
                </p>
              </Stack>
            ) : (
              <p className="explain__set-name">{title}</p>
            )}
          </Box>
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={1.5} className="explain__text">
              {explanationBlocks(explanation.text).map((block, index) =>
                block.kind === 'text' ? (
                  <Typography key={index} component="p">
                    {block.text}
                  </Typography>
                ) : (
                  <div key={index} className="explain__equations">
                    {block.rows.map((row, rowIndex) => (
                      <span key={rowIndex}>{row}</span>
                    ))}
                  </div>
                ),
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'space-between' }}>
            {'speechSynthesis' in window ? (
              <Button startIcon={reading ? <StopIcon /> : <VolumeUpIcon />} onClick={toggleReading}>
                {reading ? 'Stop reading' : 'Read it to me'}
              </Button>
            ) : (
              <span />
            )}
            <Button variant="contained" onClick={close}>
              Got it
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
