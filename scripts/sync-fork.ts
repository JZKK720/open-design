/**
 * sync-fork.ts — rebase the JZKK720 fork onto upstream nexu-io/open-design.
 *
 * Why this exists
 * ---------------
 * The fork carries ~13 custom commits on top of upstream `main`:
 *   - GHCR nightly multi-arch publish workflow
 *   - deploy/docker-compose.yml + patch files (fork GHCR image, auto-restart)
 *   - daemon: Ollama /api/tags provider models, RFC1918 private-peer bypass
 *   - web: "Ollama Self-hosted (Docker host)" BYOK preset
 *   - .gitignore: .copilot/ scratch
 *
 * Rebasing by hand is error-prone: stale `origin/main`, forgotten fetch,
 * uncommitted working tree, silent conflict on the compose file, or pushing
 * the wrong remote. This script makes the flow deterministic and safe.
 *
 * Flow
 * ----
 *   1. Preflight: clean working tree, on `main`, remotes `origin`+`fork` exist.
 *   2. Fetch upstream (`origin`) and fork.
 *   3. Show the incoming upstream commits and the fork-only commits.
 *   4. `git rebase origin/main` — replays fork commits on top of upstream.
 *   5. On conflict: print the conflicted files and stop. User resolves,
 *      `git rebase --continue`, then re-runs this script (it resumes by
 *      detecting the in-progress rebase and skipping to the push step).
 *   6. Force-push the rebased `main` to `fork` (the fork's main is the
 *      integration branch; force-push is required after rebase).
 *
 * Usage
 * -----
 *   pnpm sync:fork              # full flow: fetch + rebase + push
 *   pnpm sync:fork --check      # preflight + fetch + show diff, no rebase
 *   pnpm sync:fork --no-push    # rebase but do not push to fork
 *
 * Exit codes
 * ----------
 *   0  success (or rebase resumed + pushed)
 *   1  preflight failure (dirty tree, wrong branch, missing remote)
 *   2  rebase in progress — user must resolve + `git rebase --continue`,
 *      then re-run this script
 *   3  rebase failed with conflicts — user must resolve manually
 *
 * Notes
 * -----
 * - This script NEVER touches `origin` (upstream). It only fetches from it.
 * - Force-push goes to `fork/main` only.
 * - If a rebase is already in progress when the script starts, it skips
 *   fetch+rebase and jumps straight to the push step (so you can re-run
 *   after resolving conflicts).
 */

import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const UPSTREAM_REMOTE = "origin";
const UPSTREAM_OWNER = "nexu-io";
const UPSTREAM_REPO = "open-design";
const FORK_REMOTE = "fork";
const FORK_OWNER = "JZKK720";
const INTEGRATION_BRANCH = "main";

type Args = {
  check: boolean;
  noPush: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { check: false, noPush: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--check") args.check = true;
    else if (arg === "--no-push") args.noPush = true;
    else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      console.error(`[sync-fork] unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }
  return args;
}

function printUsage(): void {
  console.log(`Usage: pnpm sync:fork [--check] [--no-push]

  --check     Preflight + fetch + show incoming commits, no rebase, no push.
  --no-push   Rebase but do not force-push to fork.
  --help      Show this help.`);
}

function fail(message: string, code = 1): never {
  console.error(`[sync-fork] ${message}`);
  process.exit(code);
}

async function git(...args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execFile("git", args, { maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`git ${args.join(" ")} failed: ${message}`);
  }
}

async function gitOk(...args: string[]): Promise<boolean> {
  try {
    await execFile("git", args, { maxBuffer: 10 * 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
}

async function gitLines(...args: string[]): Promise<string[]> {
  const { stdout } = await git(...args);
  return stdout.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
}

/** True if `git status --porcelain` has any entry (staged or unstaged). */
async function isWorkingTreeDirty(): Promise<boolean> {
  const { stdout } = await git("status", "--porcelain");
  return stdout.trim().length > 0;
}

async function currentBranch(): Promise<string> {
  const { stdout } = await git("rev-parse", "--abbrev-ref", "HEAD");
  return stdout.trim();
}

async function remotes(): Promise<Set<string>> {
  const { stdout } = await git("remote");
  return new Set(stdout.split("\n").map((r) => r.trim()).filter((r) => r.length > 0));
}

async function rebaseInProgress(): Promise<boolean> {
  return gitOk("rev-parse", "--verify", "REBASE_HEAD");
}

async function hasUpstreamCommits(): Promise<boolean> {
  // origin/main..main = commits on fork main not on upstream (fork-only)
  // main..origin/main = commits on upstream not on fork main (incoming)
  const incoming = await gitLines("rev-list", "--count", `${INTEGRATION_BRANCH}..${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}`);
  return (incoming[0] ?? "0") !== "0";
}

async function showIncomingUpstream(): Promise<void> {
  const range = `${INTEGRATION_BRANCH}..${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}`;
  const incoming = await gitLines("log", "--oneline", range);
  if (incoming.length === 0) {
    console.log("[sync-fork] no new upstream commits — fork is up to date.");
    return;
  }
  console.log(`[sync-fork] ${incoming.length} new upstream commit(s):`);
  for (const line of incoming) {
    console.log(`  ${line}`);
  }
}

async function showForkOnly(): Promise<void> {
  const range = `${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}..${INTEGRATION_BRANCH}`;
  const forkOnly = await gitLines("log", "--oneline", range);
  if (forkOnly.length === 0) {
    console.log("[sync-fork] no fork-only commits — fork matches upstream.");
    return;
  }
  console.log(`[sync-fork] ${forkOnly.length} fork-only commit(s) to rebase:`);
  for (const line of forkOnly) {
    console.log(`  ${line}`);
  }
}

async function preflight(): Promise<void> {
  const branch = await currentBranch();
  if (branch !== INTEGRATION_BRANCH) {
    fail(`not on '${INTEGRATION_BRANCH}' (currently on '${branch}'). Switch to ${INTEGRATION_BRANCH} first.`);
  }

  const remoteSet = await remotes();
  if (!remoteSet.has(UPSTREAM_REMOTE)) {
    fail(`missing remote '${UPSTREAM_REMOTE}'. Add it:\n  git remote add ${UPSTREAM_REMOTE} https://github.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}.git`);
  }
  if (!remoteSet.has(FORK_REMOTE)) {
    fail(`missing remote '${FORK_REMOTE}'. Add it:\n  git remote add ${FORK_REMOTE} https://github.com/${FORK_OWNER}/${UPSTREAM_REPO}.git`);
  }

  if (await isWorkingTreeDirty()) {
    fail("working tree is dirty. Commit or stash your changes first:\n  git status\n  git stash");
  }
}

async function fetchAll(): Promise<void> {
  console.log(`[sync-fork] fetching ${UPSTREAM_REMOTE} (upstream ${UPSTREAM_OWNER}/${UPSTREAM_REPO})...`);
  await git("fetch", UPSTREAM_REMOTE, INTEGRATION_BRANCH);
  console.log(`[sync-fork] fetching ${FORK_REMOTE} (fork ${FORK_OWNER}/${UPSTREAM_REPO})...`);
  await git("fetch", FORK_REMOTE, INTEGRATION_BRANCH);
}

async function runRebase(): Promise<void> {
  console.log(`[sync-fork] rebasing ${INTEGRATION_BRANCH} onto ${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}...`);
  try {
    const { stdout, stderr } = await git("rebase", `${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}`);
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.error(stderr.trim());
    console.log("[sync-fork] rebase complete.");
  } catch (error) {
    // Rebase conflicts: git rebase exits non-zero. Check if it's a conflict
    // (resumable) vs a hard failure.
    const inProgress = await rebaseInProgress();
    if (inProgress) {
      const conflicts = await gitLines("diff", "--name-only", "--diff-filter=U");
      console.error("[sync-fork] rebase stopped due to conflicts in:");
      for (const file of conflicts) {
        console.error(`  ${file}`);
      }
      console.error("\n[sync-fork] resolve each conflict, then:\n  git add <file>\n  git rebase --continue\n\nThen re-run: pnpm sync:fork");
      fail("rebase conflicts need manual resolution", 3);
    }
    const message = error instanceof Error ? error.message : String(error);
    fail(`rebase failed (not a conflict): ${message}`, 3);
  }
}

async function pushFork(): Promise<void> {
  console.log(`[sync-fork] force-pushing rebased ${INTEGRATION_BRANCH} to ${FORK_REMOTE}...`);
  try {
    const { stdout, stderr } = await git("push", "--force-with-lease", FORK_REMOTE, INTEGRATION_BRANCH);
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.log(stderr.trim());
    console.log(`[sync-fork] done. fork/${INTEGRATION_BRANCH} is now rebased onto ${UPSTREAM_REMOTE}/${INTEGRATION_BRANCH}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`push to ${FORK_REMOTE} failed: ${message}\nIf the lease is stale, verify ${FORK_REMOTE}/${INTEGRATION_BRANCH} then use --force.`, 3);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  // Resume path: if a rebase is already in progress, the user has resolved
  // and run `git rebase --continue` themselves. Skip to push.
  if (await rebaseInProgress()) {
    console.log("[sync-fork] rebase in progress — assuming conflicts resolved.");
    const stillDirty = await isWorkingTreeDirty();
    if (stillDirty) {
      const conflicts = await gitLines("diff", "--name-only", "--diff-filter=U");
      if (conflicts.length > 0) {
        console.error("[sync-fork] unresolved conflicts remain:");
        for (const file of conflicts) {
          console.error(`  ${file}`);
        }
        fail("resolve conflicts, `git add`, `git rebase --continue`, then re-run this script.", 2);
      }
    }
    // Rebase HEAD exists but no conflicts — user already ran --continue and
    // it finished. Fall through to push.
    console.log("[sync-fork] rebase appears complete. Proceeding to push.");
    if (args.noPush) {
      console.log("[sync-fork] --no-push set; skipping push. Run `git push --force-with-lease fork main` when ready.");
      return;
    }
    await pushFork();
    return;
  }

  await preflight();
  await fetchAll();

  console.log();
  await showIncomingUpstream();
  console.log();
  await showForkOnly();
  console.log();

  if (args.check) {
    console.log("[sync-fork] --check: stopping before rebase.");
    return;
  }

  if (!(await hasUpstreamCommits())) {
    console.log("[sync-fork] nothing to rebase — fork is already up to date with upstream.");
    return;
  }

  await runRebase();

  if (args.noPush) {
    console.log("[sync-fork] --no-push: rebase done, skipping push. Run `git push --force-with-lease fork main` when ready.");
    return;
  }

  await pushFork();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`unexpected error: ${message}`, 1);
});