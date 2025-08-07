<template>
    <Dialog :open="diagramStore.showDialog" @update:open="diagramStore.closeDialog">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ diagramStore.dialogContent?.title }}</DialogTitle>
                <DialogDescription v-if="diagramStore.dialogContent?.description">
                    {{ diagramStore.dialogContent.description }}
                </DialogDescription>
            </DialogHeader>

            <div class="text-sm">
                <!-- Render string content -->
                <div v-if="typeof diagramStore.dialogContent?.content === 'string'"
                    v-html="diagramStore.dialogContent.content" />

                <!-- Render component content -->
                <component v-else-if="typeof diagramStore.dialogContent?.content === 'function'"
                    :is="diagramStore.dialogContent.content()" />
            </div>

            <DialogFooter>
                <Button variant="secondary" @click="diagramStore.closeDialog">
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { useDiagramStore } from '@/stores/diagramStore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const diagramStore = useDiagramStore();
</script>