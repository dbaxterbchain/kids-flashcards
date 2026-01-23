import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Stack,
  Typography,
} from '@mui/material';
import { FlashcardSet } from '../flashcards/types';

type PracticeSetDialogProps = {
  open: boolean;
  sets: FlashcardSet[];
  selectedSetIds: string[];
  onToggleSet: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onConfirm: () => void;
  error?: string | null;
};

export function PracticeSetDialog({
  open,
  sets,
  selectedSetIds,
  onToggleSet,
  onSelectAll,
  onClearAll,
  onClose,
  onConfirm,
  error,
}: PracticeSetDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Choose practice sets</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select the sets you want to practice. You can pick one set or mix several.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onSelectAll}>
              Select all
            </Button>
            <Button variant="text" onClick={onClearAll}>
              Clear all
            </Button>
          </Stack>
          <FormGroup>
            {sets.map((set) => (
              <FormControlLabel
                key={set.id}
                control={
                  <Checkbox
                    checked={selectedSetIds.includes(set.id)}
                    onChange={() => onToggleSet(set.id)}
                  />
                }
                label={set.name}
              />
            ))}
            {sets.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No sets yet.
              </Typography>
            )}
          </FormGroup>
          {error && (
            <Box>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained">
          Start practice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
