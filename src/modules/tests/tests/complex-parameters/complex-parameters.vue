<template>
  <div class="mx-auto w-full space-y-8 lg:w-1/2">
    <div>
      <h3 class="mb-0.5 text-lg font-semibold">Deployed Contract Address</h3>
      <p
        class="bg-muted w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
      >
        {{ CONTRACT_ADDRESS }}
      </p>
      <OpenInExplorer :address="CONTRACT_ADDRESS" />
    </div>

    <!-- Simple Record Parameters -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Simple Record Parameters</h3>
        <h4 class="text-sm">
          Adds or updates a user record for your wallet address with simple
          records.
        </h4>
      </div>
      <div class="flex flex-col gap-4">
        <div class="space-y-3">
          <div>
            <Label class="mb-1" for="name">Name</Label>
            <Input
              id="name"
              v-model="simpleRecord.name"
              placeholder="Enter name"
              :disabled="!walletConnected"
            />
          </div>
          <div>
            <Label class="mb-1" for="age">Age</Label>
            <Input
              id="age"
              v-model.number="simpleRecord.age"
              type="number"
              min="0"
              :disabled="!walletConnected"
            />
          </div>
          <div class="flex items-center space-x-2">
            <input
              id="active"
              v-model="simpleRecord.active"
              type="checkbox"
              :disabled="!walletConnected"
              class="rounded"
            />
            <Label class="mb-1" for="active">Active</Label>
          </div>
        </div>
        <div class="space-y-3">
          <Button
            @click="handleAddSimpleRecord"
            :disabled="!walletConnected || !isSimpleRecordValid"
            class="w-full"
          >
            <UserPlus class="mr-2 h-4 w-4" />
            Add Simple Record
          </Button>
        </div>
      </div>
    </div>

    <!-- Nested Objects -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Nested Objects</h3>
        <h4 class="text-sm">
          Adds or updates a map entry with your address as the key, and an
          object as the value. The value object contains a permissions array,
          along with a metadata object with created_at and a tags array inside
          it.
        </h4>
      </div>
      <div class="flex flex-col gap-4">
        <div class="space-y-3">
          <div>
            <Label class="mb-1" for="metadata-created">Created At</Label>
            <Input
              id="metadata-created"
              v-model="nestedRecord.metadata.created_at"
              type="datetime-local"
              :disabled="!walletConnected"
            />
          </div>
          <div>
            <Label class="mb-1" for="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              v-model="tagsInput"
              placeholder="tag1, tag2, tag3"
              :disabled="!walletConnected"
            />
          </div>
          <div>
            <Label class="mb-1" for="permissions"
              >Permissions (comma-separated)</Label
            >
            <Input
              id="permissions"
              v-model="permissionsInput"
              placeholder="read, write, admin"
              :disabled="!walletConnected"
            />
          </div>
        </div>
        <div class="space-y-3">
          <Button
            @click="handleSetNestedObjects"
            :disabled="!walletConnected || !isNestedRecordValid"
            class="w-full"
          >
            <Database class="mr-2 h-4 w-4" />
            Set Nested Objects
          </Button>
        </div>
      </div>
    </div>

    <!-- Sets -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Sets</h3>
        <h4 class="text-sm">
          Adds or removes a user from the authorized users set. This is simply
          for demonstration purposes and has no actual function for
          authorization.
        </h4>
      </div>
      <div class="flex flex-col gap-4">
        <div class="space-y-3">
          <div>
            <Label class="mb-1" for="auth-user">User Address</Label>
            <Input
              id="auth-user"
              v-model="authUserAddress"
              placeholder="tz1..."
              :disabled="!walletConnected"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            @click="handlemanageUserSet('add')"
            :disabled="!walletConnected || !authUserAddress"
            class="flex-1"
          >
            <UserCheck class="mr-2 h-4 w-4" />
            Add User
          </Button>
          <Button
            @click="handlemanageUserSet('remove')"
            :disabled="!walletConnected || !authUserAddress"
            variant="destructive"
            class="flex-1"
          >
            <UserX class="mr-2 h-4 w-4" />
            Remove User
          </Button>
        </div>
      </div>
    </div>

    <!-- Global Metadata (Maps) -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Global Metadata (Maps)</h3>
        <h4 class="text-sm">
          Updates the metadata_map with simple key-value pairs. This is not tied
          to a user, so anyone can update this.
        </h4>
      </div>
      <div class="flex flex-col gap-4">
        <div class="space-y-3">
          <div>
            <Label class="mb-1" for="metadata-updates"
              >Metadata Update (JSON)</Label
            >
            <Textarea
              id="metadata-updates"
              v-model="metadataUpdatesJson"
              placeholder='{"key1": "value1", "key2": "value2"}'
              rows="3"
              :disabled="!walletConnected"
            />
          </div>
        </div>
        <div class="space-y-3">
          <Button
            @click="handleUpdateMetadata"
            :disabled="!walletConnected || !isMetadataUpdatesValid"
            class="w-full"
          >
            <Settings class="mr-2 h-4 w-4" />
            Update Metadata
          </Button>
        </div>
      </div>
    </div>

    <!-- Data Retrieval -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Data Retrieval</h3>
      <div class="flex flex-col gap-4">
        <div class="space-y-3">
          <div>
            <Label class="mb-1" for="view-user">User Address</Label>
            <Input
              id="view-user"
              v-model="viewUserAddress"
              placeholder="tz1..."
              :disabled="!walletConnected"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            @click="handleGetSimpleRecord"
            :disabled="!walletConnected || !viewUserAddress"
            class="flex-1"
          >
            <Eye class="mr-2 h-4 w-4" />
            Get Simple Record
          </Button>
          <Button
            @click="handleGetNestedObjects"
            :disabled="!walletConnected || !viewUserAddress"
            class="flex-1"
          >
            <FileText class="mr-2 h-4 w-4" />
            Get Nested Objects
          </Button>
        </div>
      </div>

      <!-- Global Metadata Retrieval -->
      <div class="space-y-4 border-t pt-4">
        <h4 class="text-md font-medium">Global Contract Metadata</h4>
        <div class="flex flex-col gap-4">
          <div class="flex gap-2">
            <Button
              @click="handleGetAllMetadata"
              :disabled="!walletConnected"
              class="flex-1"
            >
              <Database class="mr-2 h-4 w-4" />
              Get All Metadata
            </Button>
          </div>
        </div>
      </div>

      <!-- Results Display -->
      <div v-if="retrievedData !== null" class="mt-4">
        <Label class="mb-1">Retrieved Data:</Label>
        <pre class="bg-muted mt-2 overflow-auto rounded-md p-4 text-sm">{{
          retrievedData === undefined
            ? "undefined"
            : JSON.stringify(retrievedData, null, 2)
        }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import contracts from "@/contracts/contract-config.json";
import OpenInExplorer from "@/modules/tests/components/open-in-explorer.vue";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type {
  ContractConfig,
  NestedRecord,
  UserRecord,
} from "@/types/contract";
import {
  Database,
  Eye,
  FileText,
  Settings,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import {
  addUserRecord,
  getAllMetadata,
  getNestedData,
  getUserRecord,
  manageUserSet,
  setNestedRecord,
  updateMetadata,
  type RecordParam,
} from "./complex-parameters";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);

watch(walletConnected, () => {
  if (walletConnected.value && walletStore.getAddress) {
    authUserAddress.value = walletStore.getAddress;
    viewUserAddress.value = walletStore.getAddress;
  } else {
    authUserAddress.value = "";
    viewUserAddress.value = "";
  }
});

// Simple record form data
const simpleRecord = ref<RecordParam>({
  name: "Test User",
  age: 25,
  active: true,
});

// Nested record form data
const nestedRecord = ref<NestedRecord>({
  metadata: {
    created_at: new Date().toISOString().slice(0, 16),
    updated_at: null,
    tags: [],
  },
  permissions: [],
});

const tagsInput = ref("test, demo");
const permissionsInput = ref("read, write");

// Authorization form data
const authUserAddress = ref("");

// Metadata updates form data
const metadataUpdatesJson = ref('{"key1": "value1", "key2": "value2"}');

// Data retrieval form data
const viewUserAddress = ref("");
const retrievedData = ref<
  UserRecord | NestedRecord | Record<string, string> | null
>(null);

// Computed validations
const isSimpleRecordValid = computed(() => {
  return simpleRecord.value.name && simpleRecord.value.age >= 0;
});

const isNestedRecordValid = computed(() => {
  return nestedRecord.value.metadata.created_at;
});

const isMetadataUpdatesValid = computed(() => {
  try {
    const parsed = JSON.parse(metadataUpdatesJson.value);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
});

// Update nested record when tags/permissions change
const updateNestedRecord = () => {
  nestedRecord.value.metadata.tags = tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  nestedRecord.value.permissions = permissionsInput.value
    .split(",")
    .map((perm) => perm.trim())
    .filter((perm) => perm.length > 0);
};

// Event handlers
const handleAddSimpleRecord = async () => {
  await addUserRecord(simpleRecord.value);
};

const handleSetNestedObjects = async () => {
  updateNestedRecord();
  await setNestedRecord(nestedRecord.value);
};

const handlemanageUserSet = async (action: "add" | "remove") => {
  await manageUserSet(action, authUserAddress.value);
};

const handleUpdateMetadata = async () => {
  try {
    const updates = JSON.parse(metadataUpdatesJson.value);
    await updateMetadata(updates);
  } catch (error) {
    console.error("Invalid JSON for metadata updates:", error);
  }
};

const handleGetSimpleRecord = async () => {
  console.log("Getting simple record for:", viewUserAddress.value);
  const result = await getUserRecord(viewUserAddress.value);
  console.log("Simple record result:", result);
  retrievedData.value = result;
};

const handleGetNestedObjects = async () => {
  console.log("Getting nested objects for:", viewUserAddress.value);
  const result = await getNestedData(viewUserAddress.value);
  console.log("Nested objects result:", result);
  retrievedData.value = result;
};

const handleGetAllMetadata = async () => {
  console.log("Getting all metadata...");
  const result = await getAllMetadata();
  console.log("All metadata result:", result);
  retrievedData.value = result;
};

onMounted(() => {
  diagramStore.setTestDiagram("complex-parameters");

  // Initialize with wallet address if available
  if (walletStore.getAddress) {
    authUserAddress.value = walletStore.getAddress;
    viewUserAddress.value = walletStore.getAddress;
  }
});

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) =>
      contract.contractName === "complex-parameters",
  )?.address ?? "";
</script>
