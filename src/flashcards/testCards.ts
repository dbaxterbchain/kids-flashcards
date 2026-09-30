import { FlashcardData } from './types';

/** A minimal card for tests. */
export function testCard(id: string, overrides: Partial<FlashcardData> = {}): FlashcardData {
  return { id, name: id, imageUrl: '', createdAt: 0, setIds: [], ...overrides };
}
