import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import { Backup, SaveResult } from '../flashcards/backup';
import { avatarColor, PROMPT_MODE_LABELS } from '../flashcards/practice';
import { ChildProfile, FlashcardData, FlashcardSet, UNCATEGORIZED_SET_ID } from '../flashcards/types';
import { BackupSection } from './BackupSection';
import { FlashcardGrid } from './FlashcardGrid';

type ManageTab = 'cards' | 'sets' | 'children' | 'settings';

type ManageViewProps = {
  /** Every card, newest first. */
  cards: FlashcardData[];
  sets: FlashcardSet[];
  hiddenSetIds: string[];
  profiles: ChildProfile[];
  speakOnFlip: boolean;
  missingStarterCount: number;
  onDone: () => void;
  onNewCard: (setId?: string) => void;
  onEditCard: (card: FlashcardData) => void;
  onDeleteCard: (card: FlashcardData) => void;
  onCreateSet: (name: string) => Promise<unknown>;
  onRenameSet: (id: string, name: string) => Promise<void>;
  onDeleteSet: (set: FlashcardSet) => Promise<void>;
  onToggleSetHidden: (setId: string) => void;
  onAddChild: () => void;
  onEditChild: (profile: ChildProfile) => void;
  onSpeakOnFlipChange: (value: boolean) => void;
  onRestoreStarters: () => Promise<void>;
  lastBackupAt: number | null;
  /** True when there's something worth backing up and no recent backup. */
  showBackupReminder: boolean;
  onSaveBackup: () => Promise<SaveResult>;
  onRestoreBackup: (backup: Backup) => Promise<void>;
};

const emptySx = {
  p: 3,
  borderRadius: 2,
  border: '1px dashed',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  textAlign: 'center',
} as const;

const listSx = { bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' } as const;

const hasNoSet = (card: FlashcardData) => !card.setIds || card.setIds.length === 0;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The parent-only area for changing cards, sets, children and settings. */
export function ManageView(props: ManageViewProps) {
  const [tab, setTab] = useState<ManageTab>('cards');
  const [savingBackup, setSavingBackup] = useState(false);
  const tabs: { value: ManageTab; label: string }[] = [
    { value: 'cards', label: 'Cards' },
    { value: 'sets', label: 'Sets' },
    { value: 'children', label: 'Children' },
    { value: 'settings', label: 'Settings' },
  ];

  return (
    <Box component="section" aria-labelledby="manage-heading">
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 3, bgcolor: '#0f172a', color: '#f8fafc' }}
      >
        <LockOpenIcon />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography id="manage-heading" variant="h6" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Grown-ups
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Add and change cards, sets and children.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={props.onDone}
          sx={{ flexShrink: 0, bgcolor: '#f8fafc', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0' } }}
        >
          Done
        </Button>
      </Stack>

      {props.showBackupReminder && (
        <Alert
          severity="info"
          sx={{ mb: 2, alignItems: 'center' }}
          action={
            <Button
              color="inherit"
              size="small"
              disabled={savingBackup}
              onClick={async () => {
                setSavingBackup(true);
                try {
                  await props.onSaveBackup();
                } catch (error) {
                  console.error('Unable to make a backup', error);
                } finally {
                  setSavingBackup(false);
                }
              }}
            >
              Save a backup
            </Button>
          }
        >
          Your cards and recordings are only on this device. Save a backup so you don&apos;t lose them.
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, value: ManageTab) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Grown-up tools"
        sx={{ mb: 2 }}
      >
        {tabs.map((option) => (
          <Tab
            key={option.value}
            value={option.value}
            label={option.label}
            id={`manage-tab-${option.value}`}
            aria-controls={`manage-panel-${option.value}`}
          />
        ))}
      </Tabs>

      <Box role="tabpanel" id={`manage-panel-${tab}`} aria-labelledby={`manage-tab-${tab}`}>
        {tab === 'cards' && <CardsTab {...props} />}
        {tab === 'sets' && <SetsTab {...props} />}
        {tab === 'children' && <ChildrenTab {...props} />}
        {tab === 'settings' && <SettingsTab {...props} />}
      </Box>
    </Box>
  );
}

function CardsTab({
  cards,
  sets,
  speakOnFlip,
  missingStarterCount,
  onNewCard,
  onEditCard,
  onDeleteCard,
  onRestoreStarters,
}: ManageViewProps) {
  const [filter, setFilter] = useState('all');
  const options = [
    { id: 'all', name: 'All', count: cards.length },
    ...sets.map((set) => ({ id: set.id, name: set.name, count: cards.filter((card) => card.setIds?.includes(set.id)).length })),
    ...(cards.some(hasNoSet)
      ? [{ id: UNCATEGORIZED_SET_ID, name: 'No set', count: cards.filter(hasNoSet).length }]
      : []),
  ];
  // Fall back to everything if the set being shown was deleted.
  const active = options.some((option) => option.id === filter) ? filter : 'all';
  const shown =
    active === 'all'
      ? cards
      : active === UNCATEGORIZED_SET_ID
        ? cards.filter(hasNoSet)
        : cards.filter((card) => card.setIds?.includes(active));
  const newCardSetId = active !== 'all' && active !== UNCATEGORIZED_SET_ID ? active : undefined;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Use the pencil to edit a card.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => onNewCard(newCardSetId)} sx={{ flexShrink: 0 }}>
          New card
        </Button>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={1} role="group" aria-label="Show cards from">
        {options.map((option) => {
          const selected = option.id === active;
          return (
            <Chip
              key={option.id}
              label={`${option.name} (${option.count})`}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              aria-pressed={selected}
              onClick={() => setFilter(option.id)}
            />
          );
        })}
      </Stack>

      {shown.length === 0 ? (
        <Stack spacing={2} alignItems="center" sx={emptySx}>
          <Typography>No cards here yet.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => onNewCard(newCardSetId)}>
              New card
            </Button>
            {cards.length === 0 && missingStarterCount > 0 && (
              <Button variant="outlined" onClick={() => void onRestoreStarters()}>
                Bring back starter cards
              </Button>
            )}
          </Stack>
        </Stack>
      ) : (
        <FlashcardGrid cards={shown} showActions speakOnFlip={speakOnFlip} onEdit={onEditCard} onDelete={onDeleteCard} />
      )}
    </Stack>
  );
}

function SetsTab({ cards, sets, hiddenSetIds, onCreateSet, onRenameSet, onDeleteSet, onToggleSetHidden }: ManageViewProps) {
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<FlashcardSet | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rows = [...sets, ...(cards.some(hasNoSet) ? [{ id: UNCATEGORIZED_SET_ID, name: 'No set' }] : [])];
  const countFor = (setId: string) =>
    setId === UNCATEGORIZED_SET_ID ? cards.filter(hasNoSet).length : cards.filter((card) => card.setIds?.includes(setId)).length;

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;
    try {
      await onCreateSet(newName);
      setNewName('');
      setError(null);
    } catch (addError) {
      console.error(addError);
      setError('Unable to add that set right now.');
    }
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renaming || !renameValue.trim()) return;
    try {
      await onRenameSet(renaming.id, renameValue);
      setRenaming(null);
      setError(null);
    } catch (renameError) {
      console.error(renameError);
      setError('Unable to rename that set right now.');
    }
  };

  const handleDelete = async (set: FlashcardSet) => {
    try {
      await onDeleteSet(set);
      setError(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError('Unable to delete that set right now.');
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Switch a set off to hide it from kids. Its cards stay here.
      </Typography>
      <Stack component="form" onSubmit={handleAdd} direction="row" spacing={1} alignItems="flex-start">
        <TextField
          size="small"
          label="New set"
          placeholder="e.g. Family"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 30 } }}
        />
        <Button type="submit" variant="outlined" disabled={!newName.trim()}>
          Add set
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <List disablePadding sx={listSx}>
        {rows.map((set, index) => {
          const shown = !hiddenSetIds.includes(set.id);
          const editable = set.id !== UNCATEGORIZED_SET_ID;
          return (
            <ListItem
              key={set.id}
              divider={index < rows.length - 1}
              sx={{ pr: editable ? 13 : 2 }}
              secondaryAction={
                editable && (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label={`Rename ${set.name}`}
                      onClick={() => {
                        setRenaming(set);
                        setRenameValue(set.name);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label={`Delete ${set.name}`} color="error" onClick={() => void handleDelete(set)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                )
              }
            >
              <Switch
                edge="start"
                checked={shown}
                onChange={() => onToggleSetHidden(set.id)}
                slotProps={{ input: { 'aria-label': `Show ${set.name} to kids` } }}
                sx={{ mr: 1.5 }}
              />
              <ListItemText
                primary={set.name}
                secondary={`${plural(countFor(set.id), 'card')} · ${shown ? 'Shown to kids' : 'Hidden from kids'}`}
              />
            </ListItem>
          );
        })}
      </List>

      <Dialog open={Boolean(renaming)} onClose={() => setRenaming(null)} maxWidth="xs" fullWidth>
        <form onSubmit={handleRename}>
          <DialogTitle>Rename set</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Name"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 30 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRenaming(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}

function ChildrenTab({ profiles, sets, onAddChild, onEditChild }: ManageViewProps) {
  const setSummary = (setIds: string[] | null) => {
    if (setIds === null) return 'All sets';
    const names = sets.filter((set) => setIds.includes(set.id)).map((set) => set.name);
    return names.length > 0 ? names.join(', ') : 'No sets';
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Each child has their own practice settings and progress.
        </Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={onAddChild} sx={{ flexShrink: 0 }}>
          Add child
        </Button>
      </Stack>
      {profiles.length === 0 ? (
        <Typography color="text.secondary" sx={emptySx}>
          No children yet.
        </Typography>
      ) : (
        <List disablePadding sx={listSx}>
          {profiles.map((profile, index) => (
            <ListItemButton key={profile.id} divider={index < profiles.length - 1} onClick={() => onEditChild(profile)}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: avatarColor(profile.avatar), fontSize: 24 }}>{profile.avatar}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={profile.name}
                secondary={`${PROMPT_MODE_LABELS[profile.settings.promptMode]} · ${profile.settings.choiceCount} choices · ${plural(
                  profile.settings.roundSize,
                  'card',
                )} a round · ${setSummary(profile.settings.setIds)}`}
              />
              <EditIcon color="action" sx={{ ml: 1 }} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Stack>
  );
}

function SettingsTab({
  speakOnFlip,
  missingStarterCount,
  onSpeakOnFlipChange,
  onRestoreStarters,
  lastBackupAt,
  onSaveBackup,
  onRestoreBackup,
}: ManageViewProps) {
  const [restoring, setRestoring] = useState(false);

  return (
    <Stack spacing={3}>
      <BackupSection lastBackupAt={lastBackupAt} onSave={onSaveBackup} onRestore={onRestoreBackup} />

      <Box>
        <FormControlLabel
          control={<Switch checked={speakOnFlip} onChange={(event) => onSpeakOnFlipChange(event.target.checked)} />}
          label="Say the word when a card is flipped"
        />
        <Typography variant="body2" color="text.secondary">
          Uses your recording when a card has one, and the device&apos;s voice when it doesn&apos;t.
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Starter cards</Typography>
        {missingStarterCount > 0 ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {plural(missingStarterCount, 'starter card')} deleted.
            </Typography>
            <Button
              variant="outlined"
              disabled={restoring}
              onClick={async () => {
                setRestoring(true);
                try {
                  await onRestoreStarters();
                } finally {
                  setRestoring(false);
                }
              }}
            >
              Bring them back
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            All the starter cards are here.
          </Typography>
        )}
      </Stack>

    </Stack>
  );
}
