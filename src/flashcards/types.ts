export type FlashcardData = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
  audioUrl?: string;
  setIds?: string[];
  backgroundColor?: string;
};

export type FlashcardSet = {
  id: string;
  name: string;
};

export const MAX_AUDIO_SECONDS = 10;
