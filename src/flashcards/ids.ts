/** A new random id for a card, set or child. */
export const newId = () =>
  // randomUUID is missing outside secure contexts (e.g. the dev server opened by its network address).
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
