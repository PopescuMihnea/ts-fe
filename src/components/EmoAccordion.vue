<script lang="ts" setup>
import { ProgressBar, Card, ProgressSpinner } from "primevue";
import SingleAccordion from "./SingleAccordion.vue";
import { EmotionResponse } from "@/interfaces/EmotionResponse";
import { EmotionResults, EmotionScores } from "@/interfaces/EmotionResults";

const emotionColors: Record<string, string> = {
  anger: "text-red-500",
  calmness: "text-blue-500",
  joy: "text-yellow-500",
  fear: "text-purple-500",
  sadness: "text-indigo-500",
  disgust: "text-green-500",
  eagerness: "text-orange-500",
  pleasantness: "text-teal-500",
};

const props = defineProps<{
  name: string;
  results: { [key: string]: EmotionResponse };
}>();

const scaledEmotionScores = (emotionScores: EmotionScores): EmotionScores => {
  const targetValue = 1;
  const sum = Object.values(emotionScores).reduce(
    (previous, current) => parseFloat(previous) + parseFloat(current),
    0.0
  );
  const multiplier = (1.0 * targetValue) / sum;
  return {
    anger: emotionScores.anger * multiplier,
    calmness: emotionScores.calmness * multiplier,
    disgust: emotionScores.disgust * multiplier,
    eagerness: emotionScores.eagerness * multiplier,
    fear: emotionScores.fear * multiplier,
    joy: emotionScores.joy * multiplier,
    pleasantness: emotionScores.pleasantness * multiplier,
    sadness: emotionScores.sadness * multiplier,
  };
};

const trimEmotionScore = (emotionScore: number, nrDecimals = 4): number => {
  return parseFloat((emotionScore * 100).toFixed(nrDecimals));
};
</script>

<template>
  <Card class="my-4">
    <template #title> Results from {{ name }} </template>
    <template
      #content
      v-if="!props.results || Object.keys(props.results).length < 1"
    >
      <div class="flex flex-col items-center">
        <ProgressSpinner class="my-4" />
      </div>
    </template>
    <template #content v-else>
      <template
        v-for="(result, index) of Object.entries(results)"
        :key="result[0]"
      >
        <SingleAccordion>
          <template #header>
            <p>Analysis of review#{{ index }}</p>
          </template>
          <template #content>
            <p class="my-2 text-blue-300">
              Name of review returned by API: {{ result[0] }}
            </p>
            <template
              v-for="model of (Object.entries(result[1] as EmotionResults))"
              :key="model"
            >
              <SingleAccordion
                header-class="bg-slate-900"
                accordion-class="emo-accordion"
              >
                <template #header>
                  <p>Results of model {{ model[0] }}</p>
                </template>
                <template #content>
                  <div
                    v-for="data of Object.entries(
                      scaledEmotionScores(model[1] as EmotionScores)
                    )"
                    :key="data[0]"
                    class="flex flex-col"
                  >
                    <p :class="emotionColors[data[0]]">
                      {{ `${data[0]}: ${trimEmotionScore(data[1])}` }}
                    </p>
                    <ProgressBar
                      :class="{
                        '[&>*:first-child]:bg-red-700': data[1] < 0.3,
                        '[&>*:first-child]:bg-yellow-700':
                          data[1] >= 0.3 && data[1] < 0.5,
                        '[&>*:first-child]:bg-green-300':
                          data[1] >= 0.5 && data[1] <= 0.7,
                        '[&>*:first-child]:bg-green-700': data[1] > 0.7,
                      }"
                      :value="trimEmotionScore(data[1])"
                    >
                      {{ trimEmotionScore(data[1], 0) }}
                    </ProgressBar>
                  </div>
                </template>
              </SingleAccordion>
            </template>
          </template>
        </SingleAccordion>
      </template>
    </template>
  </Card>
</template>

<style>
.emo-accordion .p-accordioncontent-content {
  @apply bg-slate-900;
}
</style>
