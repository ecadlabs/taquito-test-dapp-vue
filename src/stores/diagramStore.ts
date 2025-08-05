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
	const currentTestId = ref<string | null>(null);

	const setDiagram = (diagram: TestDiagram, testId: string) => {
		resetDiagram();
		currentDiagram.value = diagram;
		currentTestId.value = testId;
	};

	const setProgress = (stepId: string, status: 'running' | 'completed', testId?: string) => {
		if (testId && currentTestId.value !== testId) {
			return;
		}

		// Reset diagram if there was an error - this allows users to retry
		// and should only run when the user interacts with something, since
		// if the diagram has errored, no more progress can be made.
		if (errorMessage.value) {
			resetDiagram();
		}

		if (currentDiagram.value && currentTestId.value) {
			currentStep.value = stepId;
			diagramStatus.value = status;
		}
	};

	const setSuccessful = (testId?: string) => {
		if (testId && currentTestId.value !== testId) {
			return;
		}
		successful.value = true;
	}

	const setErrorMessage = (error: unknown, testId?: string) => {
		if (testId && currentTestId.value !== testId) {
			return;
		}
		errorMessage.value = error;
		diagramStatus.value = 'errored';
	}

	const setOperationHash = (hash: string, testId?: string) => {
		if (testId && currentTestId.value !== testId) {
			return;
		}
		operationHash.value = hash;
	}

	const resetDiagram = () => {
		if (currentDiagram.value) {
			currentDiagram.value = null;
			currentStep.value = null;
			diagramStatus.value = 'idle';
			errorMessage.value = undefined;
			successful.value = false;
			operationHash.value = undefined;
			currentTestId.value = null;
		}
	};

	const cancelCurrentTest = () => {
		if (currentTestId.value) {
			resetDiagram();
		}
	};

	return {
		currentDiagram,
		currentStep,
		diagramStatus,
		errorMessage,
		operationHash,
		currentTestId,
		setDiagram,
		setProgress,
		resetDiagram,
		setSuccessful,
		setErrorMessage,
		setOperationHash,
		cancelCurrentTest,
	};
}); 