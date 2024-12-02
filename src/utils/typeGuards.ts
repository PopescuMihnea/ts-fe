import { EmotionResponse } from "@/interfaces/EmotionResponse";
import { EmotionResults, EmotionScores } from "@/interfaces/EmotionResults";
import { OllamaResponse } from "@/interfaces/OllamaResponse";
import { objectDepth } from "./objectDepth";
import * as Yup from "yup";

function isResponseOrCustomError(
  response: Response | { error: string }
): response is Response {
  return (response as Response).ok == undefined;
}

function isStringEmotionResponse(
  response: EmotionResponse
): response is string {
  return typeof response === "string";
}

function isEmoResponse(
  response: EmotionResponse | { [key: string]: EmotionResponse }
): response is { [key: string]: EmotionResponse } {
  return objectDepth(response) == 3;
}

function isErrorEmotionResponse(
  response: EmotionResponse
): response is { error: string } {
  return !isStringEmotionResponse(response) && response.error != undefined;
}

function isEmotionResultsEmotionResponse(
  response: EmotionResponse
): response is EmotionResults {
  return (
    !isErrorEmotionResponse(response) && !isStringEmotionResponse(response)
  );
}

function isStringEmotionResults(
  results: EmotionScores | string | object
): results is string {
  return typeof results === "string";
}

function isEmotionScoresEmotionResults(
  results: EmotionScores | string | object
): results is EmotionScores {
  const emotionScoresSchema = Yup.object().shape({
    anger: Yup.number().required("Anger score is required."),
    calmness: Yup.number().required("Calmness score is required."),
    disgust: Yup.number().required("Disgust score is required."),
    eagerness: Yup.number().required("Eagerness score is required."),
    fear: Yup.number().required("Fear score is required."),
    joy: Yup.number().required("Joy score is required."),
    pleasantness: Yup.number().required("Pleasantness score is required."),
    sadness: Yup.number().required("Sadness score is required."),
  });

  try {
    emotionScoresSchema.validateSync(results);
    return true;
  } catch (error) {
    return false;
  }
}

function isOllamaResponse(
  response: OllamaResponse | EmotionResponse
): response is OllamaResponse {
  return (
    (response as OllamaResponse).results != undefined &&
    (response as OllamaResponse).warning != undefined
  );
}

export {
  isStringEmotionResponse,
  isErrorEmotionResponse,
  isEmotionResultsEmotionResponse,
  isEmotionScoresEmotionResults,
  isStringEmotionResults,
  isOllamaResponse,
  isEmoResponse,
  isResponseOrCustomError,
};
