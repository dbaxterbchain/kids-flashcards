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
    <div className="gallery__controls">
      <div className="filters">
        <details>
          <summary>Show/hide sets</summary>
          <div className="set-filter-list">
            <div className="set-filter-actions">
              <button type="button" className="ghost" onClick={onShowAll}>
                Show all
              </button>
              <button type="button" className="ghost" onClick={onHideAll}>
                Hide all
              </button>
            </div>
            {availableSets.map((set) => (
              <label key={set.id} className="toggle">
                <input
                  type="checkbox"
                  checked={visibleSetIds.includes(set.id)}
                  onChange={() => onToggleSet(set.id)}
                />
                <span>{set.name}</span>
              </label>
            ))}
            {availableSets.length === 0 && <p className="small-muted">No sets yet.</p>}
          </div>
        </details>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showActions}
            onChange={(event) => onToggleActions(event.target.checked)}
          />
          <span>Show edit & delete buttons</span>
        </label>
      </div>
    </div>
  );
}
