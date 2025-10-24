# Contributing Guide

## 🚀 Creating a New Test

Looking to add a new test to the test dapp? You're in the right place. Tests in this project are end-to-end tests that interact with Tezos blockchain operations through a visual interface.

### 📋 Test Structure Overview

Each test consists of:

1. **Playwright Test** (`tests/[test-name].spec.ts`) - E2E test specification
2. **Vue Component** (`src/modules/tests/tests/[test-name]/[test-name].vue`) - UI implementation
3. **Logic** (`src/modules/tests/tests/[test-name]/[test-name].ts`) - Logic and blockchain interactions
4. **Smart Contract** (optional) (`src/contracts/uncompiled/[contract-name].jsligo`) - Contract source

### 🛠️ Step-by-Step Guide

#### 1. Create the Test Module Structure

Create a new directory under `src/modules/tests/tests/`:

```bash
mkdir -p src/modules/tests/tests/my-new-test
```

#### 2. Register the Test

Add your test to the main registry **first** so it appears in the UI. Update `src/modules/tests/tests.ts`:

```typescript
export const AvailableTests: Record<string, TestMetadata> = {
  // ... existing tests
  "my-new-test": {
    id: "my-new-test",
    title: "My New Test",
    description: `This is my description for my new test.

    It's plaintext, but supports new lines.`,
    // There's no set list of categories, but try to group your test into one of the existing ones if possible
    category: "Smart Contracts",
    setup: [
      "Here's the first step for a developer wanting to use the concepts from this test in their own project.",
      "And the second",
      "And the third!",
    ],
    relatedTests: [
      "transfer",
      "estimate-fees",
      "transaction-limit",
      "increase-paid-storage",
    ],
    documentation: {
      contract: [
        {
          name: "My Cool Smart Contract",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/my-smart-contract.jsligo",
        },
      ],
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/my-new-test",
      taquitoDocumentation: "https://taquito.io/docs/smartcontracts",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/accounts.html#smart-contracts",
    },
    // We use dynamic imports to reduce the bundle size
    component: () =>
      import("@/modules/tests/tests/my-new-test/my-new-test.vue"),
    diagrams: {
      // You can have multiple diagrams if your test has different operations
      // These can be anything you want, but keep them short (a few words at most)
      // Later, we'll use the diagram helpers to set the current step of the diagram to one of these ID's
      do-a-thing: {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "execute-operation",
            label: "Execute Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
    },
  },
};
```

**Don't Forget**: Define your diagram steps when registering - these control the visual flow users see and are key to the application!

#### 3. Add Smart Contract (optional)

If your test requires a new contract:

1. Create `src/contracts/uncompiled/your-contract.jsligo`
2. Implement the contract using JSLIGO syntax
3. Compile the contract: `npm run compile-contracts`
4. Deploy the contract: `npm run originate`

When the test dapp is deployed, the compilation and origination is handled automatically.

Originated contracts have their details saved to `src/contracts/contract-config.json`

#### 4. Implement the Logic (`[test-name].ts`)

Create the core functionality that interacts with Taquito:

```typescript
import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";
import type { Estimate } from "@taquito/taquito";

// This can be used to get the address of a contract from the `contract-config.json` file that we created via origination earlier
const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "your-contract",
  )?.address ?? "";

/**
 * Main test function description
 *
 * @param param - Parameter description
 * @returns Promise<void>
 */
export const mainTestFunction = async (param: string): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  // Tell the diagram store which diagram we're using
  // IMPORTANT: You should set a default diagram in the vue component onMounted hook later
  diagramStore.setTestDiagram("my-test-name", "my-diagram");

  // Always surround your test logic in a try/catch
  try {
    // Update diagram progress as you go using the ID of the step.
    // Do this before running each actual logic step (so time tracking is accurate)
    diagramStore.setProgress("get-contract");
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("execute-contract");
    const operation = await contract.methodsObject.yourMethod(param).send();

    diagramStore.setProgress("wait-for-confirmation");
    await operation.confirmation(settingsStore.getConfirmationCount.value);

    diagramStore.setCompleted();
  } catch (error) {
    // If something goes wrong, log the error but also ensure you display it to the user in the diagram
    console.error("Error:", error);
    diagramStore.setErrorMessage(error);
  }
};
```

**Key Patterns:**

- Use `diagramStore.setTestDiagram()` to initialize the visual flow
- Use `diagramStore.setProgress()` to update step status
- Handle errors with `diagramStore.setErrorMessage()`
- Always use proper TypeScript types, never use `any`
- Please JSDoc your functions with descriptions and explanations of the parameters and return types

#### 5. Create the Vue Component (`[test-name].vue`)

Create the user interface:

```vue
<template>
  <div class="flex w-full items-center justify-center gap-4">
    <Button
      @click="mainTestFunction()"
      <!-- Ensure you disable buttons when there is no wallet connected -->
      :disabled="!walletConnected"
    >
      Execute Test
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { mainTestFunction } from "./your-test-name";
import { useWalletStore } from "@/stores/walletStore";
import { ref, computed } from "vue";

const walletStore = useWalletStore();
const walletConnected = computed(() => !!walletStore.getAddress);

onMounted(() => {
  diagramStore.setTestDiagram("my-test-name", "my-default-diagram");
});
</script>
```

**UI Guidelines:**

- Use Shadcn-vue components from `@/components/ui/` (install more if needed: https://www.shadcn-vue.com/docs/introduction.html)
- Implement responsive design with Tailwind CSS
- Add proper ARIA labels for accessibility

#### 6. Create the Playwright Test (`tests/[test-name].spec.ts`)

We use Playwright to do automated testing. There are a few helper methods available to you to minimize boilerplate in the test file.

```typescript
import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers";
import { getSharedPage, setupSharedContext } from "./shared-context";

test.describe("Your Test Name", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should do a thing", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Your Test Name" });

    // Interact with your test UI
    await page.getByRole("button", { name: "Execute Test" }).click();

    // Wait for completion
    await waitForSuccess({ page });
    // Or, if you're forcing an error:
    // await waitForError({ page })
  });
});
```

### 🔧 Development Workflow

#### Environment Setup

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Run tests in the Playwright UI (easy to see what's happening)
npm run test:ui
```

#### Contract Management

```bash
# Compile contracts
npm run compile-contracts

# Deploy contracts to testnet
npm run originate [private-key]

# Fund test wallet
npm run fund-wallet
```

#### Code Quality

All three of these will run in CI and must pass before a PR can be merged.

```bash
# Lint code
npm run lint

# Format code
npm run format

# Test build
npm run build
```

### 🚨 Common Pitfalls

1. **Wallet Connection Issues**: Ensure tests use the shared wallet state
2. **State Management**: Each test should be independent and not rely on previous test state
3. **Type Safety**: Avoid `any` types - use proper TypeScript interfaces
4. **Error Handling**: Always handle errors gracefully in both UI and logic

### 📚 Additional Resources

- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [Taquito Documentation](https://taquito.io/docs/)
- [Playwright Testing](https://playwright.dev/)
- [Tezos Developer Portal](https://developers.tezos.com/)

Happy coding! 🎉
