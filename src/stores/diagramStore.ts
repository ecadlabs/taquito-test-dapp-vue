import type { TestDiagram } from "@/modules/tests/test";
import { getTestDiagram } from "@/modules/tests/tests";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import { defineStore } from "pinia";
import { ref, watch, type Component } from "vue";
import { toast } from "vue-sonner";

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
  const feeEstimate = ref<Estimate | null>(null);

  // Timing tracking for each step
  const stepTimings = ref<Map<string, StepTiming>>(new Map());

  // Button state management
  const nodeButtons = ref<
    Map<string, { icon: Component; text: string; onClick: () => void }>
  >(new Map());

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

  const setProgress = async (stepId: string) => {
    if (!currentTestId.value) return;

    // Reset diagram if there was an error - this allows users to retry
    // and should only run when the user interacts with something, since
    // if the diagram has errored, no more progress can be made.
    if (errorMessage.value) {
      errorMessage.value = undefined;
      currentStep.value = stepId;
      diagramStatus.value = "running";
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
      diagramStatus.value = "running";

      // Show toast when waiting for user confirmation in wallet
      if (stepId === "wait-for-user") {
        toast.info("Check your wallet to confirm the operation");
      }
    }
  };

  /** Helper function to mark the current test as completed */
  const setCompleted = async () => {
    if (!currentTestId.value) return;

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

  const setErrorMessage = (error: unknown) => {
    if (!currentTestId.value) {
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

  const setOperationHash = (hash: string | number) => {
    if (!currentTestId.value) {
      return;
    }
    operationHash.value = hash;
  };

  const setFeeEstimate = (estimate: Estimate | null) => {
    feeEstimate.value = estimate;
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

  const resetDiagram = () => {
    if (currentDiagram.value) {
      currentDiagram.value = null;
      currentStep.value = null;
      diagramStatus.value = "idle";
      errorMessage.value = undefined;
      operationHash.value = undefined;
      currentTestId.value = null;
      currentDiagramKey.value = null;
      feeEstimate.value = null;
      stepTimings.value.clear();
      nodeButtons.value.clear();
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

  return {
    currentDiagram,
    currentStep,
    diagramStatus,
    errorMessage,
    operationHash,
    currentTestId,
    currentDiagramKey,
    feeEstimate,
    stepTimings,
    nodeButtons,
    setDiagram,
    setTestDiagram,
    setProgress,
    setCompleted,
    resetDiagram,
    setErrorMessage,
    setOperationHash,
    setFeeEstimate,
    getStepTiming,
    getAllStepTimings,
    removeNodeButton,
    getNodeButton,
    cancelCurrentTest,
  };
});
