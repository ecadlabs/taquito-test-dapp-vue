<template>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div>
            <p>Settings Content</p>
        </div>

        <DialogFooter>
            <Button variant="secondary" @click="save()">
                <p>Save</p>
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

const save = () => {
    //
}
</script>