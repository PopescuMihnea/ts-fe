<script lang="ts" setup>
import { EmotionScores } from "../interfaces/EmotionResults.js";
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
  ProgressBar,
  Card,
  ProgressSpinner,
} from "primevue";
import { EmotionResponse } from "@/interfaces/EmotionResponse.js";
import {
  isEmotionResultsEmotionResponse,
  isErrorEmotionResponse,
  isStringEmotionResponse,
  isEmotionScoresEmotionResults,
  isStringEmotionResults,
  isEmotionScoresString,
  isJSONParseable,
} from "@/utils/typeGuards";
import SingleAccordion from "./SingleAccordion.vue";

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
  results: EmotionResponse;
}>();

const getNumberValue = (value: string | number | undefined): number => {
  if (value === undefined) {
    return -1;
  }

  if (typeof value === "string") {
    try {
      return parseInt(value);
    } catch (error) {
      return -1;
    }
  }

  return value;
};

const recoverEmotionScores = (malformedEmotionScores: {
  [key: string]: string | number | undefined;
}): EmotionScores => {
  return {
    anger: getNumberValue(malformedEmotionScores.anger),
    calmness: getNumberValue(malformedEmotionScores.calmness),
    disgust: getNumberValue(malformedEmotionScores.disgust),
    eagerness: getNumberValue(malformedEmotionScores.eagerness),
    fear: getNumberValue(malformedEmotionScores.fear),
    joy: getNumberValue(malformedEmotionScores.joy),
    pleasantness: getNumberValue(malformedEmotionScores.pleasantness),
    sadness: getNumberValue(malformedEmotionScores.sadness),
  };
};

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
    <template #title>Result from {{ props.name }}</template>
    <template
      #content
      v-if="!props.results || Object.keys(props.results).length < 1"
    >
      <div class="flex flex-col items-center">
        <ProgressSpinner class="my-4" />
      </div>
    </template>
    <template v-else #content>
      <Accordion
        v-if="!isStringEmotionResponse(props.results)"
        :value="['0']"
        multiple
      >
        <template v-if="isEmotionResultsEmotionResponse(props.results)">
          <AccordionPanel
            v-for="(result, index) of Object.entries(props.results)"
            class="my-4"
            :key="result[0]"
            :value="result[0]"
          >
            <AccordionHeader>{{
              `Analysis of review#${index}`
            }}</AccordionHeader>
            <AccordionContent>
              <p class="my-2 text-blue-300">
                Name of review returned by API: {{ result[0] }}
              </p>
              <div
                class="flex flex-col"
                v-if="isEmotionScoresEmotionResults(result[1])"
              >
                <div
                  v-for="data of Object.entries(scaledEmotionScores(result[1]))"
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
              </div>
              <div v-else-if="isStringEmotionResults(result[1])">
                <template v-if="isEmotionScoresString(result[1])">
                  <div
                    v-for="data of Object.entries(
                      scaledEmotionScores(JSON.parse(result[1]))
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
                <template v-else>
                  <p class="text-yellow-500">
                    Unfortunately a string response was sent by the llm for this
                    review:
                  </p>
                  <Accordion
                    class="llm-text-review-warn-accordion"
                    :value="['0']"
                  >
                    <AccordionPanel :key="0" :value="0">
                      <AccordionHeader class="bg-yellow-800"
                        ><p class="text-yellow-100 mb-2 mx-4">
                          Llm review response text:
                        </p>
                      </AccordionHeader>
                      <AccordionContent>
                        <p
                          class="mt-2 p-4 text-yellow-500 border-2 border-yellow-800"
                        >
                          {{ result[1] }}
                        </p>
                      </AccordionContent>
                    </AccordionPanel>
                  </Accordion>
                  <div
                    v-if="
                      isJSONParseable(result[1]) &&
                      Object.keys(JSON.parse(result[1])).some((key) =>
                        Object.keys(emotionColors).includes(key)
                      )
                    "
                    class="mt-4"
                  >
                    <Accordion class="recovery-accordion" :value="['0']">
                      <AccordionPanel :key="0" :value="0">
                        <AccordionHeader class="bg-slate-800"
                          ><p class="text-green-300 mb-2">
                            Recoverable data exists:
                          </p>
                        </AccordionHeader>
                        <AccordionContent>
                          <div
                            v-for="data of Object.entries(
                              recoverEmotionScores(JSON.parse(result[1]))
                            )"
                            :key="data[0]"
                            class="flex flex-col"
                          >
                            <p :class="emotionColors[data[0]]">
                              {{
                                `${data[0]}: ${
                                  data[1] > -1
                                    ? trimEmotionScore(data[1])
                                    : "N/A"
                                }`
                              }}
                            </p>
                            <ProgressBar
                              v-if="data[1] >= 0"
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
                          </div></AccordionContent
                        >
                      </AccordionPanel>
                    </Accordion>
                  </div>
                </template>
              </div>
              <div v-else>
                <p class="my-2">
                  <span class="text-yellow-500"
                    >Unfortunately a malformed object was sent by the llm for
                    this review, it has been converted to a string: </span
                  >{{ JSON.stringify(result[1]) }}
                </p>
                <div
                  v-if="
                    Object.keys(result[1]).some((key) =>
                      Object.keys(emotionColors).includes(key)
                    )
                  "
                  class="mt-4"
                >
                  <Accordion class="recovery-accordion" :value="['0']">
                    <AccordionPanel :key="0" :value="0">
                      <AccordionHeader class="bg-slate-800"
                        ><p class="text-green-300 mb-2">
                          Recoverable data exists:
                        </p>
                      </AccordionHeader>
                      <AccordionContent>
                        <div
                          v-for="data of Object.entries(
                            recoverEmotionScores(result[1])
                          )"
                          :key="data[0]"
                          class="flex flex-col"
                        >
                          <p :class="emotionColors[data[0]]">
                            {{
                              `${data[0]}: ${
                                data[1] > -1 ? trimEmotionScore(data[1]) : "N/A"
                              }`
                            }}
                          </p>
                          <ProgressBar
                            v-if="data[1] >= 0"
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
                        </div></AccordionContent
                      >
                    </AccordionPanel>
                  </Accordion>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </template>
        <template v-else-if="isErrorEmotionResponse(props.results)">
          <p class="text-red-500 my-2">Error getting response</p>
          <Accordion class="error-accordion" :value="['0']">
            <AccordionPanel :key="0" :value="0">
              <AccordionHeader class="bg-red-800"
                ><p class="text-red-100 mb-2 mx-4">Error text:</p>
              </AccordionHeader>
              <AccordionContent>
                <p class="mt-2 p-4 text-red-500 border-2 border-red-800">
                  {{ props.results.error }}
                </p>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </template>
      </Accordion>
      <div v-else>
        <p class="text-yellow-500">
          Unfortunately a string response was sent by the llm
        </p>
        <SingleAccordion
          accordion-class="llm-text-reviews-warn-accordion"
          header-class="bg-yellow-800"
        >
          <template v-slot:header>
            <p class="text-yellow-100 mb-2 mx-4">
              Llm reviews response text:
            </p></template
          >
          <template v-slot:content>
            <p class="mt-2 p-4 text-yellow-500 border-2 border-yellow-800">
              {{ props.results }}
            </p>
          </template>
        </SingleAccordion>
      </div>
    </template>
  </Card>
</template>

<style>
.p-progressbar {
  min-height: 25px;
}

.p-progressbar-label {
  @apply text-xl;
}

.recovery-accordion .p-accordioncontent-content {
  @apply bg-slate-800;
}
</style>
