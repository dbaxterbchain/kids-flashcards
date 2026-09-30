import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { getProgress } from '../db/progressDb';
import { filterCardsForSets } from '../flashcards/practice';
import { CARD_STATUSES, CardStatus, lastPracticedAt, ProgressSummary, summarizeProgress } from '../flashcards/progressSummary';
import { ProgressByCard } from '../flashcards/review';
import { fitStyle } from '../flashcards/textFit';
import { ChildProfile, FlashcardData, FlashcardSet } from '../flashcards/types';
import { CardFront } from './CardFront';
import { ChildAvatar } from './ChildAvatar';
import './ChildProgressDialog.css';

type ChildProgressDialogProps = {
  /** The child to show, or null when the dialog is closed. */
  profile: ChildProfile | null;
  cards: FlashcardData[];
  /** The sets this child practices, in the order they're shown. */
  sets: FlashcardSet[];
  onClose: () => void;
};

const STATUS_LABELS: Record<CardStatus, string> = {
  mastered: 'Mastered',
  learning: 'Learning',
  tricky: 'Tricky',
  new: 'Not started',
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const describeCounts = (summary: ProgressSummary) =>
  CARD_STATUSES.filter((status) => summary.counts[status] > 0)
    .map((status) => `${summary.counts[status]} ${STATUS_LABELS[status].toLowerCase()}`)
    .join(' · ');

function formatDay(time: number) {
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(time).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return new Date(time).toLocaleDateString(undefined, { weekday: 'long' });
  return new Date(time).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

/** A 100% bar of a set's cards by status: mastered, learning, tricky, then not started as the track. */
function ProgressBar({ summary, label }: { summary: ProgressSummary; label: string }) {
  return (
    <div className="progress-bar" role="img" aria-label={`${label}: ${describeCounts(summary)}`}>
      {CARD_STATUSES.filter((status) => summary.counts[status] > 0).map((status) => (
        <Tooltip key={status} title={`${STATUS_LABELS[status]}: ${plural(summary.counts[status], 'card')}`} placement="top">
          <span className={`progress-bar__segment progress-bar__segment--${status}`} style={{ flexGrow: summary.counts[status] }} />
        </Tooltip>
      ))}
    </div>
  );
}

/** Shows grown-ups how one child is doing, set by set. */
export function ChildProgressDialog({ profile, cards, sets, onClose }: ChildProgressDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [loaded, setLoaded] = useState<{ profileId: string; progress: ProgressByCard } | null>(null);
  const [failed, setFailed] = useState(false);
  const profileId = profile?.id ?? null;

  useEffect(() => {
    if (!profileId) return undefined;
    let cancelled = false;
    setFailed(false);
    getProgress(profileId)
      .then((records) => {
        if (cancelled) return;
        const progress: ProgressByCard = {};
        records.forEach(({ profileId: _profileId, cardId, ...review }) => {
          progress[cardId] = review;
        });
        setLoaded({ profileId, progress });
      })
      .catch((error) => {
        console.error('Unable to load progress', error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const progress = loaded && loaded.profileId === profileId ? loaded.progress : null;
  const practiced = useMemo(
    () => filterCardsForSets(cards, sets.map((set) => set.id)),
    [cards, sets],
  );
  const overall = useMemo(() => (progress ? summarizeProgress(practiced, progress) : null), [practiced, progress]);
  const bySet = useMemo(
    () =>
      progress
        ? sets
            .map((set) => ({ set, summary: summarizeProgress(filterCardsForSets(cards, [set.id]), progress) }))
            .filter(({ summary }) => summary.total > 0)
        : [],
    [cards, sets, progress],
  );
  const lastPracticed = progress ? lastPracticedAt(progress) : null;

  let content;
  if (failed) {
    content = <Alert severity="error">Couldn&apos;t load {profile?.name}&apos;s progress right now.</Alert>;
  } else if (!overall || !profile) {
    content = (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress aria-label="Loading progress" />
      </Stack>
    );
  } else {
    const met = overall.total - overall.counts.new;
    content = (
      <Stack spacing={3}>
        <Typography color="text.secondary">
          {lastPracticed ? `Last practiced ${formatDay(lastPracticed)}.` : 'Hasn’t practiced yet.'} Met {met} of{' '}
          {plural(overall.total, 'card')} in {plural(sets.length, 'set')}.
        </Typography>

        <Box className="progress-tiles">
          {CARD_STATUSES.map((status) => (
            <div key={status} className="progress-tile">
              <span className="progress-tile__label">
                <span className={`progress-key progress-key--${status}`} aria-hidden />
                {STATUS_LABELS[status]}
                {status === 'tricky' && <ErrorOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} aria-hidden />}
              </span>
              <span className="progress-tile__value">{overall.counts[status]}</span>
            </div>
          ))}
        </Box>

        {bySet.length > 0 && (
          <Stack spacing={1.75} component="section" aria-labelledby="progress-by-set">
            <Typography id="progress-by-set" variant="subtitle1" component="h3" sx={{ fontWeight: 800 }}>
              By set
            </Typography>
            {bySet.map(({ set, summary }) => (
              <Stack key={set.id} spacing={0.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Typography sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
                    {set.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {summary.counts.mastered} of {summary.total} mastered
                  </Typography>
                </Stack>
                <ProgressBar summary={summary} label={set.name} />
                <Typography variant="caption" color="text.secondary">
                  {describeCounts(summary)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {overall.cards.tricky.length > 0 && (
          <Stack spacing={1.25} component="section" aria-labelledby="progress-tricky">
            <Box>
              <Typography id="progress-tricky" variant="subtitle1" component="h3" sx={{ fontWeight: 800 }}>
                Tricky cards
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Good ones to look at and talk about together.
              </Typography>
            </Box>
            <Box className="progress-cards">
              {overall.cards.tricky.map((card) => (
                <Box key={card.id} component="figure" className="progress-cards__card">
                  <div className="progress-cards__front">
                    <CardFront card={card} alt="" />
                  </div>
                  <Typography
                    component="figcaption"
                    variant="body2"
                    style={fitStyle(card.name)}
                    sx={{ fontWeight: 700, fontSize: 'min(0.875rem, calc(100cqi / var(--fit-em, 1)))' }}
                  >
                    {card.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        )}

        <Box component="dl" className="progress-legend">
          <dt>Mastered</dt>
          <dd>Answered right over several days, so it only comes back about once a week or less.</dd>
          <dt>Learning</dt>
          <dd>Seen, but not solid yet.</dd>
          <dt>Tricky</dt>
          <dd>Missed at least twice in the last five tries.</dd>
        </Box>
      </Stack>
    );
  }

  return (
    <Dialog open={Boolean(profile)} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 1.5 }}>
        {profile && <ChildAvatar profile={profile} size={36} />}
        <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
          {profile ? `${profile.name}’s progress` : 'Progress'}
        </Box>
        <IconButton aria-label="Close progress" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{content}</DialogContent>
    </Dialog>
  );
}
