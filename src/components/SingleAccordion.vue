<script lang="ts" setup>
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from "primevue";

const props = defineProps<{
  headerClass?: string;
  contentClass?: string;
  accordionClass?: string;
}>();
</script>

<template>
  <Accordion :class="props.accordionClass" :value="['0']">
    <AccordionPanel :key="0" :value="0">
      <AccordionHeader :class="props.headerClass"
        ><slot name="header"></slot>
      </AccordionHeader>
      <AccordionContent :class="props.contentClass">
        <slot name="content"></slot>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>
