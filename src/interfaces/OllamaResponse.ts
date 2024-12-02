import { EmotionResponse } from "./EmotionResponse";

interface OllamaResponse {
  results: EmotionResponse;
  warning: string;
}

export { OllamaResponse };
