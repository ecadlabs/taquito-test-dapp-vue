import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TestDiagram } from '@/modules/tests/test';

export const useDiagramStore = defineStore('diagram', () => {
	const currentDiagram = ref<TestDiagram | null>(null);
	const currentStep = ref<string | null>(null);
	const diagramStatus = ref<'idle' | 'running' | 'completed' | 'errored'>('idle');
	const errorMessage = ref();
	const successful = ref<boolean>(false);
	const operationHash = ref<string>();

	const setDiagram = (diagram: TestDiagram) => {
		currentDiagram.value = diagram;
		diagramStatus.value = 'idle';
		currentStep.value = null
		successful.value = false;
		errorMessage.value = undefined;
	};

	const setProgress = (stepId: string, status: 'running' | 'completed') => {
		// Reset diagram if there was an error - this allows users to retry
		// and should only run when the user interacts with something, since
		// if the diagram has errored, no more progress can be made.
		if (errorMessage.value) {
			resetDiagram();
		}

		if (currentDiagram.value) {
			currentStep.value = stepId;
			diagramStatus.value = status;
		}
	};

	const setSuccessful = () => {
		successful.value = true;
	}

	const setErrorMessage = (error: unknown) => {
		errorMessage.value = error;
		diagramStatus.value = 'errored'
	}

	const setOperationHash = (hash: string) => {
		operationHash.value = hash;
	}

	const resetDiagram = () => {
		if (currentDiagram.value) {
			diagramStatus.value = 'idle';
			currentStep.value = null;
			errorMessage.value = undefined;
			successful.value = false;
		}
	};

	return {
		currentDiagram,
		currentStep,
		diagramStatus,
		errorMessage,
		operationHash,
		setDiagram,
		setProgress,
		resetDiagram,
		setSuccessful,
		setErrorMessage,
		setOperationHash,
	};
}); 