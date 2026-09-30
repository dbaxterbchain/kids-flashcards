import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Container, Snackbar, Stack, Typography } from '@mui/material';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
import { GameReward } from './components/GameParts';
import { ListenGame } from './components/ListenGame';
import { MemoryGame } from './components/MemoryGame';
import { OddOneOutGame } from './components/OddOneOutGame';
import { StickerBook } from './components/StickerBook';
import { buildOddOneOut, distinctCards, GameKind, oddOneOutBelonging } from './flashcards/games';
import { Backup, createBackup, restoreBackup, saveBackupFile } from './flashcards/backup';
import { defaultCards, defaultSets } from './flashcards/defaultData';
import { recordRound } from './flashcards/difficulty';
import { LibrarySet, prepareLibrarySet } from './flashcards/library';
import { AVATARS, buildRound, filterCardsForSets, formatTimeUntil } from './flashcards/practice';
import { buildPracticeQueue } from './flashcards/review';
import { BackupError } from './flashcards/backup';
import { listenForOpenedFiles, takeSharedFile } from './flashcards/incomingFiles';
import { createSetPackage, IncomingSet, parseSetPackage, saveSetFile, SetPackage } from './flashcards/setPackage';
import { STORAGE_KEYS } from './flashcards/storageKeys';
import { awardSticker, practiceStreak, recordPracticeDay } from './flashcards/stickers';
import {
  ChildProfile,
  DifficultyChange,
  FlashcardData,
  FlashcardSet,
  Sticker,
  UNCATEGORIZED_SET_ID,
} from './flashcards/types';
import { RemoveSetOptions, useCardLibrary } from './hooks/useCardLibrary';
import { useChildProfiles } from './hooks/useChildProfiles';
import { useHashRoute } from './hooks/useHashRoute';
import { useLocalStorageState } from './hooks/useLocalStorage';
import { usePwa } from './hooks/usePwa';

const ALL_CARDS_ID = 'all';

const STARTER_CARD_IDS = new Set(defaultCards.map((card) => card.id));

// How long before Grown-ups starts suggesting a fresh backup.
const BACKUP_REMINDER_MS = 30 * 24 * 60 * 60 * 1000;

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
  /** Cards to introduce before the questions. */
  newCardIds: string[];
  /** Cards the wrong answers are drawn from. */
  poolIds: string[];
  seed: number;
  /** A change to the number of choices made when the round ended. */
  difficultyChange?: DifficultyChange | null;
  /** The sticker earned for finishing, and the days-in-a-row count. */
  reward?: { sticker: Sticker; streak: number } | null;
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
  const [hiddenSetIds, setHiddenSetIds] = useLocalStorageState<string[]>(STORAGE_KEYS.hiddenSets, []);
  const [speakOnFlip, setSpeakOnFlip] = useLocalStorageState(STORAGE_KEYS.speakOnFlip, true);
  const [sayIt, setSayIt] = useLocalStorageState(STORAGE_KEYS.sayIt, true);
  const [lastBackupAt, setLastBackupAt] = useLocalStorageState<number | null>(STORAGE_KEYS.lastBackupAt, null);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletedCard, setDeletedCard] = useState<FlashcardData | null>(null);
  const [cardEditor, setCardEditor] = useState<CardEditorState>({ open: false, key: 0, card: null });
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [childDialog, setChildDialog] = useState<ChildDialogState>({ open: false, key: 0, profile: null });
  // Each game played gets a fresh key, so "Play again" deals a new one.
  const [gameKey, setGameKey] = useState(0);
  const [gameReward, setGameReward] = useState<GameReward | null>(null);
  // A set file shared to the app or opened with it, shown in Grown-ups › Sets once unlocked.
  const [incomingSet, setIncomingSet] = useState<IncomingSet | null>(null);

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
  const openSetId = route.name === 'set' || route.name === 'game' ? route.setId : null;
  const openTile = useMemo<SetTile | null>(() => {
    if (openSetId === null) return null;
    const tile = setTiles.find((candidate) => candidate.id === openSetId);
    if (tile) return tile;
    // With a single set there's no "All cards" tile, but its link should still work.
    return openSetId === ALL_CARDS_ID && playCards.length > 0 ? { id: ALL_CARDS_ID, name: 'All cards', cards: playCards } : null;
  }, [openSetId, setTiles, playCards]);

  // Cards from the other sets kids can see, where odd one out finds its odd ones.
  const otherPlayCards = useMemo(
    () => (openTile ? playCards.filter((card) => !openTile.cards.includes(card)) : []),
    [openTile, playCards],
  );
  const availableGames = useMemo<GameKind[]>(() => {
    if (!openTile || distinctCards(openTile.cards).length < 2) return [];
    const games: GameKind[] = ['memory', 'listen'];
    const isRealSet = openTile.id !== ALL_CARDS_ID && openTile.id !== UNCATEGORIZED_SET_ID;
    const settings = activeProfile?.settings ?? null;
    if (
      isRealSet &&
      buildOddOneOut(openTile.cards, otherPlayCards, { questions: 1, belonging: oddOneOutBelonging(settings), seed: 1 }).length > 0
    ) {
      games.push('odd-one-out');
    }
    return games;
  }, [openTile, otherPlayCards, activeProfile]);

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
  const roundNewCards = useMemo(() => cardsForIds(round?.newCardIds ?? [], cards), [cards, round]);
  const hasOwnContent = profiles.length > 0 || cards.some((card) => !STARTER_CARD_IDS.has(card.id));
  const showBackupReminder = hasOwnContent && (lastBackupAt === null || Date.now() - lastBackupAt > BACKUP_REMINDER_MS);
  const defaultAvatar =
    AVATARS.find((avatar) => !profiles.some((profile) => profile.avatar === avatar.emoji))?.emoji ?? AVATARS[0].emoji;

  // Leaving the practice screen (including with the back button) ends the round.
  useEffect(() => {
    if (route.name !== 'practice') setRound(null);
  }, [route.name]);

  useEffect(() => {
    const receive = (text: string) => {
      try {
        setIncomingSet({ pkg: parseSetPackage(text) });
      } catch (error) {
        setIncomingSet({ error: error instanceof BackupError ? error.message : "Couldn't read that file." });
      }
      navigate({ name: 'manage' });
    };
    takeSharedFile()
      .then((text) => text && receive(text))
      .catch((error) => console.warn('Unable to check for a shared file', error));
    listenForOpenedFiles(receive);
  }, [navigate]);

  const clearIncomingSet = useCallback(() => setIncomingSet(null), []);

  // Grown-ups mode locks again as soon as you leave it.
  useEffect(() => {
    if (route.name !== 'manage') setParentUnlocked(false);
  }, [route.name]);

  // A practice or set screen with nothing to show (e.g. opened by reloading the page) goes home.
  useEffect(() => {
    if (loading || profilesLoading) return;
    if (
      (route.name === 'practice' && !round) ||
      ((route.name === 'set' || route.name === 'game') && !openTile) ||
      (route.name === 'stickers' && !activeProfile)
    ) {
      navigate({ name: 'home' }, { replace: true });
    }
  }, [loading, profilesLoading, route.name, round, openTile, activeProfile, navigate]);

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

  const handleDeleteSet = async (set: FlashcardSet, options: RemoveSetOptions) => {
    await library.removeSet(set.id, options);
    setHiddenSetIds((current) => current.filter((id) => id !== set.id));
  };

  const handleShareSet = (set: FlashcardSet) =>
    saveSetFile(createSetPackage(set.name, sortedCards.filter((card) => isInSet(card, set.id))));

  const handleImportSet = (pkg: SetPackage) => library.importSet(pkg);

  const handleAddLibrarySet = async (entry: LibrarySet) => {
    const { set, cards: setCards } = prepareLibrarySet(entry, sets, cards);
    await library.addSetWithCards(set, setCards);
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

  const handleSaveBackup = async () => {
    const result = await saveBackupFile(await createBackup({ hiddenSetIds, speakOnFlip, sayIt }));
    if (result !== 'cancelled') setLastBackupAt(Date.now());
    return result;
  };

  const handleRestoreBackup = async (backup: Backup) => {
    await restoreBackup(backup);
    // Start fresh from the home screen so every part of the app reads the restored data.
    window.history.replaceState(null, '', '#/');
    window.location.reload();
  };

  const startPractice = (pool: FlashcardData[]) => {
    if (!activeProfile || !progressReady || pool.length < 2) return;
    // Start is a tap, which is when browsers allow sound to be switched on.
    unlockAudio();
    setPracticeError(null);
    setRound({
      profileId: activeProfile.id,
      ...buildRound(pool, progress, activeProfile.settings.roundSize, {
        introduceNew: activeProfile.settings.introduceNew,
      }),
      poolIds: pool.map((card) => card.id),
      seed: Date.now(),
    });
    if (route.name !== 'practice') navigate({ name: 'practice' });
  };

  const handleRoundComplete = ({ results, perfect }: { results: boolean[]; perfect: boolean }) => {
    if (!activeProfile) return;
    const adjusted = results.length > 0 ? recordRound(activeProfile, results) : { profile: activeProfile, change: null };
    const { profile, sticker } = awardSticker(recordPracticeDay(adjusted.profile), { perfect });
    setRound((current) =>
      current
        ? { ...current, difficultyChange: adjusted.change, reward: { sticker, streak: practiceStreak(profile.practiceDays) } }
        : current,
    );
    saveProfile(profile).catch((error) => {
      console.error('Unable to save how the round went', error);
      setPracticeError("Couldn't save how this round went.");
    });
  };

  const startGame = (game: GameKind) => {
    if (!openTile) return;
    // Starting a game is a tap, which is when browsers allow sound to be switched on.
    unlockAudio();
    setGameReward(null);
    setGameKey((key) => key + 1);
    if (route.name === 'game') return;
    navigate({ name: 'game', game, setId: openTile.id });
  };

  const handleGameFinish = ({ perfect }: { perfect: boolean }) => {
    if (!activeProfile) return;
    const { profile, sticker } = awardSticker(recordPracticeDay(activeProfile), { perfect });
    setGameReward({ sticker, streak: practiceStreak(profile.practiceDays) });
    saveProfile(profile).catch((error) => {
      console.error('Unable to save the sticker', error);
    });
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
        newCards={roundNewCards}
        pool={roundPool}
        seed={round.seed}
        onAnswer={handleAnswer}
        onComplete={handleRoundComplete}
        difficultyChange={round.difficultyChange}
        reward={round.reward}
        onOpenStickers={() => navigate({ name: 'stickers' })}
        onRestart={() => startPractice(roundPool)}
        onExit={goBack}
        error={practiceError}
      />
    );
  } else if (route.name === 'game' && openTile) {
    const gameProps = {
      title: openTile.name,
      profile: activeProfile,
      reward: gameReward,
      onFinish: handleGameFinish,
      onPlayAgain: () => startGame(route.game),
      onExit: goBack,
    };
    screen =
      route.game === 'memory' ? (
        <MemoryGame key={gameKey} cards={openTile.cards} {...gameProps} />
      ) : route.game === 'listen' ? (
        <ListenGame key={gameKey} cards={openTile.cards} {...gameProps} />
      ) : (
        <OddOneOutGame key={gameKey} setCards={openTile.cards} otherCards={otherPlayCards} {...gameProps} />
      );
  } else if (route.name === 'stickers' && activeProfile) {
    screen = <StickerBook profile={activeProfile} streak={practiceStreak(activeProfile.practiceDays)} onBack={goBack} />;
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
          onShareSet={handleShareSet}
          onImportSet={handleImportSet}
          onAddLibrarySet={handleAddLibrarySet}
          incomingSet={incomingSet}
          onIncomingSetHandled={clearIncomingSet}
          onAddChild={openAddChild}
          onEditChild={openEditChild}
          onSpeakOnFlipChange={setSpeakOnFlip}
          sayIt={sayIt}
          onSayItChange={setSayIt}
          onRestoreStarters={handleRestoreStarters}
          lastBackupAt={lastBackupAt}
          showBackupReminder={showBackupReminder}
          onSaveBackup={handleSaveBackup}
          onRestoreBackup={handleRestoreBackup}
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
        games={availableGames}
        onPlayGame={startGame}
        sayIt={sayIt}
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
          stickerCount={activeProfile?.stickers?.length ?? 0}
          streak={practiceStreak(activeProfile?.practiceDays)}
          onOpenStickers={() => navigate({ name: 'stickers' })}
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
