import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { explainedNote } from '../flashcards/explain';
import { languageLabel } from '../flashcards/languages';
import { SetPackage, uniqueSetName } from '../flashcards/setPackage';
import { FlashcardSet } from '../flashcards/types';
import { CardFront } from './CardFront';
import './SetImportDialog.css';

type SetImportDialogProps = {
  /** The set file that was picked, or null when the dialog is closed. */
  pkg: SetPackage | null;
  sets: FlashcardSet[];
  onClose: () => void;
  onImport: (pkg: SetPackage) => Promise<void>;
};

const PREVIEW_COUNT = 8;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function describe(pkg: SetPackage) {
  const pictures = pkg.cards.filter((card) => card.imageUrl).length;
  const recordings = pkg.cards.filter((card) => card.audioUrl).length;
  const languages = [...new Set(pkg.cards.map((card) => card.lang).filter((lang): lang is string => Boolean(lang)))];
  return [
    plural(pkg.cards.length, 'card'),
    pictures > 0 && plural(pictures, 'picture'),
    recordings > 0 && plural(recordings, 'recording'),
    languages.length > 0 && `read in ${languages.map(languageLabel).join(', ')}`,
    explainedNote(pkg.cards),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Shows what's in a shared set file before adding it. */
export function SetImportDialog({ pkg, sets, onClose, onImport }: SetImportDialogProps) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = pkg ? uniqueSetName(pkg.name, sets) : '';

  const close = () => {
    if (adding) return;
    setError(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!pkg) return;
    setAdding(true);
    setError(null);
    try {
      await onImport(pkg);
    } catch (importError) {
      console.error('Unable to add the set', importError);
      setError('Unable to add that set. Storage might be full or blocked.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={Boolean(pkg)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Add this set?</DialogTitle>
      <DialogContent>
        {pkg && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" component="p" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                {pkg.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {describe(pkg)}
              </Typography>
            </Box>
            {pkg.about && (
              <Typography variant="body2" className="set-import-about">
                {pkg.about}
              </Typography>
            )}
            <Box className="set-import-preview" aria-hidden>
              {pkg.cards.slice(0, PREVIEW_COUNT).map((card) => (
                <div key={card.id} className="set-import-preview__card">
                  <CardFront card={card} alt="" />
                </div>
              ))}
            </Box>
            {pkg.cards.length > PREVIEW_COUNT && (
              <Typography variant="body2" color="text.secondary">
                and {plural(pkg.cards.length - PREVIEW_COUNT, 'more card')}
              </Typography>
            )}
            {name !== pkg.name && (
              <Typography variant="body2">
                You already have a set called &ldquo;{pkg.name}&rdquo;, so this one will be called &ldquo;{name}&rdquo;.
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              It will be added as a new set. Nothing you already have will change.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} disabled={adding}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={adding}>
          {adding ? 'Adding…' : 'Add set'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
