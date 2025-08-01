import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TestDiagram } from '@/modules/tests/test';

export const useDiagramStore = defineStore('diagram', () => {
	const currentDiagram = ref<TestDiagram | null>(null);
	const currentStep = ref<string | null>(null);
	const diagramStatus = ref<'idle' | 'running' | 'completed'>('idle');
	const errored = ref<boolean>(false);
	const successful = ref<boolean>(false);

	const setDiagram = (diagram: TestDiagram) => {
		currentDiagram.value = diagram;
		diagramStatus.value = 'idle';
		currentStep.value = null;
		errored.value = false;
		successful.value = false;
	};

	const setProgress = (stepId: string, status: 'running' | 'completed') => {
		// Reset diagram if there was an error - this allows users to retry
		// and should only run when the user interacts with something, since
		// if the diagram has errored, no more progress can be made.
		if (errored.value) {
			resetDiagram();
		}

		if (currentDiagram.value) {
			currentStep.value = stepId;
			diagramStatus.value = status;
		}
	};

	const setErrored = () => {
		errored.value = true;
	};

	const setSuccessful = () => {
		successful.value = true;
	}

	const resetDiagram = () => {
		if (currentDiagram.value) {
			diagramStatus.value = 'idle';
			currentStep.value = null;
			errored.value = false;
			successful.value = false;
		}
	};

	return {
		currentDiagram,
		currentStep,
		diagramStatus,
		errored,
		setDiagram,
		setProgress,
		setErrored,
		resetDiagram,
		setSuccessful,
	};
}); 