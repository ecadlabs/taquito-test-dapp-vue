<template>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div>
            <div class="flex justify-between">
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
        </div>

        <DialogFooter class="flex items-center">
            <div class="text-xs text-muted-foreground">
                <p>
                    Version {{ version }}
                </p>
                <Separator orientation="vertical" class="h-4" />
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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button';
import { availableIndexers, useSettingsStore, type IndexerOption } from '@/stores/settingsStore';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator';

const emit = defineEmits(['close']);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers;

const gitSha = import.meta.env.VITE_GIT_SHA;
const version = import.meta.env.VITE_VERSION;
</script>