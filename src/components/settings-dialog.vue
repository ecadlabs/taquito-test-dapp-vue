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

        <DialogFooter>
            <Button variant="secondary" @click="emit('close')">
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

const emit = defineEmits(['close']);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers;
</script>