<script lang="ts" setup>
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
  Card,
  FloatLabel,
  Checkbox,
  Textarea,
  Button,
} from "primevue";
import * as Yup from "yup";
import { onMounted, Ref, ref } from "vue";
import { useForm } from "vee-validate";
import ResultAccordion from "@/components/ResultAccordion.vue";
import { FormValues } from "@/interfaces/FormValues";
import { EmotionResponse } from "@/interfaces/EmotionResponse";
import { OllamaResponse } from "@/interfaces/OllamaResponse";
import { isEmoResponse, isOllamaResponse } from "@/utils/typeGuards";
import EmoAccordion from "@/components/EmoAccordion.vue";

//Use these if fetch is not working for some reason to showcase front end
const placeholderResults: Ref<{
  [key: string]: EmotionResponse | { [key: string]: EmotionResponse };
}> = ref({
  llm: "lau",
  emo: {
    text_0: {
      BioBert: {
        anger: 0.0387,
        calmness: 0.0,
        disgust: 0.0066,
        eagerness: 0.0005,
        fear: 0.0004,
        joy: 0.0053,
        pleasantness: 0.0001,
        sadness: 0.9483,
      },
    },
    text_1: {
      BioMed: {
        anger: 0.5,
        calmness: 0.0,
        disgust: 0.3,
        eagerness: 0.0005,
        fear: 0.0004,
        joy: 0.0053,
        pleasantness: 0.0001,
        sadness: 0.9483,
      },
    },
  },
  olama: { error: "feafea" },
  tamp: {
    text_3: "geafea",
    text_4: { a: 3, b: "fea", anger: 0.3 },
    text_0: {
      anger: 0.0387,
      calmness: 0.0,
      disgust: 0.0066,
      eagerness: 0.0005,
      fear: 0.0004,
      joy: 0.0053,
      pleasantness: 0.0001,
      sadness: 0.9483,
    },
    text_1: {
      anger: 0.0021,
      calmness: 0.0016,
      disgust: 0.0,
      eagerness: 0.0006,
      fear: 0.9954,
      joy: 0.0001,
      pleasantness: 0.0,
      sadness: 0.0001,
    },
  },
});
const results: Ref<{
  [key: string]: EmotionResponse | { [key: string]: EmotionResponse };
}> = ref({});

const fetchTimeoutSeconds = 5;
const sep = ",";
const defaultUrls = [
  "http://localhost:5000/predict",
  "http://localhost:5001/predict",
  "http://localhost:5000/predictOllama",
];
let urls =
  process.env.VUE_APP_AI_API_URLS != undefined
    ? process.env.VUE_APP_AI_API_URLS.split(sep).map((url) => url.trim())
    : defaultUrls;
const defaultApiNames = ["tamp", "emo", "ollama"];
let apiNames =
  process.env.VUE_APP_AI_API_NAMES != undefined
    ? process.env.VUE_APP_AI_API_NAMES.split(sep).map((apiName) =>
        apiName.trim()
      )
    : defaultApiNames;

console.log("Request urls: ", urls);
const checkEnv = () => {
  if (process.env.VUE_APP_AI_API_URLS == undefined) {
    console.warn(`Env url data undefined, using default: ${defaultUrls}`);
  }

  if (process.env.VUE_APP_AI_API_NAMES == undefined) {
    console.warn(
      `Env api names data undefined, using default: ${defaultApiNames}`
    );
  }

  if (urls.length != apiNames.length) {
    urls = defaultUrls;
    apiNames = defaultApiNames;
    console.warn(
      `Url and api names length mismatch, using default values:\nUrl: ${defaultUrls}\nApi names: ${defaultApiNames}`
    );
  }
};
checkEnv();

const models: string[] = [
  "BioBERT",
  "BioMedRoBERTa",
  "BlueBERT",
  "ClinicalBERT",
  "CODER",
  "SciBERT",
  "ClinicalLongFormer",
];
const majorityVotingModel = "MajorityVoting";
const maxReviews = 5;

const arraySchema = Yup.string()
  .trim()
  .min(1, "You have empty reviews")
  .required("Review is required");
const successfulSubmit = ref(false);

const {
  defineField,
  handleSubmit,
  resetForm,
  validateField,
  errors,
  values,
  isSubmitting,
} = useForm<FormValues>({
  initialValues: {
    requested_models: [],
    sentences: [""],
  },
  validationSchema: Yup.object().shape({
    requested_models: Yup.array()
      .of(Yup.string())
      .required("Requested models not found")
      .min(1, "You have to select at least one requested models"),
    sentences: Yup.array()
      .of(arraySchema)
      .required("Reviews not found")
      .min(1, "You have to send at least one review"),
  }),
});

const lastSentences: Ref<string[]> = ref([]);
const [requested_models] = defineField("requested_models");
const [sentences] = defineField("sentences");

const textAreaErrors = ref([""]);

const validateTextArea = async (index: number) => {
  textAreaErrors.value[index] = "";
  await validateField("sentences");
  try {
    arraySchema.validateSync(values.sentences[index]);
  } catch (error) {
    if (error instanceof Yup.ValidationError)
      textAreaErrors.value[index] = error.message;
  }
};

const validateTextAreas = async () => {
  for (let i = 0; i < values.sentences.length; ++i) {
    await validateTextArea(i);
  }
};

const fetchAsyncApi = async (
  url: string,
  values: FormValues
): Promise<EmotionResponse | OllamaResponse> => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      return {
        error:
          `Api error: ${errorMessage}` ||
          `Api error with only HTTP error status: ${response.status}`,
      };
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching data for url ${url}:`, error);
    return { error: (error as Error).message };
  }
};

const fetchData = async (
  url: string,
  values: FormValues,
  resultsKey: string
) => {
  const data: EmotionResponse | OllamaResponse = await fetchAsyncApi(
    url,
    values
  );

  const response: EmotionResponse = isOllamaResponse(data)
    ? data.results
    : data;

  results.value[resultsKey] = response;
};

const onSubmit = handleSubmit(async (values) => {
  values.requested_models.push(majorityVotingModel);
  //console.log("Submitted with", values);

  lastSentences.value = [...values.sentences];
  setTimeout(() => {
    isVisibleResponse.value = true;
  }, 100);

  resetForm();
  results.value = {};
  for (let apiName of apiNames) {
    results.value[apiName] = {};
  }
  const requests: Promise<void>[] = [];

  for (let i = 0; i < urls.length; ++i) {
    const url = urls[i];
    const apiName = apiNames[i];

    requests.push(fetchData(url, values, apiName));
  }

  successfulSubmit.value = true;
  await Promise.all(requests);
  console.log("Result value", results.value);
});

const addReview = () => {
  sentences.value.push("");
  textAreaErrors.value.push("");
};

const deleteReview = (index: number) => {
  sentences.value.splice(index, 1);
  textAreaErrors.value.splice(index, 1);
};

const isVisible = ref(false);
const isVisibleResponse = ref(false);

const hideOverflowXCssClass = "overflow-x-hide";
document.body.classList.add(hideOverflowXCssClass);
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);

  setTimeout(() => {
    document.body.classList.remove(hideOverflowXCssClass);
  }, 1200);
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center w-[98%] m-2 float-from-right"
    :class="{ visible: isVisible }"
  >
    <h1 class="mb-2 text-3xl">AI Form</h1>
    <form class="w-[82%] min-w-[400px]" novalidate @submit.prevent="onSubmit">
      <Card>
        <template #title>Select models to be used: </template>
        <template #content>
          <div class="flex flex-col items-center">
            <div class="flex flex-wrap justify-center gap-4">
              <div
                v-for="model in models"
                v-bind:key="model"
                class="flex items-center gap-2 ai-model-checkbox"
              >
                <Checkbox
                  v-model="requested_models"
                  name="requested_models"
                  :value="model"
                  :inputId="model"
                />
                <label :for="model"> {{ model }} </label>
              </div>
            </div>
            <small id="requested_models-help" class="text-red-500 my-2">
              {{ errors.requested_models }}
            </small>
          </div>
        </template>
      </Card>
      <h2 class="my-4">Enter your reviews (max: {{ maxReviews }}):</h2>
      <div class="my-6" v-for="(review, index) in sentences" :key="index">
        <FloatLabel>
          <div class="flex items-center">
            <div class="flex flex-col items-center grow">
              <Textarea
                class="w-full"
                v-model="sentences[index]"
                @input="validateTextArea(index)"
                variant="filled"
                rows="5"
                cols="30"
              ></Textarea>
              <label for="over_label">Enter review #{{ index + 1 }}</label>
              <small
                v-if="textAreaErrors[index].length > 1"
                class="text-red-500 my-2"
              >
                {{ textAreaErrors[index] }}
              </small>
            </div>
            <Button
              v-if="sentences.length > 1"
              class="mx-4"
              label="Delete review"
              severity="danger"
              icon="pi pi-trash"
              iconPos="left"
              @click="deleteReview(index)"
            />
          </div>
        </FloatLabel>
      </div>
      <div class="flex flex-col items-center">
        <div class="flex flex-col gap-2 w-[15%] min-w-[135px]">
          <div class="flex flex-col">
            <Button
              :disabled="sentences.length >= maxReviews"
              label="Add review"
              severity="info"
              icon="pi pi-plus"
              iconPos="left"
              @click="addReview"
            />
            <small
              v-if="sentences.length >= maxReviews"
              class="text-yellow-500"
            >
              Too many reviews, delete some of them
            </small>
          </div>
          <Button
            :label="isSubmitting ? 'Submitting...' : 'Submit'"
            :disabled="isSubmitting"
            @click="validateTextAreas"
            type="submit"
            icon="pi
    pi-check"
            iconPos="right"
          />
          <small id="sentences-help" class="text-red-500">
            {{ errors.sentences }}
          </small>
        </div>
      </div>
    </form>
    <template v-if="successfulSubmit">
      <div
        class="w-[80%] min-w-[400px] my-4 fade-in"
        :class="{ visible: isVisibleResponse }"
      >
        <Card>
          <template #title>Last entered reviews: </template>
          <template #content>
            <Accordion class="last-sentences-accordion" multiple :value="['0']">
              <AccordionPanel
                v-for="(lastSentence, index) in lastSentences"
                :key="index"
                :value="lastSentence"
              >
                <AccordionHeader class="bg-slate-600">
                  Review #{{ index }}</AccordionHeader
                >
                <AccordionContent
                  ><p>{{ lastSentence }}</p>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </template>
        </Card>
        <template v-for="result of Object.entries(results)" :key="result[0]">
          <template v-if="isEmoResponse(result[1])">
            <EmoAccordion :name="result[0]" :results="result[1]" />
          </template>
          <template v-else>
            <ResultAccordion :name="result[0]" :results="result[1]" />
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.p-button {
  transition: transform 0.3s ease-in-out;
  transform: scale(1);
}

.p-button:hover {
  transform: scale(1.1);
}

.ai-model-checkbox .p-checkbox {
  transition: transform 0.3s ease-in-out;
  transform: scale(1);
}

.ai-model-checkbox .p-checkbox:hover {
  transform: scale(1.2);
}

.ai-model-checkbox .p-checkbox:has(+ label:hover) {
  transform: scale(1.2);
}

.ai-model-checkbox label:hover {
  cursor: pointer;
}
</style>

<style>
.overflow-x-hide {
  overflow-x: hidden;
}

.float-from-right {
  position: relative;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.8s ease-out, opacity 0.8s ease-out;
}

.float-from-right.visible {
  transform: translateX(0); /* Slide into place */
  opacity: 1; /* Fully visible */
}

.fade-in {
  opacity: 0;
  transition: opacity 0.8s ease-out;
}

.fade-in.visible {
  opacity: 1;
}

.last-sentences-accordion .p-accordioncontent-content {
  @apply bg-slate-600;
}
</style>
