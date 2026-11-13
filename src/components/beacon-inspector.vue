<template>
  <aside
    v-if="inspector.isOpen"
    aria-label="Beacon inspector"
    class="bg-background fixed inset-x-0 bottom-0 z-40 flex h-(--beacon-inspector-height) flex-col border-t shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
  >
    <header
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1.5"
    >
      <div class="flex items-center gap-2">
        <Radar class="text-muted-foreground size-4" aria-hidden="true" />
        <h2 class="text-sm font-semibold">Beacon Inspector</h2>
        <Badge variant="secondary">{{ inspector.entries.length }}</Badge>
        <span
          v-if="inspector.evictedCount > 0"
          class="text-muted-foreground text-xs"
        >
          {{ inspector.evictedCount }} older dropped
        </span>
      </div>

      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter timeline"
      >
        <button
          v-for="lane in lanes"
          :key="lane.id"
          type="button"
          class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-opacity"
          :class="visibleLanes.has(lane.id) ? 'opacity-100' : 'opacity-40'"
          :aria-pressed="visibleLanes.has(lane.id)"
          @click="toggleLane(lane.id)"
        >
          <span class="size-2 rounded-full" :class="lane.dot" />
          {{ lane.label }}
        </button>
        <button
          v-if="requestFilter"
          type="button"
          class="bg-secondary flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs"
          :aria-label="`Stop filtering by request ${requestFilter}`"
          @click="requestFilter = undefined"
        >
          request {{ shortId(requestFilter) }}
          <X class="size-3" aria-hidden="true" />
        </button>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          aria-label="Beacon debug logs"
          title="Beacon debug mode: record debug and log lines here, and print them to the console"
          :aria-pressed="inspector.debugLogs"
          :class="inspector.debugLogs ? 'bg-accent text-accent-foreground' : ''"
          @click="inspector.setDebugLogs(!inspector.debugLogs)"
        >
          <Bug class="size-4" aria-hidden="true" />
          Debug
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Copy visible entries"
          title="Copy the entries shown below as JSON Lines"
          :disabled="visibleEntries.length === 0"
          @click="copyTimeline"
        >
          <Copy class="size-4" aria-hidden="true" />
          {{ copiedTimeline ? "Copied" : "Copy" }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="inspector.entries.length === 0"
          @click="exportTimeline"
        >
          <Download class="size-4" aria-hidden="true" />
          Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="inspector.entries.length === 0"
          @click="clearTimeline"
        >
          <Trash2 class="size-4" aria-hidden="true" />
          Clear
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Close Beacon inspector"
          @click="inspector.close()"
        >
          <X class="size-5" aria-hidden="true" />
        </Button>
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1"
      :class="selectedEntry ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''"
    >
      <div class="flex min-h-0 flex-col">
        <section
          v-if="inspector.pendingRequests.length > 0"
          aria-label="Requests in flight"
          class="border-b px-4 py-2"
        >
          <h3 class="text-muted-foreground mb-1 text-xs font-medium uppercase">
            In flight
          </h3>
          <ul class="space-y-1 text-xs">
            <li
              v-for="pending in inspector.pendingRequests"
              :key="pending.id"
              class="flex items-center gap-2"
            >
              <button
                type="button"
                class="font-mono underline-offset-2 hover:underline"
                @click="requestFilter = pending.id"
              >
                {{ shortId(pending.id) }}
              </button>
              <span>{{ pending.type }}</span>
              <span class="text-muted-foreground">
                via {{ pending.transport }}
              </span>
              <span class="text-muted-foreground">
                {{ ackLabel(pending.acknowledged) }}
              </span>
              <span class="text-muted-foreground ml-auto tabular-nums">
                {{ secondsSince(pending.sentAt) }}s
              </span>
            </li>
          </ul>
        </section>

        <div ref="timeline" class="min-h-0 flex-1 overflow-y-auto">
          <p
            v-if="visibleEntries.length === 0"
            class="text-muted-foreground p-6 text-center text-sm"
          >
            {{
              inspector.entries.length === 0
                ? "No Beacon activity yet"
                : "No entries match the current filter"
            }}
          </p>
          <ol v-else class="divide-y text-xs">
            <li
              v-for="entry in visibleEntries"
              :key="entry.seq"
              :class="entry.seq === selectedSeq ? 'bg-accent' : ''"
            >
              <button
                type="button"
                class="hover:bg-accent/60 grid w-full grid-cols-[auto_auto_minmax(0,14rem)_1fr] items-baseline gap-x-3 px-4 py-1 text-left"
                :aria-expanded="entry.seq === selectedSeq"
                @click="toggleSelected(entry.seq)"
              >
                <span class="text-muted-foreground font-mono tabular-nums">
                  {{ formatTime(entry.ts) }}
                </span>
                <span
                  class="size-2 self-center rounded-full"
                  :class="laneDot(entry.lane)"
                  :title="entry.lane"
                />
                <span class="truncate font-mono font-medium">
                  {{ entry.kind }}
                  <span
                    v-if="entry.requestId"
                    class="text-muted-foreground font-normal"
                  >
                    #{{ shortId(entry.requestId) }}
                  </span>
                </span>
                <span class="text-muted-foreground truncate">
                  {{ entry.summary }}
                </span>
              </button>
            </li>
          </ol>
        </div>
      </div>

      <section
        v-if="selectedEntry"
        aria-label="Entry details"
        class="flex min-h-0 flex-col border-t md:border-t-0 md:border-l"
      >
        <div class="flex items-center gap-2 px-4 py-1.5 text-xs">
          <span class="font-mono font-medium">{{ selectedEntry.kind }}</span>
          <Button
            v-if="selectedEntry.requestId"
            size="sm"
            variant="outline"
            @click="requestFilter = selectedEntry.requestId"
          >
            Show request
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="ml-auto"
            @click="copyPayload(selectedEntry)"
          >
            <Copy class="size-4" aria-hidden="true" />
            {{ copied ? "Copied" : "Copy" }}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Close entry details"
            @click="selectedSeq = undefined"
          >
            <X class="size-4" aria-hidden="true" />
          </Button>
        </div>
        <pre
          class="bg-muted/50 min-h-0 flex-1 overflow-auto px-4 py-2 font-mono text-xs"
          >{{ JSON.stringify(selectedEntry.payload, null, 2) }}</pre>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toJsonl } from "@/lib/inspector/jsonSafe";
import type { InspectorEntry, InspectorLane } from "@/lib/inspector/types";
import { useBeaconInspectorStore } from "@/stores/inspectorStore";
import { useNow } from "@vueuse/core";
import { Bug, Copy, Download, Radar, Trash2, X } from "lucide-vue-next";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

const inspector = useBeaconInspectorStore();

const lanes: { id: InspectorLane; label: string; dot: string }[] = [
  { id: "event", label: "Events", dot: "bg-sky-500" },
  { id: "message", label: "Messages", dot: "bg-violet-500" },
  { id: "connection", label: "Connection", dot: "bg-amber-500" },
  { id: "log", label: "SDK logs", dot: "bg-emerald-500" },
];
const laneDot = (lane: InspectorLane): string =>
  lanes.find((candidate) => candidate.id === lane)?.dot ?? "bg-muted";

const visibleLanes = ref(new Set<InspectorLane>(lanes.map((lane) => lane.id)));
const toggleLane = (lane: InspectorLane) => {
  const next = new Set(visibleLanes.value);
  if (next.has(lane)) next.delete(lane);
  else next.add(lane);
  visibleLanes.value = next;
};

const requestFilter = ref<string>();
const visibleEntries = computed(() =>
  inspector.entries.filter(
    (entry) =>
      visibleLanes.value.has(entry.lane) &&
      (requestFilter.value === undefined ||
        entry.requestId === requestFilter.value),
  ),
);

const selectedSeq = ref<number>();
const selectedEntry = computed(() =>
  inspector.entries.find((entry) => entry.seq === selectedSeq.value),
);
const toggleSelected = (seq: number) => {
  selectedSeq.value = selectedSeq.value === seq ? undefined : seq;
};

const clearTimeline = () => {
  inspector.clear();
  selectedSeq.value = undefined;
  requestFilter.value = undefined;
};

// Follow new entries while the timeline is scrolled to the bottom, like a
// console; leave the position alone when the user has scrolled up to read.
const timeline = useTemplateRef<HTMLElement>("timeline");
watch(
  () => visibleEntries.value.length,
  async () => {
    const element = timeline.value;
    if (!element) return;
    const atBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    if (!atBottom) return;
    await nextTick();
    element.scrollTop = element.scrollHeight;
  },
);

// Reflect the open state on <html> so style.css can make room for the dock,
// and start at the newest entry whenever the drawer opens.
watch(
  () => inspector.isOpen,
  (open) => {
    document.documentElement.dataset.beaconInspector = open ? "open" : "closed";
    if (open && timeline.value) {
      timeline.value.scrollTop = timeline.value.scrollHeight;
    }
  },
  { immediate: true, flush: "post" },
);

const now = useNow({ interval: 1000 });
const secondsSince = (ts: number) =>
  Math.max(0, Math.round((now.value.getTime() - ts) / 1000));

const ackLabel = (acknowledged: boolean | undefined) => {
  if (acknowledged === undefined) return "ack n/a";
  return acknowledged ? "acknowledged" : "awaiting ack";
};

const shortId = (id: string) => (id.length > 10 ? `${id.slice(0, 8)}…` : id);

const pad = (value: number, width = 2) => String(value).padStart(width, "0");
const formatTime = (ts: number) => {
  const date = new Date(ts);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
};

const exportTimeline = () => {
  const blob = new Blob([toJsonl(inspector.entries)], {
    type: "application/x-ndjson",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `beacon-inspector-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
  link.click();
  // Firefox can drop the download if the URL is revoked in the same task.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Each copy button gets its own "Copied" flag so the label flips only on the
// button that was clicked.
const useCopyFeedback = () => {
  const done = ref(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    done.value = true;
    setTimeout(() => {
      done.value = false;
    }, 1500);
  };
  return { done, copy };
};

const { done: copiedTimeline, copy: copyTimelineText } = useCopyFeedback();
const copyTimeline = () => copyTimelineText(toJsonl(visibleEntries.value));

const { done: copied, copy: copyEntryText } = useCopyFeedback();
const copyPayload = (entry: InspectorEntry) =>
  copyEntryText(JSON.stringify(entry, null, 2));
</script>
