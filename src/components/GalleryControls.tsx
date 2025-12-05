import CheckIcon from '@mui/icons-material/Check';
import HideSourceIcon from '@mui/icons-material/HideSource';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Chip, Divider, IconButton, Stack, Switch, Typography } from '@mui/material';
import { FlashcardSet } from '../flashcards/types';

type GalleryControlsProps = {
  availableSets: FlashcardSet[];
  visibleSetIds: string[];
  onToggleSet: (setId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  showActions: boolean;
  onToggleActions: (value: boolean) => void;
};

export function GalleryControls({
  availableSets,
  visibleSetIds,
  onToggleSet,
  onShowAll,
  onHideAll,
  showActions,
  onToggleActions,
}: GalleryControlsProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        mb: 3,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={700}>
            Show/hide sets
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" color="primary" aria-label="Show all sets" onClick={onShowAll}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Hide all sets" onClick={onHideAll}>
              <HideSourceIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {availableSets.map((set) => {
            const selected = visibleSetIds.includes(set.id);
            return (
              <Chip
                key={set.id}
                label={set.name}
                icon={selected ? <CheckIcon /> : undefined}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => onToggleSet(set.id)}
              />
            );
          })}
          {availableSets.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No sets yet.
            </Typography>
          )}
        </Stack>

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Show edit & delete buttons
          </Typography>
          <Switch
            checked={showActions}
            onChange={(event) => onToggleActions(event.target.checked)}
            inputProps={{ 'aria-label': 'Toggle card action buttons' }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
