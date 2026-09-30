import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckIcon from '@mui/icons-material/Check';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { prepareAvatarImage } from '../flashcards/fileUtils';
import { newId } from '../flashcards/ids';
import { AGE_PRESETS, AVATAR_GROUPS, defaultPracticeSettings } from '../flashcards/practice';
import { ChildProfile, FlashcardSet, PracticeSettings, PromptMode } from '../flashcards/types';
import { ChildAvatar } from './ChildAvatar';

type ChildDialogProps = {
  open: boolean;
  /** The child to edit, or null to add a new one. */
  profile: ChildProfile | null;
  defaultAvatar: string;
  sets: FlashcardSet[];
  onClose: () => void;
  onSave: (profile: ChildProfile) => Promise<void>;
  onRemove: (profile: ChildProfile) => Promise<void>;
};

const promptModeHelp: Record<PromptMode, string> = {
  'find-picture': 'Hear or see a word, then tap its picture. Great for ages 2–4.',
  'name-picture': 'See a picture, then tap its word. For kids who are starting to read.',
  mix: 'Switches between both kinds of question.',
};

export function ChildDialog({ open, profile, defaultAvatar, sets, onClose, onSave, onRemove }: ChildDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const canTakePhoto = useMediaQuery('(pointer: coarse)');
  // One id per dialog, so retrying after a failed save can't create a second child.
  const [id] = useState(() => profile?.id ?? newId());
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? defaultAvatar);
  const [avatarImage, setAvatarImage] = useState<string | null>(profile?.avatarImage ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PracticeSettings>(profile?.settings ?? defaultPracticeSettings());
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateSettings = (changes: Partial<PracticeSettings>) => setSettings((current) => ({ ...current, ...changes }));
  const presetId =
    AGE_PRESETS.find(
      (preset) =>
        preset.settings.choiceCount === settings.choiceCount &&
        preset.settings.promptMode === settings.promptMode &&
        preset.settings.roundSize === settings.roundSize,
    )?.id ?? null;

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Only pictures can be used as an avatar.');
      return;
    }
    try {
      setAvatarImage(await prepareAvatarImage(file));
      setPhotoError(null);
    } catch (error) {
      console.error('Unable to use that picture', error);
      setPhotoError("Couldn't use that picture. Try another one.");
    }
  };

  const toggleSet = (setId: string) => {
    const current = settings.setIds ?? [];
    const next = current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId];
    // Nothing picked means practice everything.
    updateSettings({ setIds: next.length > 0 ? next : null });
  };

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setSaveError(null);
    try {
      await action();
    } catch (error) {
      console.error('Unable to save child', error);
      setSaveError('Something went wrong saving this. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    void run(() =>
      onSave({
        id,
        name: trimmed,
        avatar,
        avatarImage: avatarImage ?? undefined,
        createdAt: profile?.createdAt ?? Date.now(),
        settings,
      }),
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{profile ? `${profile.name}'s practice` : 'Add a child'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <TextField
            label="Name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(false);
            }}
            error={nameError}
            helperText={nameError ? "Add a name so they know it's their turn." : undefined}
            autoFocus={!profile}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 24 } }}
          />

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ChildAvatar profile={{ avatar, avatarImage: avatarImage ?? undefined }} size={64} />
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Avatar</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {canTakePhoto && (
                    <Button size="small" variant="outlined" component="label" startIcon={<PhotoCameraIcon />}>
                      Take photo
                      <input hidden type="file" accept="image/*" capture onChange={handlePhoto} />
                    </Button>
                  )}
                  <Button size="small" variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />}>
                    {avatarImage ? 'Change photo' : 'Use a photo'}
                    <input hidden type="file" accept="image/*" onChange={handlePhoto} />
                  </Button>
                  {avatarImage && (
                    <Button size="small" color="error" onClick={() => setAvatarImage(null)}>
                      Remove photo
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Use any picture from your device, like a favorite character or your child&apos;s own face. It stays on
              this device. Or pick one below.
            </Typography>
            {photoError && <Alert severity="error">{photoError}</Alert>}
            {AVATAR_GROUPS.map((group) => (
              <Stack key={group.label} spacing={0.75}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {group.label}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 1 }}>
                  {group.avatars.map((option) => {
                    const selected = !avatarImage && option.emoji === avatar;
                    return (
                      <ButtonBase
                        key={option.emoji}
                        focusRipple
                        aria-label={option.label}
                        aria-pressed={selected}
                        onClick={() => {
                          setAvatar(option.emoji);
                          setAvatarImage(null);
                        }}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          fontSize: 26,
                          bgcolor: option.color,
                          outline: selected ? '3px solid' : 'none',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        }}
                      >
                        {option.emoji}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Stack>
            ))}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Quick setup by age</Typography>
            <ToggleButtonGroup
              exclusive
              value={presetId}
              onChange={(_, value: string | null) => {
                const preset = AGE_PRESETS.find((option) => option.id === value);
                if (preset) updateSettings(preset.settings);
              }}
              aria-label="Quick setup by age"
            >
              {AGE_PRESETS.map((preset) => (
                <ToggleButton key={preset.id} value={preset.id} sx={{ px: 2.5 }}>
                  {preset.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              Sets the options below. You can still change them.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Questions</Typography>
            <ToggleButtonGroup
              exclusive
              value={settings.promptMode}
              onChange={(_, value: PromptMode | null) => value && updateSettings({ promptMode: value })}
              aria-label="Question type"
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value="find-picture">Find the picture</ToggleButton>
              <ToggleButton value="name-picture">Name the picture</ToggleButton>
              <ToggleButton value="mix">Mix</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              {promptModeHelp[settings.promptMode]}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Answers to choose from</Typography>
              <ToggleButtonGroup
                exclusive
                value={settings.choiceCount}
                onChange={(_, value: number | null) => value && updateSettings({ choiceCount: value })}
                aria-label="Answers to choose from"
              >
                {[2, 3, 4].map((count) => (
                  <ToggleButton key={count} value={count} sx={{ px: 2.5 }}>
                    {count}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Cards per round</Typography>
              <ToggleButtonGroup
                exclusive
                value={settings.roundSize}
                onChange={(_, value: number | null) => value && updateSettings({ roundSize: value })}
                aria-label="Cards per round"
              >
                {[5, 10, 20].map((size) => (
                  <ToggleButton key={size} value={size} sx={{ px: 2.5 }}>
                    {size}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Sets to practice</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip
                label="All sets"
                icon={settings.setIds === null ? <CheckIcon /> : undefined}
                color={settings.setIds === null ? 'primary' : 'default'}
                variant={settings.setIds === null ? 'filled' : 'outlined'}
                onClick={() => updateSettings({ setIds: null })}
              />
              {sets.map((set) => {
                const selected = settings.setIds?.includes(set.id) ?? false;
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
          </Stack>

          <Stack>
            <FormControlLabel
              control={
                <Switch checked={settings.readAloud} onChange={(event) => updateSettings({ readAloud: event.target.checked })} />
              }
              label="Say words out loud (uses your recording when a card has one)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEffects}
                  onChange={(event) => updateSettings({ soundEffects: event.target.checked })}
                />
              }
              label="Sound effects"
            />
          </Stack>

          {saveError && <Alert severity="error">{saveError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {profile && (
          <Button color="error" onClick={() => void run(() => onRemove(profile))} disabled={saving} sx={{ mr: 'auto' }}>
            Remove
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {profile ? 'Save' : 'Add child'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
