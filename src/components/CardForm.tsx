import { FormEvent, RefObject } from 'react';
import { MAX_AUDIO_SECONDS, FlashcardSet } from '../flashcards/types';

type CardFormProps = {
  formRef: RefObject<HTMLFormElement>;
  name: string;
  onNameChange: (value: string) => void;
  imageData: string | null;
  uploadError: string | null;
  editingId: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onImageFileChange: (files: FileList | null) => void;
  sets: FlashcardSet[];
  selectedSetIds: string[];
  onToggleSet: (setId: string) => void;
  newSetName: string;
  onSetNameChange: (value: string) => void;
  onAddSet: () => void;
  audioDataUrl: string | null;
  recordingError: string | null;
  recordingSeconds: number;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioFileChange: (files: FileList | null) => void;
  onClearAudio: () => void;
};

export function CardForm({
  formRef,
  name,
  onNameChange,
  imageData,
  uploadError,
  editingId,
  onSubmit,
  onCancelEdit,
  onImageFileChange,
  sets,
  selectedSetIds,
  onToggleSet,
  newSetName,
  onSetNameChange,
  onAddSet,
  audioDataUrl,
  recordingError,
  recordingSeconds,
  isRecording,
  onStartRecording,
  onStopRecording,
  onAudioFileChange,
  onClearAudio,
}: CardFormProps) {
  return (
    <section className="card-maker">
      <div className="card-maker__panel">
        <h2>{editingId ? 'Edit your flashcard' : 'Make a new flashcard'}</h2>
        <p className="form-hint">
          {editingId ? 'Update the details and save changes.' : 'Give it a name and pick a picture.'}
        </p>
        <form ref={formRef} onSubmit={onSubmit} className="card-form">
          <label className="field">
            <span>Card name</span>
            <input
              type="text"
              name="name"
              placeholder="e.g. Spaceship"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Picture</span>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(event) => onImageFileChange(event.target.files)}
            />
          </label>

          <div className="sets-card">
            <div className="sets-card__header">
              <span>Sets</span>
              <p className="sets-card__hint">Group cards into sets to show or hide them together.</p>
            </div>
            <div className="sets-list">
              {sets.map((set) => (
                <label key={set.id} className="toggle">
                  <input
                    type="checkbox"
                    checked={selectedSetIds.includes(set.id)}
                    onChange={() => onToggleSet(set.id)}
                  />
                  <span>{set.name}</span>
                </label>
              ))}
              {sets.length === 0 && <p className="small-muted">No sets yet. Add one below.</p>}
            </div>
            <div className="add-set">
              <input
                type="text"
                value={newSetName}
                onChange={(event) => onSetNameChange(event.target.value)}
                placeholder="New set name (e.g. Animals)"
              />
              <button type="button" className="ghost" onClick={onAddSet}>
                Add set
              </button>
            </div>
          </div>

          <div className="audio-card">
            <div className="audio-card__header">
              <span>Optional audio (plays on flip)</span>
              <p className="audio-card__hint">
                Record or upload a short sound, up to {MAX_AUDIO_SECONDS} seconds.
              </p>
            </div>
            <div className="audio-actions-row">
              <button
                type="button"
                className={`ghost ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? onStopRecording : onStartRecording}
              >
                {isRecording
                  ? `Stop recording (${recordingSeconds}s / ${MAX_AUDIO_SECONDS}s)`
                  : 'Record audio'}
              </button>
              <span className="audio-timer">
                {recordingSeconds}s / {MAX_AUDIO_SECONDS}s
              </span>
            </div>
            <label className="field file-inline">
              <span>Upload audio (optional)</span>
              <input
                type="file"
                name="audio"
                accept="audio/*"
                onChange={(event) => onAudioFileChange(event.target.files)}
              />
            </label>
            {audioDataUrl && (
              <div className="preview-audio">
                <audio controls src={audioDataUrl} />
                <button type="button" className="ghost" onClick={onClearAudio}>
                  Remove audio
                </button>
              </div>
            )}
            {recordingError && <p className="error">{recordingError}</p>}
          </div>

          {imageData && (
            <div className="preview">
              <p>Preview</p>
              <div className="preview-card">
                <img src={imageData} alt="Uploaded preview" />
              </div>
            </div>
          )}

          {uploadError && <p className="error">{uploadError}</p>}

          <div className="form-actions">
            {editingId && (
              <button type="button" className="ghost" onClick={onCancelEdit}>
                Cancel edit
              </button>
            )}
            <button type="submit" className="cta">
              {editingId ? 'Save changes' : 'Add card'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
