<template>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>

    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <p>Indexer</p>
        <Select v-model="settingsStore.settings.indexer">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select an indexer" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="indexer in indexers" :value="indexer">
                {{ indexer.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1 justify-end">
        <div class="flex justify-between items-center">
          <p>RPC URL</p>
          <Input
            v-model="settingsStore.settings.rpcUrl"
            type="text"
            placeholder="RPC URL"
            class="w-2/3"
          />
        </div>
        <div
          v-if="settingsStore.isUsingCustomRpcUrl"
          class="ml-auto flex items-center gap-1"
        >
          <TriangleAlert class="size-3 text-red-500" />
          <p class="text-xs text-muted-foreground">Using custom RPC URL</p>
        </div>
      </div>
    </div>

    <DialogFooter class="flex items-center">
      <div class="text-xs text-muted-foreground">
        <p>Version {{ version }}</p>
        <Separator orientation="vertical" class="h-4" />
        <p>Network: {{ network }}</p>
        <p>Git SHA: {{ gitSha }}</p>
      </div>
      <Button variant="secondary" @click="emit('close')" class="ml-auto">
        <p>Close</p>
      </Button>
    </DialogFooter>
  </DialogContent>
</template>

<script setup lang="ts">
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  availableIndexers,
  useSettingsStore,
  type IndexerOption,
} from "@/stores/settingsStore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TriangleAlert } from "lucide-vue-next";

const emit = defineEmits(["close"]);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers;

const gitSha = import.meta.env.VITE_GITHUB_SHA;
const version = import.meta.env.VITE_VERSION;
const network = import.meta.env.VITE_NETWORK_TYPE;
</script>
