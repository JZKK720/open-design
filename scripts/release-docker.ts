import { execFile as execFileCallback } from "node:child_process";
import { appendFileSync } from "node:fs";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/;
const dockerTagPattern = /^open-design-docker-v(\d+\.\d+\.\d+)$/;

type GitHubRelease = {
  draft?: boolean;
  name?: string | null;
  prerelease?: boolean;
  tag_name?: string;
};

type ParsedVersion = {
  parsed: [number, number, number];
  value: string;
};

function fail(message: string): never {
  console.error(`[release-docker] ${message}`);
  process.exit(1);
}

function parseVersion(value: string): [number, number, number] | null {
  const match = versionPattern.exec(value);
  if (match == null) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: [number, number, number], right: [number, number, number]): number {
  const pairs = [
    [left[0], right[0]],
    [left[1], right[1]],
    [left[2], right[2]],
  ] as const;

  for (const [leftPart, rightPart] of pairs) {
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

function extractDockerVersion(release: GitHubRelease): ParsedVersion | null {
  const candidates = [release.tag_name, release.name].filter((value): value is string => typeof value === "string");

  for (const candidate of candidates) {
    const tagMatch = dockerTagPattern.exec(candidate);
    const value = tagMatch?.[1] ?? candidate.match(/\b(\d+\.\d+\.\d+)\b/)?.[1];
    if (value == null) continue;

    const parsed = parseVersion(value);
    if (parsed != null) return { parsed, value };
  }

  return null;
}

async function fetchReleases(repository: string): Promise<GitHubRelease[]> {
  const releases: GitHubRelease[] = [];
  for (let page = 1; ; page += 1) {
    const { stdout } = await execFile("gh", ["api", `repos/${repository}/releases?per_page=100&page=${page}`]);
    const batch = JSON.parse(stdout) as GitHubRelease[];
    if (batch.length === 0) break;
    releases.push(...batch);
  }
  return releases;
}

function setOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath == null || outputPath.length === 0) return;
  appendFileSync(outputPath, `${name}=${value}\n`);
}

const repository = process.env.GITHUB_REPOSITORY ?? fail("GITHUB_REPOSITORY is required");
const releaseVersion = process.env.DOCKER_RELEASE_VERSION ?? fail("DOCKER_RELEASE_VERSION is required");
const parsedVersion = parseVersion(releaseVersion) ?? fail(`Docker release version must be x.y.z; got ${releaseVersion}`);
const [imageOwner, repositoryName] = repository.split("/");
if (imageOwner == null || repositoryName == null) {
  fail(`GITHUB_REPOSITORY must be in owner/repo format; got ${repository}`);
}

const imageOwnerLower = imageOwner.toLowerCase();
const releaseTag = `open-design-docker-v${releaseVersion}`;
const releaseName = `Open Design Docker ${releaseVersion}`;
const releases = await fetchReleases(repository);

let latestRelease: ParsedVersion | null = null;
for (const release of releases) {
  if (release.draft === true || release.prerelease === true) continue;

  const parsedRelease = extractDockerVersion(release);
  if (parsedRelease == null) continue;

  if (release.tag_name === releaseTag) {
    fail(`docker release ${releaseTag} already exists; bump the requested version before publishing`);
  }

  if (latestRelease == null || compareVersions(parsedRelease.parsed, latestRelease.parsed) > 0) {
    latestRelease = parsedRelease;
  }
}

if (latestRelease != null && compareVersions(parsedVersion, latestRelease.parsed) <= 0) {
  fail(`docker release version ${releaseVersion} must be strictly greater than latest docker release ${latestRelease.value}`);
}

console.log(`[release-docker] version: ${releaseVersion}`);
console.log(`[release-docker] release tag: ${releaseTag}`);
console.log(`[release-docker] image owner: ${imageOwnerLower}`);
console.log(`[release-docker] image repository: ${repositoryName}`);
if (latestRelease != null) {
  console.log(`[release-docker] previous docker release: ${latestRelease.value}`);
}

setOutput("image_owner_lower", imageOwnerLower);
setOutput("previous_release", latestRelease?.value ?? "");
setOutput("release_name", releaseName);
setOutput("release_tag", releaseTag);
setOutput("repository_name", repositoryName);
setOutput("version", releaseVersion);