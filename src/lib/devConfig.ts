export const REOWN_PROJECT_ID_ENV = "VITE_REOWN_PROJECT_ID";

/** The configured Reown project ID, or undefined when unset or blank. */
export const readReownProjectId = (
  value: string | undefined,
): string | undefined => value?.trim() || undefined;

export type ReownProjectIdCheck =
  { ok: true; message: string } | { ok: false; message: string };

/**
 * Deploy-build check. Without a project ID, Beacon pairs WalletConnect wallets
 * on its built-in demo ID, which is deprecated and goes away in the next Beacon
 * minor release.
 */
export const checkReownProjectId = (
  value: string | undefined,
): ReownProjectIdCheck =>
  readReownProjectId(value)
    ? { ok: true, message: `${REOWN_PROJECT_ID_ENV} is set.` }
    : {
        ok: false,
        message: `${REOWN_PROJECT_ID_ENV} is not set, so WalletConnect would use Beacon's deprecated demo Reown project ID. Set it to the dApp's project ID from https://dashboard.reown.com/.`,
      };

export interface DevNotice {
  id: "kukai-url-override" | "reown-demo-project-id";
  text: string;
}

export interface DevNoticeInput {
  /** `import.meta.env.DEV` */
  dev: boolean;
  kukaiUrlOverride: string | undefined;
  reownProjectId: string | undefined;
}

/** Notices the dev banner shows about local-only configuration. */
export const getDevNotices = ({
  dev,
  kukaiUrlOverride,
  reownProjectId,
}: DevNoticeInput): DevNotice[] => {
  if (!dev) return [];
  const notices: DevNotice[] = [];
  if (kukaiUrlOverride) {
    notices.push({
      id: "kukai-url-override",
      text: `Dev override: Kukai links open ${kukaiUrlOverride} (KUKAI_URL_OVERRIDE)`,
    });
  }
  if (!readReownProjectId(reownProjectId)) {
    notices.push({
      id: "reown-demo-project-id",
      text: `WalletConnect is using Beacon's deprecated demo Reown project ID. Set ${REOWN_PROJECT_ID_ENV} in .env.local.`,
    });
  }
  return notices;
};
