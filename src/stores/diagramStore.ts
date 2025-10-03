import type { TestDiagram } from "@/modules/tests/test";
import { getTestDiagram } from "@/modules/tests/tests";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import { defineStore } from "pinia";
import { ref, watch, type Component } from "vue";

export interface DialogContent {
  title: string;
  description?: string;
  content: string; // HTML string
}

export interface StepTiming {
  startTime: DOMHighResTimeStamp;
  endTime?: DOMHighResTimeStamp;
  duration?: number;
}

export const useDiagramStore = defineStore("diagram", () => {
  const currentDiagram = ref<TestDiagram | null>(null);
  const currentStep = ref<string | null>(null);
  const diagramStatus = ref<"idle" | "running" | "completed" | "errored">(
    "idle",
  );
  const errorMessage = ref();
  const operationHash = ref<string | number>();
  const currentTestId = ref<string | null>(null);
  const currentDiagramKey = ref<string | null>(null);

  // Timing tracking for each step
  const stepTimings = ref<Map<string, StepTiming>>(new Map());

  // Button state management
  const nodeButtons = ref<
    Map<string, { icon: Component; text: string; onClick: () => void }>
  >(new Map());

  // Dialog state management
  const showDialog = ref<boolean>(false);
  const dialogContent = ref<DialogContent | null>(null);

  const setDiagram = (
    diagram: TestDiagram,
    testId: string,
    diagramKey?: string,
  ) => {
    resetDiagram();
    currentDiagram.value = diagram;
    currentTestId.value = testId;
    currentDiagramKey.value = diagramKey || null;
  };

  /**
   * Helper function to set the diagram for a specific test and operation
   *
   * @param testId - The test ID
   * @param diagramKey - Optional diagram key for multi-diagram tests
   */
  const setTestDiagram = (testId: string, diagramKey?: string) => {
    const diagram = getTestDiagram(testId, diagramKey);
    if (diagram) {
      diagram.nodes.forEach((node) => {
        removeNodeButton(node.id);
      });
      setDiagram(diagram, testId, diagramKey);
    }
  };

  const setProgress = async (
    stepId: string,
    status: "running" | "completed",
    testId?: string,
  ) => {
    if (testId && currentTestId.value !== testId) return;

    // Reset diagram if there was an error - this allows users to retry
    // and should only run when the user interacts with something, since
    // if the diagram has errored, no more progress can be made.
    if (errorMessage.value) {
      errorMessage.value = undefined;
      currentStep.value = stepId;
      diagramStatus.value = status;
    }

    if (currentDiagram.value && currentTestId.value) {
      if (currentStep.value && currentStep.value !== stepId) {
        const prevTiming = stepTimings.value.get(currentStep.value);
        if (prevTiming?.startTime && !prevTiming.endTime) {
          prevTiming.endTime = performance.now();
          prevTiming.duration = prevTiming.endTime - prevTiming.startTime;
        }
      }
      stepTimings.value.set(stepId, { startTime: performance.now() });

      currentStep.value = stepId;
      diagramStatus.value = status;

      if (status === "completed") {
        await useWalletStore().fetchBalance();
      }
    }
  };

  /**
   * Helper function to mark the current test as completed
   *
   * @param testId - The test ID to mark as completed
   */
  const setCompleted = async (testId?: string) => {
    if (testId && currentTestId.value !== testId) return;

    // Mark the current step as completed (timing-wise) if it exists
    if (currentStep.value && currentStep.value !== "success") {
      const timing = stepTimings.value.get(currentStep.value);
      if (timing?.startTime && !timing.endTime) {
        timing.endTime = performance.now();
        timing.duration = timing.endTime - timing.startTime;
      }
    }

    // Set current step to "success" to highlight the success node in the diagram
    stepTimings.value.set("success", { startTime: performance.now() });
    currentStep.value = "success";

    // Set diagram status to completed
    diagramStatus.value = "completed";

    await useWalletStore().fetchBalance();
  };

  const setErrorMessage = (error: unknown, testId?: string) => {
    if (testId && currentTestId.value !== testId) {
      return;
    }

    // Track timing for the current step when it errors
    if (currentStep.value) {
      const timing = stepTimings.value.get(currentStep.value);
      if (timing) {
        timing.endTime = performance.now();
        timing.duration = timing.endTime - timing.startTime;
      }
    }

    errorMessage.value = error;
    diagramStatus.value = "errored";
  };

  const setOperationHash = (hash: string | number, testId?: string) => {
    if (testId && currentTestId.value !== testId) {
      return;
    }
    operationHash.value = hash;
  };

  /**
   * Get timing information for a specific step
   *
   * @param stepId - The step ID to get timing for
   * @returns StepTiming object or undefined if not found
   */
  const getStepTiming = (stepId: string): StepTiming | undefined => {
    return stepTimings.value.get(stepId);
  };

  /**
   * Get all step timings for the current diagram
   *
   * @returns Map of step ID to timing information
   */
  const getAllStepTimings = (): Map<string, StepTiming> => {
    return stepTimings.value;
  };

  /**
   * Set a button for a specific node
   *
   * @param nodeId - The node ID to add the button to
   * @param button - The button configuration
   */
  const setNodeButton = (
    nodeId: string,
    button: { icon: Component; text: string; onClick: () => void },
  ) => {
    nodeButtons.value.set(nodeId, button);
  };

  /**
   * Remove a button from a specific node
   *
   * @param nodeId - The node ID to remove the button from
   */
  const removeNodeButton = (nodeId: string) => {
    nodeButtons.value.delete(nodeId);
  };

  /**
   * Get a button for a specific node
   *
   * @param nodeId - The node ID to get the button for
   */
  const getNodeButton = (nodeId: string) => {
    return nodeButtons.value.get(nodeId);
  };

  /**
   * Show a dialog with custom content
   *
   * @param content - The dialog content configuration
   */
  const openDialog = (content: DialogContent) => {
    dialogContent.value = content;
    showDialog.value = true;
  };

  /** Hide the dialog */
  const closeDialog = () => {
    showDialog.value = false;
    dialogContent.value = null;
  };

  const resetDiagram = () => {
    if (currentDiagram.value) {
      currentDiagram.value = null;
      currentStep.value = null;
      diagramStatus.value = "idle";
      errorMessage.value = undefined;
      operationHash.value = undefined;
      currentTestId.value = null;
      currentDiagramKey.value = null;
      stepTimings.value.clear();
      nodeButtons.value.clear();
      showDialog.value = false;
      dialogContent.value = null;
    }
  };

  const cancelCurrentTest = () => {
    if (currentTestId.value) {
      resetDiagram();
    }
  };

  watch(
    () => useWalletStore().getWallet,
    (newWallet, oldWallet) => {
      if (
        oldWallet &&
        !newWallet &&
        currentTestId.value &&
        diagramStatus.value === "running"
      ) {
        window.location.reload();
      }
    },
  );

  const showFeeEstimationDialog = (estimate: Estimate) => {
    const dialogContent = {
      title: "Transaction Fee Estimate",
      description:
        "Transaction fee estimate breakdown for the current operation.",
      content: `
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="font-medium">Burn Fee:</span>
							<span>${estimate.burnFeeMutez} mutez</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Gas Limit:</span>
							<span>${estimate.gasLimit}</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Minimal Fee:</span>
							<span>${estimate.minimalFeeMutez} mutez</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Storage Limit:</span>
							<span>${estimate.storageLimit}</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Suggested Fee:</span>
							<span>${estimate.suggestedFeeMutez} mutez</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Total Cost:</span>
							<span>${estimate.totalCost} mutez</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Using Base Fee:</span>
							<span>${estimate.usingBaseFeeMutez} mutez</span>
						</div>
					</div>
				`,
    };

    openDialog(dialogContent);
  };

  return {
    currentDiagram,
    currentStep,
    diagramStatus,
    errorMessage,
    operationHash,
    currentTestId,
    currentDiagramKey,
    stepTimings,
    nodeButtons,
    showDialog,
    dialogContent,
    setDiagram,
    setTestDiagram,
    setProgress,
    setCompleted,
    resetDiagram,
    setErrorMessage,
    setOperationHash,
    getStepTiming,
    getAllStepTimings,
    setNodeButton,
    removeNodeButton,
    getNodeButton,
    openDialog,
    closeDialog,
    cancelCurrentTest,
    showFeeEstimationDialog,
  };
});
