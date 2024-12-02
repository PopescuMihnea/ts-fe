interface EmotionScores {
  anger: number;
  calmness: number;
  disgust: number;
  eagerness: number;
  fear: number;
  joy: number;
  pleasantness: number;
  sadness: number;
}

interface EmotionResults {
  [key: string]:
    | EmotionScores
    | string
    | { [key: string]: string | number | undefined };
}

export { EmotionScores, EmotionResults };
