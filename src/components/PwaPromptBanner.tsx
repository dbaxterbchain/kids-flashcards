import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SignalWifiBadIcon from '@mui/icons-material/SignalWifiBad';
import { Alert, Button, Snackbar, Stack } from '@mui/material';

type Props = {
  canInstall: boolean;
  onInstall: () => Promise<void>;
  updateAvailable: boolean;
  onUpdate: () => void;
  offlineReady: boolean;
  onDismissOfflineReady: () => void;
  isOffline: boolean;
};

export function PwaPromptBanner({
  canInstall,
  onInstall,
  updateAvailable,
  onUpdate,
  offlineReady,
  onDismissOfflineReady,
  isOffline,
}: Props) {
  const showAny = canInstall || updateAvailable || offlineReady || isOffline;
  if (!showAny) return null;

  return (
    <Stack spacing={1.25} sx={{ mb: 2 }}>
      {updateAvailable && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert
            icon={<RefreshIcon fontSize="small" />}
            severity="info"
            onClose={onUpdate}
            action={
              <Button color="inherit" size="small" onClick={onUpdate} startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            }
            sx={{ alignItems: 'center' }}
          >
            New version ready. Reload to get the latest styles and fixes.
          </Alert>
        </Snackbar>
      )}

      {offlineReady && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert
            icon={<DownloadDoneIcon fontSize="small" />}
            severity="success"
            onClose={onDismissOfflineReady}
            action={
              <Button color="inherit" size="small" onClick={onDismissOfflineReady}>
                Dismiss
              </Button>
            }
            sx={{ alignItems: 'center' }}
          >
            Ready to use offline. Your cards and shell are cached locally.
          </Alert>
        </Snackbar>
      )}

      {isOffline && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert icon={<SignalWifiBadIcon fontSize="small" />} severity="warning" sx={{ alignItems: 'center' }}>
            Offline mode. You can still flip saved cards.
          </Alert>
        </Snackbar>
      )}

      {canInstall && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert
            icon={<CloudDownloadIcon fontSize="small" />}
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={onInstall} startIcon={<CloudDownloadIcon />}>
                Install
              </Button>
            }
            sx={{ alignItems: 'center' }}
          >
            Install Kids Flashcards for a smoother, full-screen experience.
          </Alert>
        </Snackbar>
      )}
    </Stack>
  );
}
