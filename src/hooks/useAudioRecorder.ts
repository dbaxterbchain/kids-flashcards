import { useEffect, useRef, useState } from 'react';
import { blobToDataUrl } from '../flashcards/fileUtils';

type StopOptions = {
  silent?: boolean;
};

export function useAudioRecorder(maxSeconds: number) {
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const ignoreRecordingRef = useRef(false);

  const stopRecording = ({ silent = false }: StopOptions = {}) => {
    if (silent) {
      ignoreRecordingRef.current = true;
    }
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (!silent) {
      setIsRecording(false);
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        if (ignoreRecordingRef.current) {
          ignoreRecordingRef.current = false;
          return;
        }
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        try {
          const dataUrl = await blobToDataUrl(blob);
          setAudioDataUrl(dataUrl);
          setRecordingError(null);
        } catch (error) {
          console.error(error);
          setRecordingError('Unable to save the recording.');
        } finally {
          setIsRecording(false);
          setRecordingSeconds((seconds) => Math.min(seconds, maxSeconds));
          if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
          }
        }
      };

      ignoreRecordingRef.current = false;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordingError(null);
      mediaRecorderRef.current = recorder;
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => Math.min(maxSeconds, seconds + 1));
      }, 1000);
      recordingTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, maxSeconds * 1000);
    } catch (error) {
      console.error(error);
      setRecordingError('Microphone permission denied or unavailable.');
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    stopRecording({ silent: true });
    setRecordingSeconds(0);
    setRecordingError(null);
    setIsRecording(false);
    setAudioDataUrl(null);
  };

  useEffect(() => () => stopRecording({ silent: true }), []);

  return {
    audioDataUrl,
    setAudioDataUrl,
    isRecording,
    recordingSeconds,
    recordingError,
    setRecordingError,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
