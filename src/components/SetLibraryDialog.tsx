import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
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
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { languageLabel } from '../flashcards/languages';
import { LIBRARY_SUBJECTS, LibrarySet, LibrarySubject, librarySetId, loadLibrary } from '../flashcards/library';
import { fitStyle } from '../flashcards/textFit';
import { FlashcardSet } from '../flashcards/types';
import { CardFront } from './CardFront';
import './SetLibraryDialog.css';

type SetLibraryDialogProps = {
  open: boolean;
  sets: FlashcardSet[];
  onClose: () => void;
  onAdd: (entry: LibrarySet) => Promise<void>;
};

type SubjectFilter = LibrarySubject | 'all';

const describe = (entry: LibrarySet) =>
  [`${entry.cards.length} cards`, `Ages ${entry.minAge}+`, entry.lang && languageLabel(entry.lang)].filter(Boolean).join(' · ');

/** Ready-made sets a grown-up can add in one tap. */
export function SetLibraryDialog({ open, sets, onClose, onAdd }: SetLibraryDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [library, setLibrary] = useState<LibrarySet[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [subject, setSubject] = useState<SubjectFilter>('all');
  const [viewing, setViewing] = useState<LibrarySet | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Where the list was scrolled to, so coming back from a set lands in the same place.
  const listScrollRef = useRef(0);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (content) content.scrollTop = viewing ? 0 : listScrollRef.current;
  }, [viewing]);

  const openSet = (entry: LibrarySet) => {
    listScrollRef.current = contentRef.current?.scrollTop ?? 0;
    setViewing(entry);
  };

  useEffect(() => {
    if (!open || library) return;
    let cancelled = false;
    setLoadFailed(false);
    loadLibrary()
      .then((sets) => {
        if (!cancelled) setLibrary(sets);
      })
      .catch((error) => {
        console.error('Unable to load the set library', error);
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, library]);

  const isAdded = (entry: LibrarySet) => sets.some((set) => set.id === librarySetId(entry));

  const add = async (entry: LibrarySet) => {
    setAddingId(entry.id);
    try {
      await onAdd(entry);
      setMessage({ severity: 'success', text: `Added “${entry.name}”. Kids can find it on the home screen.` });
    } catch (error) {
      console.error('Unable to add the set', error);
      setMessage({ severity: 'error', text: 'Unable to add that set. Storage might be full or blocked.' });
    } finally {
      setAddingId(null);
    }
  };

  const addButton = (entry: LibrarySet, size: 'small' | 'medium' = 'small') => {
    const added = isAdded(entry);
    return (
      <Button
        size={size}
        variant={added ? 'text' : 'contained'}
        startIcon={added ? <CheckIcon /> : undefined}
        disabled={added || addingId !== null}
        onClick={() => void add(entry)}
        aria-label={added ? `${entry.name} added` : `Add ${entry.name}`}
      >
        {added ? 'Added' : addingId === entry.id ? 'Adding…' : 'Add'}
      </Button>
    );
  };

  const close = () => {
    setViewing(null);
    listScrollRef.current = 0;
    onClose();
  };

  const subjects = LIBRARY_SUBJECTS.filter((option) => subject === 'all' || option.id === subject);

  let content;
  if (loadFailed) {
    content = <Alert severity="error">Couldn&apos;t open the set library. Check your connection and try again.</Alert>;
  } else if (!library) {
    content = (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress aria-label="Opening the set library" />
      </Stack>
    );
  } else if (viewing) {
    content = (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {describe(viewing)}
          </Typography>
          <Typography>{viewing.description}</Typography>
        </Box>
        <Box className="library-cards">
          {viewing.cards.map((card) => (
            <Box key={card.key} component="figure" className="library-cards__card">
              <div className="library-cards__front">
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
    );
  } else {
    content = (
      <Stack spacing={2.5}>
        <Typography variant="body2" color="text.secondary">
          Ready-made sets to add in one tap. Afterwards you can change any card, record your own voice, or hide the set
          from kids.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} role="group" aria-label="Subjects">
          {[{ id: 'all' as const, label: 'All' }, ...LIBRARY_SUBJECTS].map((option) => {
            const selected = option.id === subject;
            return (
              <Chip
                key={option.id}
                label={option.label}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                aria-pressed={selected}
                onClick={() => setSubject(option.id)}
              />
            );
          })}
        </Stack>
        {subjects.map((option) => (
          <Box key={option.id} component="section" aria-labelledby={`library-${option.id}`}>
            <Typography id={`library-${option.id}`} variant="subtitle1" component="h3" sx={{ fontWeight: 800, mb: 1 }}>
              {option.label}
            </Typography>
            <Box className="library-sets">
              {library
                .filter((entry) => entry.subject === option.id)
                .map((entry) => (
                  <Box key={entry.id} className="library-set">
                    <ButtonBase
                      className="library-set__open"
                      onClick={() => openSet(entry)}
                      aria-label={`${entry.name}: ${describe(entry)}. See the cards.`}
                    >
                      <span className="library-set__thumb" aria-hidden>
                        {entry.cards.slice(0, 4).map((card) => (
                          <span key={card.key} className="library-set__cell">
                            <CardFront card={card} alt="" />
                          </span>
                        ))}
                      </span>
                      <span className="library-set__text">
                        <Typography component="span" sx={{ display: 'block', fontWeight: 800, lineHeight: 1.25 }}>
                          {entry.name}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {describe(entry)}
                        </Typography>
                      </span>
                    </ButtonBase>
                    {addButton(entry)}
                  </Box>
                ))}
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth fullScreen={fullScreen} scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
        {viewing && (
          <IconButton edge="start" aria-label="Back to the library" onClick={() => setViewing(null)}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
          {viewing ? viewing.name : 'Set library'}
        </Box>
        <IconButton aria-label="Close the library" onClick={close}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers ref={contentRef}>
        {content}
      </DialogContent>
      {viewing && (
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setViewing(null)}>Back</Button>
          {addButton(viewing, 'medium')}
        </DialogActions>
      )}
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={message?.severity === 'error' ? null : 5000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setMessage(null);
        }}
      >
        <Alert severity={message?.severity ?? 'success'} variant="filled" onClose={() => setMessage(null)} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
