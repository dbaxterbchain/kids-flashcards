import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckIcon from '@mui/icons-material/Check';
import ColorizeIcon from '@mui/icons-material/Colorize';
import ImageIcon from '@mui/icons-material/Image';
import MicIcon from '@mui/icons-material/Mic';
import PaletteIcon from '@mui/icons-material/Palette';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { speakCard } from '../audio/sound';
import { fileToDataUrl, prepareCardImage } from '../flashcards/fileUtils';
import { FlashcardData, FlashcardSet, MAX_AUDIO_SECONDS } from '../flashcards/types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { CardFront } from './CardFront';
import './CardEditor.css';

type FrontType = 'picture' | 'color' | 'text';

type CardEditorProps = {
  open: boolean;
  /** The card to edit, or null to make a new one. */
  card: FlashcardData | null;
  sets: FlashcardSet[];
  /** Sets a new card starts in. */
  initialSetIds?: string[];
  onClose: () => void;
  onSave: (card: FlashcardData) => Promise<void>;
  onCreateSet: (name: string) => Promise<FlashcardSet>;
};

const COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#fb923c', label: 'Orange' },
  { value: '#facc15', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#f472b6', label: 'Pink' },
  { value: '#b45309', label: 'Brown' },
  { value: '#111827', label: 'Black' },
  { value: '#f8fafc', label: 'White' },
  { value: '#fecaca', label: 'Light red' },
  { value: '#fed7aa', label: 'Peach' },
  { value: '#fef08a', label: 'Light yellow' },
  { value: '#bbf7d0', label: 'Mint' },
  { value: '#a5f3fc', label: 'Light cyan' },
  { value: '#bfdbfe', label: 'Light blue' },
  { value: '#e9d5ff', label: 'Lavender' },
];

// Longer clips are almost certainly not a single spoken word.
const MAX_AUDIO_FILE_BYTES = 2 * 1024 * 1024;

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const frontTypeOf = (card: FlashcardData | null): FrontType => {
  if (!card) return 'picture';
  if (card.frontText) return 'text';
  return card.imageUrl ? 'picture' : 'color';
};

function ColorSwatches({
  value,
  onChange,
  allowDefault,
}: {
  value: string;
  onChange: (color: string) => void;
  allowDefault: boolean;
}) {
  const current = value.toLowerCase();
  const isCustom = current !== '' && !COLORS.some((color) => color.value === current);
  return (
    <Box className="swatches" role="radiogroup" aria-label="Background color">
      {allowDefault && (
        <ButtonBase
          className={`swatch swatch--default${current === '' ? ' is-selected' : ''}`}
          role="radio"
          aria-checked={current === ''}
          aria-label="Default background"
          onClick={() => onChange('')}
        />
      )}
      {COLORS.map((color) => (
        <ButtonBase
          key={color.value}
          className={`swatch${current === color.value ? ' is-selected' : ''}`}
          style={{ background: color.value }}
          role="radio"
          aria-checked={current === color.value}
          aria-label={color.label}
          onClick={() => onChange(color.value)}
        />
      ))}
      <label className={`swatch swatch--custom${isCustom ? ' is-selected' : ''}`} style={isCustom ? { background: value } : undefined}>
        <ColorizeIcon fontSize="small" />
        <input
          type="color"
          aria-label="Pick any color"
          value={isCustom ? value : '#ffffff'}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </Box>
  );
}

export function CardEditor({ open, card, sets, initialSetIds, onClose, onSave, onCreateSet }: CardEditorProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const canTakePhoto = useMediaQuery('(pointer: coarse)');
  // One id per editor, so retrying after a failed save can't create a second card.
  const [id] = useState(() => card?.id ?? newId());
  const [frontType, setFrontType] = useState<FrontType>(() => frontTypeOf(card));
  const [name, setName] = useState(card?.name ?? '');
  const [imageUrl, setImageUrl] = useState(card?.imageUrl ?? '');
  const [frontText, setFrontText] = useState(card?.frontText ?? '');
  const [backgroundColor, setBackgroundColor] = useState(card?.backgroundColor ?? '');
  // True while the background was picked automatically from the picture, so a new picture can replace it.
  const [backgroundIsAuto, setBackgroundIsAuto] = useState(false);
  const [setIds, setSetIds] = useState<string[]>(card?.setIds ?? initialSetIds ?? []);
  const [newSetName, setNewSetName] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    audioDataUrl,
    setAudioDataUrl,
    recordingError,
    setRecordingError,
    recordingSeconds,
    isRecording,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder(MAX_AUDIO_SECONDS, card?.audioUrl ?? null);

  // Don't keep the microphone on after the editor closes.
  useEffect(() => {
    if (!open) stopRecording({ silent: true });
  }, [open, stopRecording]);

  const draft = {
    name,
    imageUrl: frontType === 'picture' ? imageUrl : '',
    frontText: frontType === 'text' ? frontText : undefined,
    backgroundColor: backgroundColor || undefined,
  };

  const handleImageInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only picture files can be used for the front.');
      return;
    }
    setProcessingImage(true);
    try {
      const prepared = await prepareCardImage(file);
      setImageUrl(prepared.dataUrl);
      // Fill around the picture with its own edge color, unless the parent already picked one.
      if (prepared.edgeColor && (!backgroundColor || backgroundIsAuto)) {
        setBackgroundColor(prepared.edgeColor);
        setBackgroundIsAuto(true);
      }
      setError(null);
    } catch (imageError) {
      console.error(imageError);
      setError('Something went wrong reading that picture.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleAudioInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setRecordingError('Only audio files can be used here.');
      return;
    }
    if (file.size > MAX_AUDIO_FILE_BYTES) {
      setRecordingError(`That clip is too long. Try one under ${MAX_AUDIO_SECONDS} seconds.`);
      return;
    }
    try {
      setAudioDataUrl(await fileToDataUrl(file));
      setRecordingError(null);
    } catch (audioError) {
      console.error(audioError);
      setRecordingError('Unable to read that audio file.');
    }
  };

  const toggleSet = (setId: string) => {
    setSetIds((current) => (current.includes(setId) ? current.filter((existing) => existing !== setId) : [...current, setId]));
  };

  const addSet = async () => {
    if (!newSetName.trim()) return;
    try {
      const set = await onCreateSet(newSetName);
      setSetIds((current) => (current.includes(set.id) ? current : [...current, set.id]));
      setNewSetName('');
    } catch (createError) {
      console.error(createError);
      setError('Unable to add that set right now.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const problem =
      frontType === 'picture' && !imageUrl
        ? 'Add a picture for the front, or switch the front to a color or text.'
        : frontType === 'color' && !backgroundColor
          ? 'Pick a color for the front.'
          : frontType === 'text' && !frontText.trim()
            ? 'Add the text for the front.'
            : !trimmedName
              ? 'Add the word for the back of the card.'
              : isRecording
                ? 'Stop the recording before saving.'
                : null;
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        id,
        name: trimmedName,
        imageUrl: frontType === 'picture' ? imageUrl : '',
        frontText: frontType === 'text' ? frontText.trim() : undefined,
        backgroundColor: backgroundColor || undefined,
        audioUrl: audioDataUrl ?? undefined,
        setIds,
        createdAt: card?.createdAt ?? Date.now(),
        // Kept until it's moved to the first child's progress.
        review: card?.review,
      });
    } catch (saveError) {
      console.error('Unable to save card', saveError);
      setError('Unable to save the card. Storage might be full or blocked.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      {/* noValidate: our own messages explain what's missing better than the browser's bubbles. */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>
        <DialogTitle>{card ? 'Edit card' : 'New card'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} justifyContent="center" aria-hidden>
              <Stack spacing={0.5} alignItems="center">
                <Box className="card-preview">
                  <CardFront card={draft} alt="" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Front
                </Typography>
              </Stack>
              <Stack spacing={0.5} alignItems="center">
                <Box className={`card-preview card-preview--back${name.trim() ? '' : ' is-empty'}`}>
                  {name.trim() || 'Word'}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Back
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Front of the card</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={frontType}
                onChange={(_, value: FrontType | null) => value && setFrontType(value)}
                aria-label="Front of the card"
              >
                <ToggleButton value="picture">
                  <ImageIcon fontSize="small" sx={{ mr: 1 }} />
                  Picture
                </ToggleButton>
                <ToggleButton value="color">
                  <PaletteIcon fontSize="small" sx={{ mr: 1 }} />
                  Color
                </ToggleButton>
                <ToggleButton value="text">
                  <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} />
                  Text
                </ToggleButton>
              </ToggleButtonGroup>

              {frontType === 'picture' && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  {canTakePhoto && (
                    <Button variant="contained" component="label" startIcon={<PhotoCameraIcon />}>
                      Take photo
                      <input hidden type="file" accept="image/*" capture="environment" onChange={handleImageInput} />
                    </Button>
                  )}
                  <Button variant={canTakePhoto ? 'outlined' : 'contained'} component="label" startIcon={<AddPhotoAlternateIcon />}>
                    {imageUrl ? 'Change picture' : 'Choose picture'}
                    <input hidden type="file" accept="image/*" onChange={handleImageInput} />
                  </Button>
                  {imageUrl && (
                    <Button
                      color="error"
                      onClick={() => {
                        setImageUrl('');
                        if (backgroundIsAuto) {
                          setBackgroundColor('');
                          setBackgroundIsAuto(false);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  {processingImage && <CircularProgress size={22} aria-label="Getting the picture ready" />}
                </Stack>
              )}

              {frontType === 'text' && (
                <TextField
                  label="Text on the front"
                  placeholder="e.g. 2 + 3, A, or a word to read"
                  value={frontText}
                  onChange={(event) => setFrontText(event.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                />
              )}

              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {frontType === 'color' ? 'Color' : 'Background (optional)'}
                </Typography>
                <ColorSwatches
                  value={backgroundColor}
                  onChange={(color) => {
                    setBackgroundColor(color);
                    setBackgroundIsAuto(false);
                  }}
                  allowDefault={frontType !== 'color'}
                />
              </Stack>
            </Stack>

            <TextField
              label="Word on the back"
              placeholder={frontType === 'text' ? 'e.g. 5' : 'e.g. Grandma'}
              value={name}
              onChange={(event) => setName(event.target.value)}
              helperText="Kids see this when the card flips over, and hear it read aloud."
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 40 } }}
            />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Your voice (optional)</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                {isRecording ? (
                  <>
                    <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={() => stopRecording()}>
                      Stop
                    </Button>
                    <span className="recording-dot" aria-hidden />
                    <Typography variant="body2" role="status">
                      Recording… {Math.max(0, MAX_AUDIO_SECONDS - recordingSeconds)}s left
                    </Typography>
                  </>
                ) : audioDataUrl ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => speakCard({ name: name || 'word', audioUrl: audioDataUrl })}
                    >
                      Play
                    </Button>
                    <Button startIcon={<MicIcon />} onClick={startRecording}>
                      Record again
                    </Button>
                    <Button color="error" onClick={resetRecording}>
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outlined" startIcon={<MicIcon />} onClick={startRecording}>
                      Record the word
                    </Button>
                    <Button component="label" startIcon={<UploadFileIcon />}>
                      Upload
                      <input hidden type="file" accept="audio/*" onChange={handleAudioInput} />
                    </Button>
                  </>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Played when the card flips and during practice. Up to {MAX_AUDIO_SECONDS} seconds. Without a recording,
                the device reads the word aloud.
              </Typography>
              {recordingError && <Alert severity="error">{recordingError}</Alert>}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Sets</Typography>
              {sets.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {sets.map((set) => {
                    const selected = setIds.includes(set.id);
                    return (
                      <Chip
                        key={set.id}
                        label={set.name}
                        icon={selected ? <CheckIcon /> : undefined}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={() => toggleSet(set.id)}
                      />
                    );
                  })}
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  size="small"
                  label="New set"
                  placeholder="e.g. Family"
                  value={newSetName}
                  onChange={(event) => setNewSetName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void addSet();
                    }
                  }}
                  slotProps={{ htmlInput: { maxLength: 30 } }}
                />
                <Button onClick={() => void addSet()} disabled={!newSetName.trim()}>
                  Add set
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        {error && (
          <Box sx={{ px: 3, pt: 1.5 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || processingImage}>
            {card ? 'Save' : 'Add card'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
