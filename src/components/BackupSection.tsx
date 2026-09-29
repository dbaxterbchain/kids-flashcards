import RestoreIcon from '@mui/icons-material/Restore';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import {
  Alert,
  AlertColor,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { Backup, BackupError, parseBackup, SaveResult } from '../flashcards/backup';

type BackupSectionProps = {
  lastBackupAt: number | null;
  onSave: () => Promise<SaveResult>;
  /** Replaces everything with the backup; the app reloads afterwards. */
  onRestore: (backup: Backup) => Promise<void>;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const formatDate = (value: string | number) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'an unknown date' : date.toLocaleDateString(undefined, { dateStyle: 'long' });
};

export function BackupSection({ lastBackupAt, onSave, onRestore }: BackupSectionProps) {
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ severity: AlertColor; text: string } | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await onSave();
      if (result === 'shared') setMessage({ severity: 'success', text: 'Backup shared. Keep it somewhere safe.' });
      if (result === 'downloaded') setMessage({ severity: 'success', text: 'Backup saved to your downloads. Keep it somewhere safe.' });
    } catch (error) {
      console.error('Unable to make a backup', error);
      setMessage({ severity: 'error', text: 'Unable to make a backup right now.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      setPending(parseBackup(await file.text()));
    } catch (error) {
      setMessage({
        severity: 'error',
        text: error instanceof BackupError ? error.message : "Couldn't read that file.",
      });
    }
  };

  const handleRestore = async () => {
    if (!pending) return;
    setRestoring(true);
    try {
      await onRestore(pending);
    } catch (error) {
      console.error('Unable to restore backup', error);
      setMessage({ severity: 'error', text: 'Unable to restore that backup. Please try again.' });
      setPending(null);
      setRestoring(false);
    }
  };

  const children = pending?.profiles.map((profile) => profile.name) ?? [];

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Backup</Typography>
      <Typography variant="body2" color="text.secondary">
        Everything is saved only on this device. Save a backup file (cards, pictures, recordings, children and their
        progress) and keep it somewhere safe, like your cloud drive or email.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Last backup: {lastBackupAt ? formatDate(lastBackupAt) : 'never'}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Button variant="contained" startIcon={<SaveAltIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save a backup'}
        </Button>
        <Button variant="outlined" component="label" startIcon={<RestoreIcon />}>
          Restore from a backup
          <input hidden type="file" accept="application/json,.json" onChange={handleFile} />
        </Button>
      </Stack>
      {message && (
        <Alert severity={message.severity} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Dialog open={Boolean(pending)} onClose={() => !restoring && setPending(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Restore this backup?</DialogTitle>
        <DialogContent>
          {pending && (
            <Stack spacing={1.5}>
              <Typography>Saved on {formatDate(pending.exportedAt)}, with:</Typography>
              <Typography component="ul" sx={{ m: 0, pl: 3 }}>
                <li>
                  {plural(pending.cards.length, 'card')} in {plural(pending.sets.length, 'set')}
                </li>
                <li>
                  {children.length === 0
                    ? 'No children'
                    : `${children.length} ${children.length === 1 ? 'child' : 'children'}: ${children.join(', ')}`}
                </li>
              </Typography>
              <Alert severity="warning">
                This replaces everything on this device, including anything added since this backup was made.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPending(null)} disabled={restoring}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleRestore} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Replace and restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
