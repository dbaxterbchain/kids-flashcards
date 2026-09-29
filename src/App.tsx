import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Container, Snackbar, Stack, Typography } from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { unlockAudio } from './audio/sound';
import { AppHeader } from './components/AppHeader';
import { CardEditor } from './components/CardEditor';
import { ChildDialog } from './components/ChildDialog';
import { ManageView } from './components/ManageView';
import { ParentGate } from './components/ParentGate';
import { PlaySetView } from './components/PlaySetView';
import { PracticePanel } from './components/PracticePanel';
import { PracticeSession } from './components/PracticeSession';
import { PwaPromptBanner } from './components/PwaPromptBanner';
import { SetTile, SetTiles } from './components/SetTiles';
import { defaultSets } from './flashcards/defaultData';
import { AVATARS, buildRound, filterCardsForSets, formatTimeUntil } from './flashcards/practice';
import { buildPracticeQueue } from './flashcards/review';
import { ChildProfile, FlashcardData, FlashcardSet, UNCATEGORIZED_SET_ID } from './flashcards/types';
import { useCardLibrary } from './hooks/useCardLibrary';
import { useChildProfiles } from './hooks/useChildProfiles';
import { useHashRoute } from './hooks/useHashRoute';
import { useLocalStorageState } from './hooks/useLocalStorage';
import { usePwa } from './hooks/usePwa';

const ALL_CARDS_ID = 'all';

const emptyStateSx = {
  p: 3,
  borderRadius: 2,
  border: '1px dashed',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  textAlign: 'center',
} as const;

type PracticeRound = {
  profileId: string;
  cardIds: string[];
  /** Cards the wrong answers are drawn from. */
  poolIds: string[];
  seed: number;
};

type ChildDialogState = {
  open: boolean;
  key: number;
  profile: ChildProfile | null;
};

type CardEditorState = {
  open: boolean;
  key: number;
  card: FlashcardData | null;
  setIds?: string[];
};

const isInSet = (card: FlashcardData, setId: string) =>
  setId === UNCATEGORIZED_SET_ID ? !card.setIds || card.setIds.length === 0 : Boolean(card.setIds?.includes(setId));

const cardsForIds = (ids: string[], cards: FlashcardData[]) =>
  ids.map((id) => cards.find((card) => card.id === id)).filter((card): card is FlashcardData => Boolean(card));

export default function App() {
  const library = useCardLibrary();
  const { cards, sets, loading } = library;
  const { route, navigate, goBack } = useHashRoute();
  // Sets hidden from kids. Hidden (rather than shown) ids are saved so new sets show up by default.
  const [hiddenSetIds, setHiddenSetIds] = useLocalStorageState<string[]>('kids-flashcards:hidden-sets', []);
  const [speakOnFlip, setSpeakOnFlip] = useLocalStorageState('kids-flashcards:speak-on-flip', true);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletedCard, setDeletedCard] = useState<FlashcardData | null>(null);
  const [cardEditor, setCardEditor] = useState<CardEditorState>({ open: false, key: 0, card: null });
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [childDialog, setChildDialog] = useState<ChildDialogState>({ open: false, key: 0, profile: null });

  const { canInstall, promptInstall, updateAvailable, reloadForUpdate, offlineReady, dismissOfflineReady, isOffline } =
    usePwa();

  const {
    profiles,
    activeProfile,
    progress,
    progressReady,
    loading: profilesLoading,
    error: profilesError,
    selectProfile,
    saveProfile,
    removeProfile,
    recordAnswer,
  } = useChildProfiles(cards);

  const shownNotice = notice ?? library.loadError;

  const sortedCards = useMemo(() => [...cards].sort((a, b) => b.createdAt - a.createdAt), [cards]);
  const availableSets = useMemo(
    () =>
      cards.some((card) => isInSet(card, UNCATEGORIZED_SET_ID))
        ? [...sets, { id: UNCATEGORIZED_SET_ID, name: 'No set' }]
        : sets,
    [cards, sets],
  );
  const playableSetIds = useMemo(
    () => availableSets.map((set) => set.id).filter((id) => !hiddenSetIds.includes(id)),
    [availableSets, hiddenSetIds],
  );
  const playCards = useMemo(
    () => sortedCards.filter((card) => playableSetIds.some((setId) => isInSet(card, setId))),
    [sortedCards, playableSetIds],
  );
  const setTiles = useMemo<SetTile[]>(() => {
    const tiles = availableSets
      .filter((set) => playableSetIds.includes(set.id))
      .map((set) => ({
        id: set.id,
        name: set.id === UNCATEGORIZED_SET_ID ? 'More cards' : set.name,
        cards: sortedCards.filter((card) => isInSet(card, set.id)),
      }))
      .filter((tile) => tile.cards.length > 0);
    if (tiles.length <= 1) return tiles;
    // Show a card from each set on "All cards" so it doesn't look like a copy of the first set.
    const firstOfEach = tiles.map((tile) => tile.cards[0]);
    const cover = [...firstOfEach, ...playCards.filter((card) => !firstOfEach.includes(card))].slice(0, 4);
    return [{ id: ALL_CARDS_ID, name: 'All cards', cards: playCards, cover }, ...tiles];
  }, [availableSets, playableSetIds, sortedCards, playCards]);
  const openSetId = route.name === 'set' ? route.setId : null;
  const openTile = useMemo<SetTile | null>(() => {
    if (openSetId === null) return null;
    const tile = setTiles.find((candidate) => candidate.id === openSetId);
    if (tile) return tile;
    // With a single set there's no "All cards" tile, but its link should still work.
    return openSetId === ALL_CARDS_ID && playCards.length > 0 ? { id: ALL_CARDS_ID, name: 'All cards', cards: playCards } : null;
  }, [openSetId, setTiles, playCards]);

  const practicePool = useMemo(
    () => (activeProfile ? filterCardsForSets(cards, activeProfile.settings.setIds ?? playableSetIds) : []),
    [cards, activeProfile, playableSetIds],
  );
  const practicePlan = useMemo(() => buildPracticeQueue(practicePool, progress), [practicePool, progress]);
  const nextReviewLabel = useMemo(() => {
    if (practicePlan.hasDue || !practicePlan.nextReviewAt) return null;
    return formatTimeUntil(practicePlan.nextReviewAt - Date.now());
  }, [practicePlan.hasDue, practicePlan.nextReviewAt]);
  const practiceSetLabel = useMemo(() => {
    const setIds = activeProfile?.settings.setIds ?? null;
    if (setIds === null) return 'All sets';
    const names = availableSets.filter((set) => setIds.includes(set.id)).map((set) => set.name);
    if (names.length === 0) return 'No sets';
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  }, [activeProfile, availableSets]);
  const roundCards = useMemo(() => cardsForIds(round?.cardIds ?? [], cards), [cards, round]);
  const roundPool = useMemo(() => cardsForIds(round?.poolIds ?? [], cards), [cards, round]);
  const defaultAvatar =
    AVATARS.find((avatar) => !profiles.some((profile) => profile.avatar === avatar.emoji))?.emoji ?? AVATARS[0].emoji;

  // Leaving the practice screen (including with the back button) ends the round.
  useEffect(() => {
    if (route.name !== 'practice') setRound(null);
  }, [route.name]);

  // Grown-ups mode locks again as soon as you leave it.
  useEffect(() => {
    if (route.name !== 'manage') setParentUnlocked(false);
  }, [route.name]);

  // A practice or set screen with nothing to show (e.g. opened by reloading the page) goes home.
  useEffect(() => {
    if (loading) return;
    if ((route.name === 'practice' && !round) || (route.name === 'set' && !openTile)) {
      navigate({ name: 'home' }, { replace: true });
    }
  }, [loading, route.name, round, openTile, navigate]);

  const openGrownUps = () => navigate({ name: 'manage' });

  const openCardEditor = (card: FlashcardData | null, setIds?: string[]) =>
    setCardEditor({ open: true, key: Date.now(), card, setIds });

  const closeCardEditor = () => setCardEditor((current) => ({ ...current, open: false }));

  const handleSaveCard = async (card: FlashcardData) => {
    await library.saveCard(card);
    closeCardEditor();
  };

  const handleDeleteCard = (card: FlashcardData) => {
    library
      .removeCard(card.id)
      .then(() => setDeletedCard(card))
      .catch((error) => {
        console.error('Unable to delete card', error);
        setNotice('Unable to delete that card. Storage might be blocked.');
      });
  };

  const undoDelete = () => {
    const card = deletedCard;
    setDeletedCard(null);
    if (!card) return;
    library.saveCard(card).catch((error) => {
      console.error('Unable to restore card', error);
      setNotice('Unable to bring that card back.');
    });
  };

  const handleDeleteSet = async (set: FlashcardSet) => {
    if (!window.confirm(`Delete the "${set.name}" set? Its cards stay in your library.`)) return;
    await library.removeSet(set.id);
    setHiddenSetIds((current) => current.filter((id) => id !== set.id));
  };

  const toggleSetHidden = (setId: string) => {
    setHiddenSetIds((current) => (current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId]));
  };

  const handleRestoreStarters = async () => {
    try {
      await library.restoreStarters();
      const starterSetIds = defaultSets.map((set) => set.id);
      setHiddenSetIds((current) => current.filter((id) => !starterSetIds.includes(id)));
      setNotice(null);
    } catch (error) {
      console.error('Unable to restore starter cards', error);
      setNotice('Unable to bring back the starter cards right now.');
    }
  };

  const startPractice = (pool: FlashcardData[]) => {
    if (!activeProfile || !progressReady || pool.length < 2) return;
    // Start is a tap, which is when browsers allow sound to be switched on.
    unlockAudio();
    setPracticeError(null);
    setRound({
      profileId: activeProfile.id,
      cardIds: buildRound(pool, progress, activeProfile.settings.roundSize),
      poolIds: pool.map((card) => card.id),
      seed: Date.now(),
    });
    if (route.name !== 'practice') navigate({ name: 'practice' });
  };

  const handleAnswer = (cardId: string, correct: boolean) => {
    recordAnswer(cardId, correct).catch((error) => {
      console.error('Unable to save practice result', error);
      setPracticeError("Couldn't save that answer, so progress may be out of date.");
    });
  };

  const openAddChild = () => setChildDialog({ open: true, key: Date.now(), profile: null });

  const openEditChild = (profile: ChildProfile) => setChildDialog({ open: true, key: Date.now(), profile });

  const closeChildDialog = () => setChildDialog((current) => ({ ...current, open: false }));

  const handleSaveChild = async (profile: ChildProfile) => {
    await saveProfile(profile);
    closeChildDialog();
  };

  const handleRemoveChild = async (profile: ChildProfile) => {
    if (!window.confirm(`Remove ${profile.name}? Their practice progress will be deleted too.`)) return;
    await removeProfile(profile.id);
    closeChildDialog();
  };

  const noticeAlert = shownNotice && (
    <Alert severity="warning" onClose={() => setNotice(null)} sx={{ mb: 2 }}>
      {shownNotice}
    </Alert>
  );

  let screen: ReactNode;
  if (route.name === 'practice' && round && activeProfile) {
    screen = (
      <PracticeSession
        key={round.seed}
        profile={activeProfile}
        cards={roundCards}
        pool={roundPool}
        seed={round.seed}
        onAnswer={handleAnswer}
        onRestart={() => startPractice(roundPool)}
        onExit={goBack}
        error={practiceError}
      />
    );
  } else if (route.name === 'manage' && parentUnlocked) {
    screen = (
      <>
        {noticeAlert}
        <ManageView
          cards={sortedCards}
          sets={sets}
          hiddenSetIds={hiddenSetIds}
          profiles={profiles}
          speakOnFlip={speakOnFlip}
          missingStarterCount={library.missingStarterCount}
          onDone={goBack}
          onNewCard={(setId) => openCardEditor(null, setId ? [setId] : undefined)}
          onEditCard={(card) => openCardEditor(card)}
          onDeleteCard={handleDeleteCard}
          onCreateSet={library.createSet}
          onRenameSet={library.renameSet}
          onDeleteSet={handleDeleteSet}
          onToggleSetHidden={toggleSetHidden}
          onAddChild={openAddChild}
          onEditChild={openEditChild}
          onSpeakOnFlipChange={setSpeakOnFlip}
          onRestoreStarters={handleRestoreStarters}
        />
      </>
    );
  } else if (route.name === 'set' && openTile) {
    screen = (
      <PlaySetView
        title={openTile.name}
        cards={openTile.cards}
        speakOnFlip={speakOnFlip}
        practiceProfile={progressReady ? activeProfile : null}
        onBack={goBack}
        onPractice={() => startPractice(openTile.cards)}
      />
    );
  } else {
    screen = (
      <>
        <AppHeader onOpenGrownUps={openGrownUps} />
        {noticeAlert}

        <PracticePanel
          profiles={profiles}
          activeProfile={activeProfile}
          loading={loading || profilesLoading}
          readyCount={practicePlan.dueCount}
          poolSize={practicePool.length}
          canStart={practicePool.length >= 2 && progressReady}
          nextReviewLabel={nextReviewLabel}
          setLabel={practiceSetLabel}
          onSelectProfile={selectProfile}
          onAddProfile={openAddChild}
          onStart={() => startPractice(practicePool)}
          error={profilesError}
        />

        <Box component="section" aria-labelledby="sets-heading">
          <Typography id="sets-heading" variant="h5" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
            What shall we learn?
          </Typography>
          {loading ? (
            <Typography color="text.secondary" sx={emptyStateSx}>
              Loading your cards…
            </Typography>
          ) : setTiles.length === 0 ? (
            <Stack spacing={2} alignItems="center" sx={emptyStateSx}>
              <Typography>No cards to show yet. Grown-ups can add some.</Typography>
              <Button variant="contained" startIcon={<LockOutlinedIcon />} onClick={openGrownUps}>
                Grown-ups
              </Button>
            </Stack>
          ) : (
            <SetTiles tiles={setTiles} onOpen={(setId) => navigate({ name: 'set', setId })} />
          )}
        </Box>
      </>
    );
  }

  const gateOpen = route.name === 'manage' && !parentUnlocked;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <PwaPromptBanner
        canInstall={canInstall}
        onInstall={promptInstall}
        updateAvailable={updateAvailable}
        onUpdate={reloadForUpdate}
        offlineReady={offlineReady}
        onDismissOfflineReady={dismissOfflineReady}
        isOffline={isOffline}
      />
      <Container maxWidth={route.name === 'practice' ? 'md' : 'lg'} sx={{ py: { xs: 2, sm: 4 } }}>
        {screen}
      </Container>

      <ParentGate
        key={gateOpen ? 'gate-open' : 'gate-closed'}
        open={gateOpen}
        onPass={() => setParentUnlocked(true)}
        onCancel={goBack}
      />

      <CardEditor
        key={`card-editor-${cardEditor.key}`}
        open={cardEditor.open}
        card={cardEditor.card}
        sets={sets}
        initialSetIds={cardEditor.setIds}
        onClose={closeCardEditor}
        onSave={handleSaveCard}
        onCreateSet={library.createSet}
      />

      <ChildDialog
        key={`child-dialog-${childDialog.key}`}
        open={childDialog.open}
        profile={childDialog.profile}
        defaultAvatar={defaultAvatar}
        sets={availableSets}
        onClose={closeChildDialog}
        onSave={handleSaveChild}
        onRemove={handleRemoveChild}
      />

      <Snackbar
        open={Boolean(deletedCard)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setDeletedCard(null);
        }}
        message={deletedCard ? `Deleted "${deletedCard.name}"` : ''}
        action={
          <Button color="secondary" size="small" onClick={undoDelete}>
            Undo
          </Button>
        }
      />
    </Box>
  );
}
