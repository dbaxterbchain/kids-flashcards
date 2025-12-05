import { FormEvent, RefObject } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MAX_AUDIO_SECONDS, FlashcardSet } from '../flashcards/types';

type CardFormProps = {
  formRef: RefObject<HTMLFormElement>;
  name: string;
  onNameChange: (value: string) => void;
  imageData: string | null;
  uploadError: string | null;
  editingId: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onImageFileChange: (files: FileList | null) => void;
  sets: FlashcardSet[];
  selectedSetIds: string[];
  onToggleSet: (setId: string) => void;
  newSetName: string;
  onSetNameChange: (value: string) => void;
  onAddSet: () => void;
  audioDataUrl: string | null;
  recordingError: string | null;
  recordingSeconds: number;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioFileChange: (files: FileList | null) => void;
  onClearAudio: () => void;
  open: boolean;
  onClose: () => void;
  backgroundColor: string;
  onBackgroundColorChange: (value: string) => void;
};

export function CardForm({
  formRef,
  name,
  onNameChange,
  imageData,
  uploadError,
  editingId,
  onSubmit,
  onCancelEdit,
  onImageFileChange,
  sets,
  selectedSetIds,
  onToggleSet,
  newSetName,
  onSetNameChange,
  onAddSet,
  audioDataUrl,
  recordingError,
  recordingSeconds,
  isRecording,
  onStartRecording,
  onStopRecording,
  onAudioFileChange,
  onClearAudio,
  open,
  onClose,
  backgroundColor,
  onBackgroundColorChange,
}: CardFormProps) {
  const title = editingId ? 'Edit your flashcard' : 'Add a new flashcard';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form ref={formRef} onSubmit={onSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Card name"
              name="name"
              placeholder="e.g. Spaceship"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
              fullWidth
            />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Picture</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload image
                  <input
                    type="file"
                    hidden
                    name="image"
                    accept="image/*"
                    onChange={(event) => onImageFileChange(event.target.files)}
                  />
                </Button>
                {imageData && (
                  <Typography variant="body2" color="text.secondary">
                    Image selected
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Background color (optional)</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <Box
                  component="input"
                  type="color"
                  aria-label="Pick a background color"
                  value={backgroundColor || '#ffffff'}
                  onChange={(event) => onBackgroundColorChange(event.target.value)}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 0,
                  }}
                />
                <TextField
                  label="Hex code"
                  placeholder="#f97316"
                  value={backgroundColor}
                  onChange={(event) => onBackgroundColorChange(event.target.value)}
                  fullWidth
                />
                <Button type="button" variant="text" onClick={() => onBackgroundColorChange('')}>
                  Clear
                </Button>
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">Sets</Typography>
                <Typography variant="body2" color="text.secondary">
                  Group cards to show or hide together.
                </Typography>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {sets.map((set) => {
                  const selected = selectedSetIds.includes(set.id);
                  return (
                    <Chip
                      key={set.id}
                      label={set.name}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      onClick={() => onToggleSet(set.id)}
                    />
                  );
                })}
              </Stack>
              {sets.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No sets yet. Add one below.
                </Typography>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  label="New set name"
                  placeholder="e.g. Animals"
                  value={newSetName}
                  onChange={(event) => onSetNameChange(event.target.value)}
                  fullWidth
                />
                <Button type="button" variant="outlined" onClick={onAddSet}>
                  Add set
                </Button>
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="subtitle2">Optional audio (plays on flip)</Typography>
                <Typography variant="body2" color="text.secondary">
                  Up to {MAX_AUDIO_SECONDS} seconds.
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button
                  type="button"
                  variant={isRecording ? 'contained' : 'outlined'}
                  color={isRecording ? 'error' : 'primary'}
                  onClick={isRecording ? onStopRecording : onStartRecording}
                >
                  {isRecording
                    ? `Stop recording (${recordingSeconds}s / ${MAX_AUDIO_SECONDS}s)`
                    : 'Record audio'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {recordingSeconds}s / {MAX_AUDIO_SECONDS}s
                </Typography>
              </Stack>

              <Button variant="outlined" component="label">
                Upload audio (optional)
                <input
                  type="file"
                  hidden
                  name="audio"
                  accept="audio/*"
                  onChange={(event) => onAudioFileChange(event.target.files)}
                />
              </Button>

              {audioDataUrl && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <audio controls src={audioDataUrl} />
                  <Button type="button" variant="text" onClick={onClearAudio}>
                    Remove audio
                  </Button>
                </Stack>
              )}
              {recordingError && <Alert severity="error">{recordingError}</Alert>}
            </Stack>

            {(imageData || backgroundColor) && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">Preview</Typography>
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    width: 200,
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: backgroundColor || 'transparent',
                  }}
                >
                  {imageData ? (
                    <Box
                      component="img"
                      src={imageData}
                      alt="Uploaded preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '40%',
                        height: '40%',
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'text.secondary',
                      }}
                      aria-label="Background color preview"
                    />
                  )}
                </Box>
              </Stack>
            )}

            {uploadError && <Alert severity="error">{uploadError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {editingId ? 'Editing existing card' : 'Creating a brand new card'}
          </Typography>
          {editingId && (
            <Button type="button" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" variant="contained">
            {editingId ? 'Save changes' : 'Add card'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
