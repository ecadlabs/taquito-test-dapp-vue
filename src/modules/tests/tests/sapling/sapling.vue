<template>
  <div class="flex w-full flex-col gap-6">
    <div class="mx-auto w-full max-w-6xl space-y-6">
      <!-- Top Context & Runtime Strip -->
      <div class="grid gap-4 lg:grid-cols-12">
        <!-- Deployed Sapling Contract Context -->
        <Card class="lg:col-span-5">
          <CardHeader class="gap-2 pb-3">
            <div class="flex items-center justify-between gap-2">
              <CardTitle class="flex items-center gap-2 text-base">
                <Lock class="size-4" />
                Deployed Sapling Pool
              </CardTitle>
              <Badge variant="secondary">Memo: {{ MEMO_SIZE }} bytes</Badge>
            </div>
            <CardDescription class="text-xs">
              Shield, transfer, and unshield operations generate Groth16
              zero-knowledge proofs in WebAssembly (10-30s).
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <code
                class="bg-muted rounded-md px-2 py-1 font-mono text-xs text-red-400"
                data-testid="sapling-contract-address"
              >
                {{ contractAddress || "Not configured" }}
              </code>
              <OpenInExplorer
                v-if="contractAddress"
                :address="contractAddress"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Sapling Runtime & Proving Params Status -->
        <Card class="lg:col-span-7" data-testid="sapling-runtime-status">
          <CardHeader class="gap-2 pb-3">
            <div class="space-y-1">
              <CardTitle class="flex items-center gap-2 text-base">
                <Download class="size-4" />
                Sapling Runtime Status
              </CardTitle>
              <CardDescription class="text-xs">
                {{ runtimeDetailHeadline }}. {{ runtimeDetailText }}
                <span v-if="runtimeCompletionText" class="font-medium">
                  {{ runtimeCompletionText }}
                </span>
              </CardDescription>
            </div>
            <CardAction>
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="preloadButtonDisabled"
                  @click="handlePreloadSaplingParams"
                  data-testid="sapling-preload-button"
                >
                  <span
                    v-if="saplingRuntimeState.kind === 'params-preloading'"
                    class="sapling-spinner sapling-spinner-sm"
                    aria-hidden="true"
                  ></span>
                  <Check
                    v-else-if="saplingRuntimeState.kind === 'params-ready'"
                    class="size-4"
                  />
                  <Download v-else class="size-4" />
                  {{ preloadButtonLabel }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="
                    isRunning ||
                    isReloadingSaplingSession ||
                    saplingRuntimeState.kind === 'params-preloading'
                  "
                  @click="handleReloadWithFreshSaplingParams"
                  data-testid="sapling-fresh-reload-button"
                  title="Reload page and re-download proving params with cache busting (preserves session keys)"
                >
                  <RotateCcw class="size-4" />
                  Reload Params
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent class="space-y-3 pt-0">
            <div class="grid gap-2 sm:grid-cols-2">
              <div
                class="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span
                  class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                >
                  Runtime
                </span>
                <div class="flex items-center gap-2">
                  <Badge :variant="runtimeModuleBadgeVariant">
                    {{ runtimeModuleBadgeLabel }}
                  </Badge>
                  <span
                    class="text-xs font-medium"
                    data-testid="sapling-runtime-module-status"
                  >
                    {{ runtimeModuleStatusText }}
                  </span>
                </div>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span
                  class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                >
                  Proving params
                </span>
                <div class="flex items-center gap-2">
                  <Badge :variant="runtimeParamsBadgeVariant">
                    {{ runtimeParamsBadgeLabel }}
                  </Badge>
                  <span
                    class="text-xs font-medium"
                    data-testid="sapling-runtime-params-status"
                  >
                    {{ runtimeParamsStatusText }}
                  </span>
                </div>
              </div>
            </div>

            <Alert
              v-if="runtimeErrorMessage"
              variant="destructive"
              data-testid="sapling-runtime-error"
            >
              <TriangleAlert class="size-4" />
              <AlertTitle>Preload failed</AlertTitle>
              <AlertDescription>{{ runtimeErrorMessage }}</AlertDescription>
            </Alert>

            <div
              v-if="saplingRuntimeState.kind === 'params-preloading'"
              class="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-800 dark:bg-sky-950/50"
            >
              <div class="flex items-center gap-3">
                <div class="relative text-sky-700 dark:text-sky-300">
                  <span
                    class="sapling-spinner sapling-spinner-lg"
                    aria-hidden="true"
                  ></span>
                  <span class="sapling-spinner-dot" aria-hidden="true"></span>
                </div>
                <div class="space-y-0.5">
                  <div
                    class="text-sm font-medium text-sky-950 dark:text-sky-100"
                  >
                    Downloading proving params
                  </div>
                  <div class="text-xs text-sky-900 dark:text-sky-200">
                    Pulling the Sapling proving bundle from
                    <code
                      class="rounded bg-white/80 px-1 py-0.5 text-xs dark:bg-sky-900/80"
                      >sapling.taquito.io</code
                    >
                    so proof-generating actions can run.
                  </div>
                </div>
              </div>
              <div class="bg-muted h-2 overflow-hidden rounded-full">
                <div class="sapling-indeterminate-bar bg-primary h-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main 2-Column Workspace: Left (Execute Operations) / Right (Inspect & Keys) -->
      <div class="grid items-start gap-6 lg:grid-cols-12">
        <!-- Left Column: Stepped Shielded Operations -->
        <div class="space-y-6 lg:col-span-6">
          <Card>
            <CardHeader>
              <div class="space-y-1">
                <CardTitle class="flex items-center gap-2">
                  <Lock class="size-4" />
                  Shielded Pool Operations
                </CardTitle>
                <CardDescription>
                  Follow the 3-step lifecycle: shield public tez into a private
                  note, transfer privately to Alice, and unshield back to your
                  public account.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent class="space-y-5">
              <Tabs
                v-model="activeOperationTab"
                class="w-full"
                @update:model-value="handleOperationTabChange"
              >
                <TabsList class="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="shield"
                    class="gap-1.5 text-xs sm:text-sm"
                    data-testid="sapling-tab-shield"
                  >
                    <Lock class="size-3.5" />
                    <span>1. Shield</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="transfer"
                    class="gap-1.5 text-xs sm:text-sm"
                    data-testid="sapling-tab-transfer"
                  >
                    <ArrowRightLeft class="size-3.5" />
                    <span>2. Transfer</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="unshield"
                    class="gap-1.5 text-xs sm:text-sm"
                    data-testid="sapling-tab-unshield"
                  >
                    <Unlock class="size-3.5" />
                    <span>3. Unshield</span>
                  </TabsTrigger>
                </TabsList>

                <!-- Step 1: Shield Tez -->
                <TabsContent value="shield" class="mt-4 space-y-4">
                  <div
                    class="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span class="text-muted-foreground">
                      Available Public Balance:
                    </span>
                    <span class="font-mono font-semibold">
                      {{
                        publicBalanceTez !== null
                          ? `${publicBalanceTez.toFixed(4)} ꜩ`
                          : walletConnected
                            ? "..."
                            : "Connect wallet"
                      }}
                    </span>
                  </div>

                  <p class="text-muted-foreground text-xs">
                    Move tez from your connected public account into the Sapling
                    pool to create an encrypted note owned by your spending key.
                  </p>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-2">
                      <Label for="sapling-shield-amount">Amount (ꜩ)</Label>
                      <Input
                        id="sapling-shield-amount"
                        v-model.number="shieldAmount"
                        type="number"
                        placeholder="3"
                        step="0.1"
                        min="0.1"
                        :disabled="isRunning || !userKey"
                      />
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <Label for="sapling-shield-memo">Memo (optional)</Label>
                        <span
                          :class="[
                            'font-mono text-[11px]',
                            shieldMemoBytes > MEMO_SIZE
                              ? 'text-destructive font-semibold'
                              : 'text-muted-foreground',
                          ]"
                        >
                          {{ shieldMemoBytes }}/{{ MEMO_SIZE }}B
                        </span>
                      </div>
                      <Input
                        id="sapling-shield-memo"
                        v-model="shieldMemo"
                        type="text"
                        placeholder="Shield"
                        :maxlength="MEMO_SIZE"
                        :disabled="isRunning || !userKey"
                        data-testid="sapling-shield-memo-input"
                      />
                    </div>
                  </div>

                  <Button
                    @click="handleShieldToUser"
                    :disabled="
                      !walletConnected ||
                      !contractAddress ||
                      !userKey ||
                      isRunning ||
                      !isValidAmount(shieldAmount) ||
                      shieldMemoBytes > MEMO_SIZE
                    "
                    class="w-full"
                    data-testid="sapling-shield-button"
                  >
                    <span
                      v-if="activeOperation === 'shield'"
                      class="sapling-spinner sapling-spinner-sm mr-2"
                      aria-hidden="true"
                    ></span>
                    <Lock v-else class="mr-2 h-4 w-4" />
                    {{
                      activeOperation === "shield"
                        ? activePhaseButtonLabel
                        : "Shield Tez"
                    }}
                  </Button>
                </TabsContent>

                <!-- Step 2: Transfer to Alice -->
                <TabsContent value="transfer" class="mt-4 space-y-4">
                  <div
                    class="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span class="text-muted-foreground">
                      Your Unspent Shielded Balance:
                    </span>
                    <span class="font-mono font-semibold">
                      {{
                        userBalance !== null
                          ? `${formatBalance(userBalance)} ꜩ`
                          : "Click Get Balance to inspect"
                      }}
                    </span>
                  </div>

                  <p class="text-muted-foreground text-xs">
                    Spend your private note to Alice's Sapling address inside
                    the shielded pool. Any remaining value from the spent note
                    is returned to you as a new change note.
                  </p>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-2">
                      <Label for="sapling-transfer-amount">Amount (ꜩ)</Label>
                      <Input
                        id="sapling-transfer-amount"
                        v-model.number="transferAmount"
                        type="number"
                        placeholder="1"
                        step="0.1"
                        min="0.1"
                        :disabled="isRunning || !userKey || !aliceAddress"
                      />
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <Label for="sapling-transfer-memo"
                          >Memo (optional)</Label
                        >
                        <span
                          :class="[
                            'font-mono text-[11px]',
                            transferMemoBytes > MEMO_SIZE
                              ? 'text-destructive font-semibold'
                              : 'text-muted-foreground',
                          ]"
                        >
                          {{ transferMemoBytes }}/{{ MEMO_SIZE }}B
                        </span>
                      </div>
                      <Input
                        id="sapling-transfer-memo"
                        v-model="transferMemo"
                        type="text"
                        placeholder="Transfer"
                        :maxlength="MEMO_SIZE"
                        :disabled="isRunning || !userKey || !aliceAddress"
                        data-testid="sapling-transfer-memo-input"
                      />
                    </div>
                  </div>

                  <div
                    v-if="exceedsShieldedBalance(transferAmount)"
                    class="text-destructive text-xs font-medium"
                  >
                    Requested amount exceeds your known unspent shielded balance
                    ({{ formatBalance(userBalance ?? 0) }} ꜩ). Shield more tez
                    in Step 1 first.
                  </div>

                  <Button
                    @click="handleTransferToAlice"
                    :disabled="
                      !walletConnected ||
                      !contractAddress ||
                      !userKey ||
                      !aliceAddress ||
                      isRunning ||
                      !isValidAmount(transferAmount) ||
                      transferMemoBytes > MEMO_SIZE
                    "
                    class="w-full"
                    data-testid="sapling-transfer-button"
                  >
                    <span
                      v-if="activeOperation === 'transfer'"
                      class="sapling-spinner sapling-spinner-sm mr-2"
                      aria-hidden="true"
                    ></span>
                    <ArrowRightLeft v-else class="mr-2 h-4 w-4" />
                    {{
                      activeOperation === "transfer"
                        ? activePhaseButtonLabel
                        : "Transfer to Alice"
                    }}
                  </Button>
                </TabsContent>

                <!-- Step 3: Unshield to User's Public Address -->
                <TabsContent value="unshield" class="mt-4 space-y-4">
                  <div
                    class="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span class="text-muted-foreground">
                      Your Unspent Shielded Balance:
                    </span>
                    <span class="font-mono font-semibold">
                      {{
                        userBalance !== null
                          ? `${formatBalance(userBalance)} ꜩ`
                          : "Click Get Balance to inspect"
                      }}
                    </span>
                  </div>

                  <p class="text-muted-foreground text-xs">
                    Exit the Sapling pool by sending funds back to your
                    connected public address
                    <code v-if="walletStore.getAddress" class="text-xs">{{
                      walletStore.getAddress
                    }}</code
                    >.
                  </p>

                  <div class="space-y-2">
                    <Label for="sapling-unshield-amount">Amount (ꜩ)</Label>
                    <Input
                      id="sapling-unshield-amount"
                      v-model.number="unshieldAmount"
                      type="number"
                      placeholder="1"
                      step="0.1"
                      min="0.1"
                      :disabled="isRunning || !userKey"
                    />
                  </div>

                  <div
                    v-if="exceedsShieldedBalance(unshieldAmount)"
                    class="text-destructive text-xs font-medium"
                  >
                    Requested amount exceeds your known unspent shielded balance
                    ({{ formatBalance(userBalance ?? 0) }} ꜩ).
                  </div>

                  <Button
                    @click="handleUnshieldToUser"
                    :disabled="
                      !walletConnected ||
                      !contractAddress ||
                      !userKey ||
                      isRunning ||
                      !isValidAmount(unshieldAmount)
                    "
                    class="w-full"
                    data-testid="sapling-unshield-button"
                  >
                    <span
                      v-if="activeOperation === 'unshield'"
                      class="sapling-spinner sapling-spinner-sm mr-2"
                      aria-hidden="true"
                    ></span>
                    <Unlock v-else class="mr-2 h-4 w-4" />
                    {{
                      activeOperation === "unshield"
                        ? activePhaseButtonLabel
                        : "Unshield Tez"
                    }}
                  </Button>
                </TabsContent>
              </Tabs>

              <!-- Live Operation Phase Banner -->
              <div
                v-if="
                  activeOperation === 'shield' ||
                  activeOperation === 'transfer' ||
                  activeOperation === 'unshield'
                "
                class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                role="status"
                aria-live="polite"
              >
                <span
                  class="sapling-spinner sapling-spinner-sm shrink-0"
                  aria-hidden="true"
                ></span>
                <div>
                  <span class="font-semibold">{{
                    activePhaseButtonLabel
                  }}</span>
                  <span class="ml-1 opacity-90">
                    The browser may briefly pause while the WebAssembly Groth16
                    prover computes the zero-knowledge proof.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Sapling Addresses & Session Keys -->
          <Card>
            <CardHeader>
              <div class="space-y-1">
                <CardTitle class="flex items-center gap-2 text-base">
                  <Key class="size-4" />
                  Sapling Session Keys &amp; Addresses
                </CardTitle>
                <CardDescription class="text-xs">
                  Persisted in <code>sessionStorage</code> for this tab so route
                  navigation does not orphan shielded funds.
                </CardDescription>
              </div>
              <CardAction>
                <div class="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isRunning || !userKey"
                    @click="showMnemonicImport = !showMnemonicImport"
                  >
                    <Key class="size-4" />
                    {{
                      showMnemonicImport ? "Cancel Import" : "Import Mnemonic"
                    }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isRunning || !userKey"
                    @click="handleRegenerateKeys"
                    data-testid="sapling-regenerate-keys-button"
                  >
                    <RotateCcw class="size-4" />
                    New Keys
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent class="space-y-4">
              <div
                v-if="showMnemonicImport"
                class="bg-muted/40 space-y-3 rounded-lg border p-3"
              >
                <Label class="text-xs font-medium">
                  Restore Your Sapling Spending Key (BIP39 Mnemonic)
                </Label>
                <div class="flex gap-2">
                  <Input
                    v-model="mnemonicInput"
                    type="text"
                    placeholder="Enter 12 or 24 recovery words..."
                    :disabled="isRunning"
                  />
                  <Button
                    size="sm"
                    :disabled="isRunning || !mnemonicInput.trim()"
                    @click="handleImportMnemonic"
                  >
                    Restore
                  </Button>
                </div>
              </div>

              <div v-if="userKey" class="space-y-3">
                <div class="text-sm">
                  <div class="flex items-center justify-between">
                    <Label
                      class="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >Your Spending Key (Mnemonic):</Label
                    >
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-6 px-2 text-xs"
                      @click="showMnemonicSecret = !showMnemonicSecret"
                      data-testid="sapling-toggle-mnemonic-button"
                    >
                      <EyeOff v-if="showMnemonicSecret" class="mr-1 size-3.5" />
                      <Eye v-else class="mr-1 size-3.5" />
                      {{ showMnemonicSecret ? "Hide" : "Reveal" }}
                    </Button>
                  </div>
                  <div class="mt-1 flex items-center gap-2">
                    <code
                      class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                    >
                      {{
                        showMnemonicSecret
                          ? userKey.mnemonic
                          : "•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••"
                      }}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      @click="copyToClipboard(userKey.mnemonic)"
                      aria-label="Copy spending key mnemonic"
                    >
                      <Copy class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div class="text-sm">
                  <Label
                    class="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >Your Sapling Address:</Label
                  >
                  <div class="mt-1 flex items-center gap-2">
                    <code
                      class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                    >
                      {{ userKey.address }}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      @click="copyToClipboard(userKey.address)"
                      aria-label="Copy your Sapling address"
                    >
                      <Copy class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div v-if="aliceAddress" class="space-y-3">
                <div class="text-sm">
                  <Label
                    class="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >Alice's Sapling Address (Session Recipient):</Label
                  >
                  <div class="mt-1 flex items-center gap-2">
                    <code
                      class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                    >
                      {{ aliceAddress }}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      @click="copyToClipboard(aliceAddress)"
                      aria-label="Copy Alice Sapling address"
                    >
                      <Copy class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div
                v-if="!userKey || !aliceAddress"
                class="text-muted-foreground text-sm"
              >
                Generating keys...
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Viewing Key Inspection (Balances & History) -->
        <div class="space-y-6 lg:col-span-6">
          <!-- Inspect Shielded Pool Balances -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Wallet class="size-4" />
                Shielded Pool Balances
              </CardTitle>
              <CardAction>
                <Badge variant="secondary">Viewing Key</Badge>
              </CardAction>
              <CardDescription>
                Decrypt unspent notes for your viewing key and Alice's viewing
                key without generating a proof. Automatically updates after
                operations.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <Button
                @click="handleGetBalance"
                :disabled="
                  !walletConnected ||
                  !contractAddress ||
                  !userKey ||
                  isRunning ||
                  isRefreshingInspection
                "
                variant="outline"
                class="w-full"
                data-testid="sapling-balance-button"
              >
                <span
                  v-if="activeOperation === 'balance'"
                  class="sapling-spinner sapling-spinner-sm mr-2"
                  aria-hidden="true"
                ></span>
                <Wallet v-else class="mr-2 h-4 w-4" />
                Get Balance
              </Button>
              <div
                v-if="userBalance !== null"
                class="grid gap-3 sm:grid-cols-2"
              >
                <div class="bg-background rounded-lg border p-3">
                  <div class="text-muted-foreground text-xs font-medium">
                    Your Unspent Balance:
                  </div>
                  <div
                    class="text-foreground mt-1 text-2xl font-bold"
                    data-testid="sapling-user-balance"
                  >
                    {{ formatBalance(userBalance) }} ꜩ
                  </div>
                </div>
                <div
                  v-if="aliceBalance !== null"
                  class="bg-background rounded-lg border p-3"
                >
                  <div class="text-muted-foreground text-xs font-medium">
                    Alice's Unspent Balance:
                  </div>
                  <div
                    class="text-foreground mt-1 text-2xl font-bold"
                    data-testid="sapling-alice-balance"
                  >
                    {{ formatBalance(aliceBalance) }} ꜩ
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Inspect Transaction History -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <History class="size-4" />
                Transaction History
              </CardTitle>
              <CardAction>
                <Badge variant="secondary">Viewing Key</Badge>
              </CardAction>
              <CardDescription>
                Inspect decrypted incoming notes, outgoing private transfers,
                and change notes without generating a proof.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  @click="handleGetTransactionHistory"
                  :disabled="
                    !walletConnected ||
                    !contractAddress ||
                    !userKey ||
                    isRunning ||
                    isRefreshingInspection
                  "
                  variant="outline"
                  class="flex-1"
                  data-testid="sapling-history-button"
                >
                  <span
                    v-if="activeOperation === 'history'"
                    class="sapling-spinner sapling-spinner-sm mr-2"
                    aria-hidden="true"
                  ></span>
                  <History v-else class="mr-2 h-4 w-4" />
                  Get Transaction History
                </Button>

                <div
                  v-if="transactionHistory || aliceTransactionHistory"
                  class="bg-muted inline-flex rounded-md border p-0.5 text-xs"
                  role="group"
                  aria-label="Viewing key perspective"
                >
                  <button
                    type="button"
                    @click="historyPerspective = 'user'"
                    :class="[
                      'rounded px-2.5 py-1 font-medium transition-colors',
                      historyPerspective === 'user'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                    data-testid="sapling-history-perspective-user"
                  >
                    Your Key
                  </button>
                  <button
                    type="button"
                    @click="historyPerspective = 'alice'"
                    :class="[
                      'rounded px-2.5 py-1 font-medium transition-colors',
                      historyPerspective === 'alice'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                    data-testid="sapling-history-perspective-alice"
                  >
                    Alice's Key
                  </button>
                </div>
              </div>

              <div v-if="displayedTransactionHistory" class="space-y-3">
                <!-- Info Note -->
                <div
                  class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50"
                >
                  <div
                    class="mb-1 text-xs font-medium text-blue-900 dark:text-blue-100"
                  >
                    How Sapling UTXO notes work
                  </div>
                  <div class="text-xs text-blue-800 dark:text-blue-200">
                    Sapling uses an unspent-note (UTXO) model. Spending a 3 ꜩ
                    note to send 1 ꜩ to Alice marks the 3 ꜩ note
                    <strong>Spent</strong>, sends an <strong>Outgoing</strong> 1
                    ꜩ note to Alice, and returns a 2 ꜩ
                    <strong>Change</strong> note to your address.
                  </div>
                </div>

                <!-- Transaction Count -->
                <div
                  class="bg-background flex items-center justify-between rounded-lg border p-3"
                >
                  <div class="text-muted-foreground text-xs font-medium">
                    Total Notes &amp; Transfers ({{
                      historyPerspective === "user"
                        ? "Your Viewing Key"
                        : "Alice's Viewing Key"
                    }}):
                  </div>
                  <div
                    class="text-foreground text-xl font-bold"
                    data-testid="sapling-history-total"
                  >
                    {{ displayedTransactionHistory.total }}
                  </div>
                </div>

                <!-- Transaction List -->
                <div class="space-y-1.5" data-testid="sapling-history-list">
                  <div
                    v-for="(
                      tx, index
                    ) in displayedTransactionHistory.transactions"
                    :key="`tx-${index}`"
                    :class="[
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                      tx.type === 'incoming'
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
                    ]"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        :class="[
                          'font-medium',
                          tx.type === 'incoming'
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200',
                        ]"
                      >
                        {{ tx.type === "incoming" ? "+" : "-" }}
                        {{ formatBalance(tx.amount) }} ꜩ
                      </span>
                      <span
                        v-if="tx.memo"
                        class="text-xs text-gray-600 dark:text-gray-300"
                      >
                        ({{ tx.memo }})
                      </span>
                      <Badge
                        v-if="tx.isChange"
                        variant="outline"
                        class="text-[10px]"
                      >
                        Change
                      </Badge>
                      <Badge
                        v-if="tx.type === 'incoming'"
                        :variant="tx.isSpent ? 'outline' : 'secondary'"
                        class="text-[10px]"
                      >
                        {{ tx.isSpent ? "Spent" : "Unspent" }}
                      </Badge>
                      <span
                        v-if="tx.paymentAddress"
                        class="font-mono text-[11px] text-gray-600 dark:text-gray-400"
                      >
                        {{ formatSaplingParty(tx.paymentAddress, tx.type) }}
                      </span>
                    </div>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ tx.type === "incoming" ? "In" : "Out" }}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyToClipboard } from "@/lib/utils";
import OpenInExplorer from "@/modules/tests/components/open-in-explorer.vue";
import {
  generateAliceSpendingKey,
  generateUserSpendingKey,
  getSaplingErrorMessage,
  getSaplingMemoByteLength,
  getSaplingRuntimeSnapshot,
  getUserSaplingBalance,
  getUserTransactionHistory,
  isSaplingParamsError,
  markSaplingProvingParamsFailed,
  MEMO_SIZE,
  preloadSaplingProvingParams,
  reloadWithFreshSaplingParams,
  setSaplingStoreHooks,
  shieldToUser,
  subscribeSaplingRuntimeSnapshot,
  transferToAlice,
  unshieldToUser,
  type SaplingRuntimeSnapshot,
  type SaplingTransactionHistory,
  type UserSaplingKey,
} from "@/modules/tests/tests/sapling/sapling";
import { getContractAddress } from "@/networks/network-registry";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import {
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  History,
  Key,
  Lock,
  RotateCcw,
  TriangleAlert,
  Unlock,
  Wallet,
} from "lucide-vue-next";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const settingsStore = useSettingsStore();
const walletStore = useWalletStore();
const networkId =
  import.meta.env.VITE_NETWORK_NAME || import.meta.env.VITE_NETWORK_TYPE;

type ActiveOperation =
  "shield" | "transfer" | "unshield" | "balance" | "history" | null;
type OperationTab = "shield" | "transfer" | "unshield";
type HistoryPerspective = "user" | "alice";

const walletConnected = computed(() => !!walletStore.getAddress);
const publicBalanceTez = computed(() => {
  if (!walletStore.getBalance) {
    return null;
  }
  return walletStore.getBalance.toNumber() / 1_000_000;
});

const isRunning = ref(false);
const isRefreshingInspection = ref(false);
const activeOperation = ref<ActiveOperation>(null);
const activeOperationTab = ref<OperationTab>("shield");
const historyPerspective = ref<HistoryPerspective>("user");
const isBootingKeys = ref(true);
const isReloadingSaplingSession = ref(false);
const showMnemonicImport = ref(false);
const showMnemonicSecret = ref(false);
const mnemonicInput = ref("");

type BadgeVariant = NonNullable<BadgeVariants["variant"]>;
type SaplingRuntimeUiState =
  | { kind: "booting" }
  | { kind: "module-error"; errorMessage: string }
  | { kind: "params-idle" }
  | { kind: "params-preloading" }
  | { kind: "params-ready"; elapsedMs: number | null }
  | { kind: "params-error"; errorMessage: string };

const contractAddress = ref("");
// Use shallowRef to preserve private class members on InMemorySpendingKey
const userKey = shallowRef<UserSaplingKey | null>(null);
const aliceKey = shallowRef<UserSaplingKey | null>(null);
const aliceAddress = computed(() => aliceKey.value?.address ?? "");
const saplingRuntimeState = ref<SaplingRuntimeUiState>({ kind: "booting" });

// Amounts (in tez) and custom 8-byte memos
const shieldAmount = ref(3);
const shieldMemo = ref("Shield");
const transferAmount = ref(1);
const transferMemo = ref("Transfer");
const unshieldAmount = ref(1);

const shieldMemoBytes = computed(() =>
  getSaplingMemoByteLength(shieldMemo.value.trim() || "Shield"),
);
const transferMemoBytes = computed(() =>
  getSaplingMemoByteLength(transferMemo.value.trim() || "Transfer"),
);

// Results
const transactionHistory = ref<SaplingTransactionHistory | null>(null);
const aliceTransactionHistory = ref<SaplingTransactionHistory | null>(null);
const userBalance = ref<number | null>(null);
const aliceBalance = ref<number | null>(null);

const displayedTransactionHistory = computed(() =>
  historyPerspective.value === "alice"
    ? (aliceTransactionHistory.value ?? transactionHistory.value)
    : transactionHistory.value,
);

// Get contract address from config
const CONTRACT_ADDRESS = getContractAddress("sapling", networkId) ?? "";

let unsubscribeRuntimeSnapshot: (() => void) | undefined;

const isValidAmount = (value: number): boolean =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const exceedsShieldedBalance = (amountTez: number): boolean => {
  if (userBalance.value === null || !isValidAmount(amountTez)) {
    return false;
  }
  return amountTez * 1_000_000 > userBalance.value;
};

const activePhaseButtonLabel = computed(() => {
  if (saplingRuntimeState.value.kind === "params-preloading") {
    return "Downloading proving params...";
  }
  switch (diagramStore.currentStep) {
    case "wait-for-user":
      return "Confirm in wallet...";
    case "wait-for-chain-confirmation":
      return "Waiting for block inclusion...";
    default:
      return "Generating ZK proof (10-30s)...";
  }
});

const formatSaplingParty = (
  paymentAddress: string,
  type: "incoming" | "outgoing",
): string => {
  const shortAddr = `${paymentAddress.slice(0, 8)}...${paymentAddress.slice(-4)}`;
  if (userKey.value && paymentAddress === userKey.value.address) {
    return type === "incoming" ? `→ You (${shortAddr})` : `You (${shortAddr})`;
  }
  if (aliceAddress.value && paymentAddress === aliceAddress.value) {
    return type === "outgoing"
      ? `→ Alice (${shortAddr})`
      : `Alice (${shortAddr})`;
  }
  return shortAddr;
};

const handleOperationTabChange = (tab: string | number) => {
  if (!isRunning.value && diagramStore.diagramStatus === "idle") {
    diagramStore.setTestDiagram("sapling", String(tab));
  }
};

const syncSaplingRuntimeState = (snapshot: SaplingRuntimeSnapshot) => {
  if (snapshot.moduleStatus === "failed") {
    saplingRuntimeState.value = {
      kind: "module-error",
      errorMessage: snapshot.errorMessage ?? "Failed to load Sapling runtime",
    };
    return;
  }

  switch (snapshot.paramsStatus) {
    case "preloading":
      saplingRuntimeState.value = { kind: "params-preloading" };
      return;
    case "ready":
      saplingRuntimeState.value = {
        kind: "params-ready",
        elapsedMs: snapshot.lastPreloadDurationMs,
      };
      return;
    case "failed":
      saplingRuntimeState.value = {
        kind: "params-error",
        errorMessage:
          snapshot.errorMessage ?? "Failed to preload Sapling proving params",
      };
      return;
    default:
      saplingRuntimeState.value =
        snapshot.moduleStatus === "ready" && !isBootingKeys.value
          ? { kind: "params-idle" }
          : { kind: "booting" };
  }
};

const formatElapsedMs = (elapsedMs: number): string => {
  if (elapsedMs < 1000) {
    return `${Math.round(elapsedMs)} ms`;
  }

  return `${(elapsedMs / 1000).toFixed(1)}s`;
};

const runtimeModuleBadgeVariant = computed<BadgeVariant>(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "destructive";
    case "booting":
      return "outline";
    default:
      return "secondary";
  }
});

const runtimeModuleBadgeLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Failed";
    case "booting":
      return "Loading";
    default:
      return "Ready";
  }
});

const runtimeModuleStatusText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Sapling module failed";
    case "booting":
      return "Loading Sapling module...";
    default:
      return "Sapling module ready";
  }
});

const runtimeParamsBadgeVariant = computed<BadgeVariant>(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "default";
    case "params-ready":
      return "secondary";
    case "params-error":
      return "destructive";
    default:
      return "outline";
  }
});

const runtimeParamsBadgeLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Loading";
    case "params-ready":
      return "Ready";
    case "params-error":
      return "Failed";
    default:
      return "Idle";
  }
});

const runtimeParamsStatusText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Preloading proving params...";
    case "params-ready":
      return "Proving params ready";
    case "params-error":
      return "Preload failed";
    default:
      return "Proving params not loaded";
  }
});

const runtimeDetailHeadline = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Sapling runtime is unavailable";
    case "params-preloading":
      return "Proving params are downloading now";
    case "params-ready":
      return "Proving params are ready for this session";
    case "params-error":
      return "Proof generation can retry later";
    default:
      return "Proof generation lazy-loads proving params on first use";
  }
});

const runtimeDetailText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "The runtime failed before key generation finished, so Sapling actions are not ready yet.";
    case "params-preloading":
      return "Shield, transfer, and unshield will not need a second proving-params download once this completes.";
    case "params-ready":
      return "Shield, transfer, and unshield calls skip the download step and go straight into proof generation.";
    case "params-error":
      return "Viewing and key-generation flows still work. Proof-generating actions will retry the download on next use.";
    default:
      return "Key generation and viewing work immediately without proving params.";
  }
});

const runtimeCompletionText = computed(() => {
  if (saplingRuntimeState.value.kind !== "params-ready") {
    return null;
  }

  if (saplingRuntimeState.value.elapsedMs === null) {
    return "Proof-generating actions are ready.";
  }

  return `Downloaded from sapling.taquito.io in ${formatElapsedMs(saplingRuntimeState.value.elapsedMs)}.`;
});

const runtimeErrorMessage = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
    case "params-error":
      return saplingRuntimeState.value.errorMessage;
    default:
      return null;
  }
});

const preloadButtonLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Downloading params...";
    case "params-ready":
      return "Proving params ready";
    default:
      return "Preload proving params";
  }
});

const preloadButtonDisabled = computed(
  () =>
    isRunning.value ||
    isReloadingSaplingSession.value ||
    saplingRuntimeState.value.kind === "params-preloading" ||
    saplingRuntimeState.value.kind === "params-ready",
);

const handlePreloadSaplingParams = async () => {
  try {
    const snapshot = await preloadSaplingProvingParams();
    syncSaplingRuntimeState(snapshot);

    toast.success("Sapling proving params ready", {
      description:
        snapshot.lastPreloadDurationMs === null
          ? "Future proof-generating actions should be faster in this session."
          : `Downloaded from sapling.taquito.io in ${formatElapsedMs(snapshot.lastPreloadDurationMs)}.`,
    });
  } catch (error) {
    const message = getSaplingErrorMessage(error);
    syncSaplingRuntimeState(getSaplingRuntimeSnapshot());

    toast.error("Failed to preload Sapling proving params", {
      description: message,
    });
  }
};

const resetSaplingPageState = () => {
  userKey.value = null;
  aliceKey.value = null;
  transactionHistory.value = null;
  aliceTransactionHistory.value = null;
  userBalance.value = null;
  aliceBalance.value = null;
  saplingRuntimeState.value = { kind: "booting" };
  diagramStore.resetDiagram();
};

const handleReloadWithFreshSaplingParams = async () => {
  isReloadingSaplingSession.value = true;
  resetSaplingPageState();
  await nextTick();
  reloadWithFreshSaplingParams({ clearKeys: false });
};

const confirmKeyReplacement = (actionLabel: string): boolean => {
  if (
    userBalance.value !== null &&
    userBalance.value > 0 &&
    typeof window !== "undefined" &&
    typeof window.confirm === "function"
  ) {
    return window.confirm(
      `Your current Sapling key still has ${formatBalance(userBalance.value)} ꜩ shielded. Make sure you have copied your mnemonic before you ${actionLabel}. Continue?`,
    );
  }
  return true;
};

const handleRegenerateKeys = async () => {
  if (!confirmKeyReplacement("generate new keys")) {
    return;
  }

  try {
    isRunning.value = true;
    const [newUserKey, newAliceKey] = await Promise.all([
      generateUserSpendingKey({ forceNew: true }),
      generateAliceSpendingKey({ forceNew: true }),
    ]);
    userKey.value = newUserKey;
    aliceKey.value = newAliceKey;
    transactionHistory.value = null;
    aliceTransactionHistory.value = null;
    userBalance.value = null;
    aliceBalance.value = null;
    toast.success("Generated new Sapling session keys");
  } catch (error) {
    toast.error(`Failed to generate keys: ${getSaplingErrorMessage(error)}`);
  } finally {
    isRunning.value = false;
  }
};

const handleImportMnemonic = async () => {
  if (!mnemonicInput.value.trim()) return;
  if (!confirmKeyReplacement("restore another mnemonic")) {
    return;
  }

  try {
    isRunning.value = true;
    const restoredKey = await generateUserSpendingKey({
      mnemonic: mnemonicInput.value,
    });
    userKey.value = restoredKey;
    transactionHistory.value = null;
    aliceTransactionHistory.value = null;
    userBalance.value = null;
    mnemonicInput.value = "";
    showMnemonicImport.value = false;
    toast.success("Restored Sapling spending key");
  } catch (error) {
    toast.error(`Failed to restore mnemonic: ${getSaplingErrorMessage(error)}`);
  } finally {
    isRunning.value = false;
  }
};

const handleProofParamError = (error: unknown) => {
  if (!isSaplingParamsError(error)) {
    return;
  }

  syncSaplingRuntimeState(markSaplingProvingParamsFailed(error));
};

const refreshOpenedInspectionPanels = async () => {
  if (!walletStore.getTezos || !userKey.value || !contractAddress.value) {
    return;
  }

  const tasks: Promise<void>[] = [];

  if (userBalance.value !== null) {
    tasks.push(
      (async () => {
        const [uBal, aBal] = await Promise.all([
          getUserSaplingBalance(
            walletStore.getTezos!,
            contractAddress.value,
            userKey.value!,
          ),
          aliceKey.value
            ? getUserSaplingBalance(
                walletStore.getTezos!,
                contractAddress.value,
                aliceKey.value,
              )
            : Promise.resolve(null),
        ]);
        userBalance.value = uBal;
        aliceBalance.value = aBal;
      })(),
    );
  }

  if (transactionHistory.value !== null) {
    tasks.push(
      (async () => {
        const [uHist, aHist] = await Promise.all([
          getUserTransactionHistory(
            walletStore.getTezos!,
            contractAddress.value,
            userKey.value!,
          ),
          aliceKey.value
            ? getUserTransactionHistory(
                walletStore.getTezos!,
                contractAddress.value,
                aliceKey.value,
              )
            : Promise.resolve(null),
        ]);
        transactionHistory.value = uHist;
        aliceTransactionHistory.value = aHist;
      })(),
    );
  }

  if (tasks.length > 0) {
    isRefreshingInspection.value = true;
    try {
      await Promise.allSettled(tasks);
    } finally {
      isRefreshingInspection.value = false;
    }
  }
};

const loadInitialBalancesIfReady = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !contractAddress.value ||
    userBalance.value !== null ||
    isRefreshingInspection.value
  ) {
    return;
  }

  isRefreshingInspection.value = true;
  try {
    const [uBal, aBal] = await Promise.all([
      getUserSaplingBalance(
        walletStore.getTezos,
        contractAddress.value,
        userKey.value,
      ),
      aliceKey.value
        ? getUserSaplingBalance(
            walletStore.getTezos,
            contractAddress.value,
            aliceKey.value,
          )
        : Promise.resolve(null),
    ]);
    if (userBalance.value === null) {
      userBalance.value = uBal;
      aliceBalance.value = aBal;
    }
  } catch {
    // Background initial balance check is best-effort
  } finally {
    isRefreshingInspection.value = false;
  }
};

watch(
  () => walletStore.getAddress,
  (addr) => {
    if (addr) {
      void loadInitialBalancesIfReady();
    }
  },
);

onMounted(async () => {
  diagramStore.setTestDiagram("sapling", activeOperationTab.value);
  contractAddress.value = CONTRACT_ADDRESS;

  setSaplingStoreHooks({
    setTestDiagram: (testId, key) => diagramStore.setTestDiagram(testId, key),
    setProgress: (step) => diagramStore.setProgress(step),
    setFeeEstimate: (estimate) => diagramStore.setFeeEstimate(estimate),
    setOperationHash: (opHash) => diagramStore.setOperationHash(opHash),
    setCompleted: () => diagramStore.setCompleted(),
    getConfirmationCount: () => settingsStore.getConfirmationCount,
  });

  unsubscribeRuntimeSnapshot = subscribeSaplingRuntimeSnapshot(
    syncSaplingRuntimeState,
  );

  // Automatically generate or restore session keys on load
  try {
    const [uKey, aKey] = await Promise.all([
      generateUserSpendingKey(),
      generateAliceSpendingKey(),
    ]);

    userKey.value = uKey;
    aliceKey.value = aKey;
    isBootingKeys.value = false;
    syncSaplingRuntimeState(getSaplingRuntimeSnapshot());
    void loadInitialBalancesIfReady();
  } catch (error) {
    isBootingKeys.value = false;
    const message = getSaplingErrorMessage(error);
    console.error("Key generation error:", error);

    const runtimeSnapshot = getSaplingRuntimeSnapshot();
    if (runtimeSnapshot.moduleStatus === "failed") {
      syncSaplingRuntimeState(runtimeSnapshot);
    } else {
      saplingRuntimeState.value = {
        kind: "module-error",
        errorMessage: message,
      };
    }

    toast.error("Failed to generate Sapling keys", {
      description: message,
    });
  }
});

onBeforeUnmount(() => {
  unsubscribeRuntimeSnapshot?.();
  setSaplingStoreHooks(undefined);
});

const handleShieldToUser = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !isValidAmount(shieldAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    activeOperation.value = "shield";
    loadingToastId = toast.info(
      "Shielding tez (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await shieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      shieldAmount.value,
      shieldMemo.value,
    );

    toast.success(`Shielded ${shieldAmount.value} ꜩ into the Sapling pool`);
    activeOperationTab.value = "transfer";
    void refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Shield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
    activeOperation.value = null;
    isRunning.value = false;
  }
};

const handleTransferToAlice = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !aliceAddress.value ||
    !isValidAmount(transferAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    activeOperation.value = "transfer";
    loadingToastId = toast.info(
      "Transferring to Alice (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await transferToAlice(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      aliceAddress.value,
      transferAmount.value,
      transferMemo.value,
    );

    toast.success(`Transferred ${transferAmount.value} ꜩ privately to Alice`);
    activeOperationTab.value = "unshield";
    void refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Transfer error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
    activeOperation.value = null;
    isRunning.value = false;
  }
};

const handleUnshieldToUser = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !walletStore.getAddress ||
    !isValidAmount(unshieldAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    activeOperation.value = "unshield";
    loadingToastId = toast.info(
      "Unshielding tez (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await unshieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      walletStore.getAddress,
      unshieldAmount.value,
    );

    toast.success(
      `Unshielded ${unshieldAmount.value} ꜩ to ${walletStore.getAddress}`,
    );
    void refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Unshield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
    activeOperation.value = null;
    isRunning.value = false;
  }
};

const handleGetTransactionHistory = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    activeOperation.value = "history";
    toast.info("Fetching transaction history...");

    const [history, aliceHistory] = await Promise.all([
      getUserTransactionHistory(
        walletStore.getTezos,
        contractAddress.value,
        userKey.value,
      ),
      aliceKey.value
        ? getUserTransactionHistory(
            walletStore.getTezos,
            contractAddress.value,
            aliceKey.value,
          )
        : Promise.resolve(null),
    ]);

    transactionHistory.value = history;
    aliceTransactionHistory.value = aliceHistory;
    toast.success(`Found ${history.total} note(s) and transfer(s)`);
  } catch (error) {
    console.error("Transaction history error:", error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    activeOperation.value = null;
    isRunning.value = false;
  }
};

const handleGetBalance = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    activeOperation.value = "balance";
    toast.info("Fetching shielded balances...");

    const [uBalance, aBalance] = await Promise.all([
      getUserSaplingBalance(
        walletStore.getTezos,
        contractAddress.value,
        userKey.value,
      ),
      aliceKey.value
        ? getUserSaplingBalance(
            walletStore.getTezos,
            contractAddress.value,
            aliceKey.value,
          )
        : Promise.resolve(null),
    ]);

    userBalance.value = uBalance;
    aliceBalance.value = aBalance;
    toast.success("Shielded balances retrieved");
  } catch (error) {
    console.error("Balance fetch error:", error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    activeOperation.value = null;
    isRunning.value = false;
  }
};

const formatBalance = (balance: number): string => {
  return (balance / 1000000).toFixed(6);
};
</script>

<style scoped>
@keyframes sapling-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sapling-indeterminate {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(300%);
  }
}

.sapling-indeterminate-bar {
  width: 35%;
  animation: sapling-indeterminate 1.2s ease-in-out infinite;
  will-change: transform;
}

.sapling-spinner {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.sapling-spinner::before,
.sapling-spinner::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.sapling-spinner::before {
  border: 2px solid currentColor;
  opacity: 0.2;
}

.sapling-spinner::after {
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-right-color: currentColor;
  animation: sapling-spin 0.85s linear infinite;
}

.sapling-spinner-sm {
  width: 1rem;
  height: 1rem;
}

.sapling-spinner-lg {
  width: 2.5rem;
  height: 2.5rem;
}

.sapling-spinner-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: currentColor;
  transform: translate(-50%, -50%);
  opacity: 0.8;
}
</style>
