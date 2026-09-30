import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsightsIcon from '@mui/icons-material/Insights';
import IosShareIcon from '@mui/icons-material/IosShare';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Alert,
  AlertColor,
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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Backup, BackupError, SaveResult } from '../flashcards/backup';
import { LibrarySet } from '../flashcards/library';
import { PROMPT_MODE_LABELS } from '../flashcards/practice';
import { parseSetPackage, SetPackage } from '../flashcards/setPackage';
import { ChildProfile, FlashcardData, FlashcardSet, UNCATEGORIZED_SET_ID } from '../flashcards/types';
import { RemoveSetOptions } from '../hooks/useCardLibrary';
import { BackupSection } from './BackupSection';
import { ChildAvatar } from './ChildAvatar';
import { ChildProgressDialog } from './ChildProgressDialog';
import { DeleteSetDialog } from './DeleteSetDialog';
import { FlashcardGrid } from './FlashcardGrid';
import { SetImportDialog } from './SetImportDialog';
import { SetLibraryDialog } from './SetLibraryDialog';

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
  onDeleteSet: (set: FlashcardSet, options: RemoveSetOptions) => Promise<void>;
  onToggleSetHidden: (setId: string) => void;
  /** Saves or shares a file with the set's cards, pictures and recordings. */
  onShareSet: (set: FlashcardSet) => Promise<SaveResult>;
  /** Adds a shared set as a new set. */
  onImportSet: (pkg: SetPackage) => Promise<FlashcardSet>;
  onAddLibrarySet: (entry: LibrarySet) => Promise<void>;
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

type SetsMessage = { severity: AlertColor; text: string };

function SetsTab({
  cards,
  sets,
  hiddenSetIds,
  onCreateSet,
  onRenameSet,
  onDeleteSet,
  onToggleSetHidden,
  onShareSet,
  onImportSet,
  onAddLibrarySet,
}: ManageViewProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<FlashcardSet | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; set: FlashcardSet } | null>(null);
  const [deleting, setDeleting] = useState<FlashcardSet | null>(null);
  const [importing, setImporting] = useState<SetPackage | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [message, setMessage] = useState<SetsMessage | null>(null);
  const rows = [...sets, ...(cards.some(hasNoSet) ? [{ id: UNCATEGORIZED_SET_ID, name: 'No set' }] : [])];
  const countFor = (setId: string) =>
    setId === UNCATEGORIZED_SET_ID ? cards.filter(hasNoSet).length : cards.filter((card) => card.setIds?.includes(setId)).length;

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;
    try {
      await onCreateSet(newName);
      setNewName('');
    } catch (addError) {
      console.error(addError);
      setMessage({ severity: 'error', text: 'Unable to add that set right now.' });
    }
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renaming || !renameValue.trim()) return;
    try {
      await onRenameSet(renaming.id, renameValue);
      setRenaming(null);
    } catch (renameError) {
      console.error(renameError);
      setMessage({ severity: 'error', text: 'Unable to rename that set right now.' });
    }
  };

  const handleDelete = async (set: FlashcardSet, options: RemoveSetOptions) => {
    try {
      await onDeleteSet(set, options);
      setDeleting(null);
    } catch (deleteError) {
      console.error(deleteError);
      setDeleting(null);
      setMessage({ severity: 'error', text: 'Unable to delete that set right now.' });
    }
  };

  const handleShare = async (set: FlashcardSet) => {
    setSharingId(set.id);
    try {
      const result = await onShareSet(set);
      if (result === 'shared') {
        setMessage({ severity: 'success', text: `Shared “${set.name}”. Others can add it with Import a set.` });
      }
      if (result === 'downloaded') {
        setMessage({
          severity: 'success',
          text: `Saved “${set.name}” to your downloads. Send the file to anyone, and they can add it with Import a set.`,
        });
      }
    } catch (shareError) {
      console.error('Unable to share the set', shareError);
      setMessage({ severity: 'error', text: 'Unable to share that set right now.' });
    } finally {
      setSharingId(null);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setImporting(parseSetPackage(await file.text()));
    } catch (readError) {
      setMessage({
        severity: 'error',
        text: readError instanceof BackupError ? readError.message : "Couldn't read that file.",
      });
    }
  };

  const handleImport = async (pkg: SetPackage) => {
    const set = await onImportSet(pkg);
    setImporting(null);
    setMessage({ severity: 'success', text: `Added “${set.name}” with ${plural(pkg.cards.length, 'card')}.` });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        <Button variant="contained" startIcon={<LibraryBooksIcon />} onClick={() => setLibraryOpen(true)}>
          Set library
        </Button>
        <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
          Import a set
          <input hidden type="file" accept="application/json,.json" onChange={handleImportFile} />
        </Button>
      </Stack>
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
      <Typography variant="body2" color="text.secondary">
        Switch a set off to hide it from kids. Its cards stay here.
      </Typography>
      <List disablePadding sx={listSx}>
        {rows.map((set, index) => {
          const shown = !hiddenSetIds.includes(set.id);
          const editable = set.id !== UNCATEGORIZED_SET_ID;
          const count = countFor(set.id);
          return (
            <ListItem
              key={set.id}
              divider={index < rows.length - 1}
              sx={{ pr: editable ? 12 : 2 }}
              secondaryAction={
                editable && (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label={`Share ${set.name}`}
                      disabled={count === 0 || sharingId !== null}
                      onClick={() => void handleShare(set)}
                    >
                      <IosShareIcon />
                    </IconButton>
                    <IconButton
                      aria-label={`More for ${set.name}`}
                      aria-haspopup="menu"
                      onClick={(event) => setMenu({ anchor: event.currentTarget, set })}
                    >
                      <MoreVertIcon />
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
                secondary={`${plural(count, 'card')} · ${shown ? 'Shown to kids' : 'Hidden from kids'}`}
              />
            </ListItem>
          );
        })}
      </List>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (!menu) return;
            setRenaming(menu.set);
            setRenameValue(menu.set.name);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            if (!menu) return;
            setDeleting(menu.set);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

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

      <DeleteSetDialog set={deleting} cards={cards} onClose={() => setDeleting(null)} onDelete={handleDelete} />
      <SetImportDialog pkg={importing} sets={sets} onClose={() => setImporting(null)} onImport={handleImport} />
      <SetLibraryDialog open={libraryOpen} sets={sets} onClose={() => setLibraryOpen(false)} onAdd={onAddLibrarySet} />

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={message?.severity === 'error' ? null : 8000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setMessage(null);
        }}
      >
        {/* Keeps the last message while the snackbar fades out. */}
        <Alert severity={message?.severity ?? 'success'} variant="filled" onClose={() => setMessage(null)} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function ChildrenTab({ cards, profiles, sets, hiddenSetIds, onAddChild, onEditChild }: ManageViewProps) {
  const [showingProgress, setShowingProgress] = useState<ChildProfile | null>(null);
  const allSets = [...sets, ...(cards.some(hasNoSet) ? [{ id: UNCATEGORIZED_SET_ID, name: 'No set' }] : [])];
  // "All sets" means the sets kids can see, as in practice.
  const practicedSets = (profile: ChildProfile) => {
    const chosen = profile.settings.setIds;
    return chosen === null
      ? allSets.filter((set) => !hiddenSetIds.includes(set.id))
      : allSets.filter((set) => chosen.includes(set.id));
  };
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
            <ListItem key={profile.id} divider={index < profiles.length - 1} alignItems="flex-start">
              <ListItemAvatar>
                <ChildAvatar profile={profile} size={40} />
              </ListItemAvatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <ListItemText
                  sx={{ mt: 0.5 }}
                  primary={profile.name}
                  secondary={`${PROMPT_MODE_LABELS[profile.settings.promptMode]} · ${profile.settings.choiceCount} choices · ${plural(
                    profile.settings.roundSize,
                    'card',
                  )} a round · ${setSummary(profile.settings.setIds)}`}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<InsightsIcon />}
                    onClick={() => setShowingProgress(profile)}
                    aria-label={`${profile.name}'s progress`}
                  >
                    Progress
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEditChild(profile)}
                    aria-label={`${profile.name}'s settings`}
                  >
                    Settings
                  </Button>
                </Stack>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      <ChildProgressDialog
        profile={showingProgress}
        cards={cards}
        sets={showingProgress ? practicedSets(showingProgress) : []}
        onClose={() => setShowingProgress(null)}
      />
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
