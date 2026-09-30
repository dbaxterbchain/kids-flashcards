import CloseIcon from '@mui/icons-material/Close';
import HearingIcon from '@mui/icons-material/Hearing';
import MicIcon from '@mui/icons-material/Mic';
import ReplayIcon from '@mui/icons-material/Replay';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, ButtonBase, Dialog, IconButton, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playRecording, speakCard, stopSpeaking, unlockAudio } from '../audio/sound';
import { fitStyle } from '../flashcards/textFit';
import { FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import './SayItDialog.css';

type SayItDialogProps = {
  /** The card to say, or null when the dialog is closed. */
  card: FlashcardData | null;
  onClose: () => void;
};

type Step = 'ready' | 'recording' | 'you' | 'listen' | 'done' | 'blocked';

/** A word is only a few seconds long. */
const MAX_SECONDS = 4;

/**
 * "Say it": the child records themselves saying the word, then hears their voice and the card's own
 * (the grown-up's recording, or the device's voice). Nothing is saved.
 */
export function SayItDialog({ card, onClose }: SayItDialogProps) {
  const [step, setStep] = useState<Step>('ready');
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);
  const clipUrlRef = useRef<string | null>(null);
  // Bumped on close, so playback that's still finishing doesn't carry on afterwards.
  const runRef = useRef(0);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const releaseMicrophone = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const reset = useCallback(() => {
    runRef.current += 1;
    clearTimers();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    releaseMicrophone();
    stopSpeaking();
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = null;
    setClipUrl(null);
    setStep('ready');
    setSecondsLeft(MAX_SECONDS);
  }, []);

  // Start fresh for each card, and let go of the microphone and the clip when closed.
  useEffect(() => {
    reset();
    return reset;
  }, [card, reset]);

  const playBoth = async (url: string) => {
    if (!card) return;
    const run = runRef.current;
    setStep('you');
    await playRecording(url);
    if (run !== runRef.current) return;
    setStep('listen');
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    if (run !== runRef.current) return;
    speakCard(card);
    timersRef.current.push(window.setTimeout(() => setStep('done'), 1500));
  };

  const startRecording = async () => {
    // A tap, so sound is allowed to play when the recording comes back.
    unlockAudio();
    stopSpeaking();
    const run = runRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (run !== runRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        releaseMicrophone();
        if (run !== runRef.current) return;
        const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' }));
        if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
        clipUrlRef.current = url;
        setClipUrl(url);
        void playBoth(url);
      };
      recorderRef.current = recorder;
      recorder.start();
      setStep('recording');
      setSecondsLeft(MAX_SECONDS);
      for (let second = 1; second <= MAX_SECONDS; second += 1) {
        timersRef.current.push(
          window.setTimeout(() => {
            if (second === MAX_SECONDS) stopRecording();
            else setSecondsLeft(MAX_SECONDS - second);
          }, second * 1000),
        );
      }
    } catch (error) {
      console.warn('Microphone unavailable', error);
      if (run === runRef.current) setStep('blocked');
    }
  };

  const stopRecording = () => {
    clearTimers();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    recorderRef.current = null;
  };

  const close = () => {
    reset();
    onClose();
  };

  let action;
  let message: string;
  if (step === 'recording') {
    message = `Listening… ${secondsLeft}`;
    action = (
      <ButtonBase className="say-it__button say-it__button--recording" focusRipple onClick={stopRecording} aria-label="Stop">
        <StopIcon />
      </ButtonBase>
    );
  } else if (step === 'you' || step === 'listen') {
    message = step === 'you' ? "That's you!" : 'Now listen:';
    action = (
      <span className="say-it__button say-it__button--playing" aria-hidden>
        {step === 'you' ? <HearingIcon /> : <VolumeUpIcon />}
      </span>
    );
  } else if (step === 'done') {
    message = 'Great saying it!';
    action = null;
  } else if (step === 'blocked') {
    message = 'Ask a grown-up to let this app use the microphone.';
    action = null;
  } else {
    message = 'Tap the microphone and say the word.';
    action = (
      <ButtonBase className="say-it__button" focusRipple onClick={() => void startRecording()} aria-label="Start recording">
        <MicIcon />
      </ButtonBase>
    );
  }

  return (
    <Dialog open={Boolean(card)} onClose={close} maxWidth="xs" fullWidth>
      {card && (
        <Stack spacing={2} alignItems="center" sx={{ p: 3, pt: 2, position: 'relative', containerType: 'inline-size' }}>
          <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            Say it!
          </Typography>
          <Box className="say-it__card">
            <CardFront card={card} alt="" />
          </Box>
          <Typography className="say-it__word" style={fitStyle(card.name, 800)} lang={card.lang}>
            {card.name}
          </Typography>
          {action}
          <Typography role="status" sx={{ fontWeight: 700, textAlign: 'center', minHeight: 24 }}>
            {message}
          </Typography>
          {step === 'done' && (
            <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={() => void startRecording()}>
                Try again
              </Button>
              {clipUrl && (
                <Button variant="outlined" startIcon={<HearingIcon />} onClick={() => void playRecording(clipUrl)}>
                  Hear me
                </Button>
              )}
              <Button variant="outlined" startIcon={<VolumeUpIcon />} onClick={() => speakCard(card)}>
                Hear it
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </Dialog>
  );
}
