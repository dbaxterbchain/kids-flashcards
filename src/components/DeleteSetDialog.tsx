import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { RemoveSetOptions } from '../hooks/useCardLibrary';
import { FlashcardData, FlashcardSet } from '../flashcards/types';

type DeleteSetDialogProps = {
  /** The set to delete, or null when the dialog is closed. */
  set: FlashcardSet | null;
  cards: FlashcardData[];
  onClose: () => void;
  onDelete: (set: FlashcardSet, options: RemoveSetOptions) => Promise<void>;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Confirms deleting a set, and whether the cards that are only in it go too. */
export function DeleteSetDialog({ set, cards, onClose, onDelete }: DeleteSetDialogProps) {
  const [deleteCards, setDeleteCards] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inSet = set ? cards.filter((card) => card.setIds?.includes(set.id)) : [];
  const onlyHere = inSet.filter((card) => card.setIds?.length === 1).length;
  const alsoElsewhere = inSet.length - onlyHere;
  const removingCards = deleteCards && onlyHere > 0;

  const close = () => {
    if (deleting) return;
    setDeleteCards(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!set) return;
    setDeleting(true);
    try {
      await onDelete(set, { deleteCards: removingCards });
      setDeleteCards(false);
    } finally {
      setDeleting(false);
    }
  };

  let outcome: string;
  if (inSet.length === 0) outcome = 'This set has no cards.';
  else if (removingCards) {
    outcome = `${plural(onlyHere, 'card')}, with their pictures and recordings, will be gone for good.`;
    if (alsoElsewhere > 0) outcome += ` ${plural(alsoElsewhere, 'card')} in other sets will stay.`;
  } else if (onlyHere > 0) outcome = 'Its cards stay in your library, under “No set”.';
  else outcome = 'Its cards stay in their other sets.';

  return (
    <Dialog open={Boolean(set)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Delete &ldquo;{set?.name}&rdquo;?</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {onlyHere > 0 && (
            <FormControlLabel
              control={<Checkbox checked={deleteCards} onChange={(event) => setDeleteCards(event.target.checked)} />}
              label={
                onlyHere === inSet.length
                  ? `Also delete its ${plural(onlyHere, 'card')}`
                  : `Also delete the ${plural(onlyHere, 'card')} that ${onlyHere === 1 ? 'is' : 'are'} only in this set`
              }
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {outcome}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
          {removingCards ? 'Delete set and cards' : 'Delete set'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
