<template>
  <div class="flex w-full flex-col items-center justify-center gap-6">
    <!-- Event Subscription Controls -->
    <div class="flex flex-col items-center gap-1">
      <div class="flex gap-2">
        <Button
          @click="subscribeToAllEvents()"
          :disabled="!walletConnected || isOperationRunning"
          aria-label="Subscribe to All Events"
          data-testid="subscribe-to-all-events"
        >
          <Radio class="size-4" aria-hidden="true" />
          Subscribe
        </Button>
        <Button
          @click="handleUnsubscribe()"
          :disabled="!walletConnected || isOperationRunning"
          aria-label="Unsubscribe from Events"
          data-testid="unsubscribe-from-events"
          variant="destructive"
        >
          <X class="size-4" aria-hidden="true" />
          Unsubscribe
        </Button>
      </div>

      <div class="flex items-center gap-2 text-sm">
        <div
          class="size-2 rounded-full"
          :class="subscriptionStatus ? 'bg-green-500' : 'bg-gray-400'"
        ></div>
        <span class="text-muted-foreground">
          {{ subscriptionStatus ? "Subscribed to events" : "Not subscribed" }}
        </span>
      </div>
    </div>

    <div class="flex flex-col items-center gap-1">
      <Button
        @click="handleEmitEvent()"
        :disabled="!walletConnected || isOperationRunning"
        aria-label="Emit Event"
        data-testid="emit-event-button"
      >
        <Zap class="size-4" aria-hidden="true" />
        Emit Interaction Event
      </Button>
      <p class="text-muted-foreground text-xs">
        Calls a method on the contract that does nothing but emit an event
      </p>
    </div>
    <!-- Event Schema Display -->
    <div class="flex flex-col items-center gap-2">
      <Button
        variant="outline"
        @click="handleGetEventSchema()"
        :disabled="!walletConnected || isOperationRunning"
        aria-label="Get Event Schema"
      >
        <Info class="size-4" aria-hidden="true" />
        Get Event Schema
      </Button>
    </div>

    <!-- Event Schema Display -->
    <div v-if="showSchema && eventSchema" class="w-full max-w-4xl">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Event Schema</h3>
        <Button
          @click="showSchema = false"
          variant="outline"
          size="sm"
          aria-label="Hide Event Schema"
        >
          <X class="size-4" aria-hidden="true" />
          Hide
        </Button>
      </div>
      <div class="bg-muted rounded border p-4">
        <pre class="overflow-x-auto text-xs">{{
          JSON.stringify(eventSchema, null, 2)
        }}</pre>
      </div>
    </div>

    <!-- Event Log Display -->
    <div class="w-full max-w-4xl">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Event Log</h3>
        <div class="text-foreground text-xs">
          <button
            @click="showRawJson = !showRawJson"
            class="rounded-l-sm border-y border-l px-1 py-0.5 hover:cursor-pointer"
            :class="{ 'bg-primary/40 text-primary-foreground': !showRawJson }"
          >
            Formatted
          </button>
          <button
            @click="showRawJson = !showRawJson"
            class="rounded-r-sm border-y border-r px-1 py-0.5 hover:cursor-pointer"
            :class="{ 'bg-primary/40 text-primary-foreground': showRawJson }"
          >
            Raw JSON
          </button>
        </div>
      </div>
      <div class="bg-muted max-h-96 overflow-y-auto rounded border p-4">
        <div
          v-if="eventLog.length === 0"
          class="text-muted-foreground flex w-full flex-col items-center py-4 text-sm"
        >
          <Bird class="size-6" />
          <p class="text-muted-foreground font-medium">
            No Events Received Yet
          </p>
        </div>
        <div
          v-for="(event, index) in eventLog"
          :key="index"
          class="bg-background mb-3 rounded border p-3 text-sm"
        >
          <div class="mb-2 font-medium">
            Event {{ eventLog.length - index }}
          </div>

          <div v-if="showRawJson" class="text-xs">
            <pre class="bg-muted overflow-x-auto rounded p-2 text-xs">{{
              JSON.stringify(event, null, 2)
            }}</pre>
          </div>

          <div v-else class="space-y-1">
            <div v-if="event.opHash" class="text-xs">
              <span class="text-muted-foreground font-medium">OpHash:</span>
              <code class="bg-muted rounded px-1">{{ event.opHash }}</code>
            </div>
            <div v-if="event.blockHash" class="text-xs">
              <span class="text-muted-foreground font-medium">Block Hash:</span>
              <code class="bg-muted rounded px-1">{{ event.blockHash }}</code>
            </div>
            <div v-if="event.level" class="text-xs">
              <span class="text-muted-foreground font-medium">Level:</span>
              {{ event.level }}
            </div>
            <div v-if="event.tag" class="text-xs">
              <span class="text-muted-foreground font-medium">Tag:</span>
              <code class="bg-muted rounded px-1">{{ event.tag }}</code>
            </div>
            <div v-if="event.payload" class="text-xs">
              <span class="text-muted-foreground font-medium">Payload:</span>
              <pre class="bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">{{
                JSON.stringify(event.payload, null, 2)
              }}</pre>
            </div>
            <div v-if="event.timestamp" class="text-xs">
              <span class="text-muted-foreground font-medium">Timestamp:</span>
              {{ new Date(event.timestamp).toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import {
  emitEvent,
  getEventSchema,
  getSubscriptionStatus,
  setEventCallback,
  subscribeToEvents,
  unsubscribeFromEvents,
} from "@/modules/tests/tests/contract-events/contract-events";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Bird, Info, Radio, X, Zap } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

interface ContractEvent {
  opHash?: string;
  blockHash?: string;
  level?: number;
  tag?: string;
  payload?: unknown;
  timestamp?: string;
}

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);

const isOperationRunning = computed(
  () => diagramStore.diagramStatus === "running",
);

const eventLog = ref<Array<ContractEvent>>([]);
const showRawJson = ref(false);
const eventSchema = ref<unknown>(null);
const showSchema = ref(false);
const subscriptionStatus = ref(false);

onMounted(() => {
  diagramStore.setTestDiagram("contract-events", "emit-event");

  // Set up the event callback to receive events
  setEventCallback((event: ContractEvent) => {
    addEventToLog(event);
  });
});

const subscribeToAllEvents = async () => {
  try {
    await subscribeToEvents();
    subscriptionStatus.value = getSubscriptionStatus();
  } catch (error) {
    console.error("Error subscribing to all events:", error);
  }
};

const handleEmitEvent = async () => {
  try {
    await emitEvent();
  } catch (error) {
    console.error("Error emitting event:", error);
  }
};

const handleUnsubscribe = async () => {
  try {
    unsubscribeFromEvents();
    subscriptionStatus.value = getSubscriptionStatus();
  } catch (error) {
    console.error("Error unsubscribing from events:", error);
  }
};

const handleGetEventSchema = async () => {
  try {
    const schema = await getEventSchema();
    eventSchema.value = schema;
    showSchema.value = true;
  } catch (error) {
    console.error("Error getting event schema:", error);
  }
};

const addEventToLog = (event: ContractEvent) => {
  eventLog.value.unshift(event);
  // Keep only the last 20 events to prevent the log from getting too long
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20);
  }
};
</script>
