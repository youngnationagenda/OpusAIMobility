/**
 * CI Path Filter Logic
 *
 * Determines which build jobs should be triggered based on changed file paths
 * in a commit. Implements the path-based filtering rules from the CI/CD pipeline
 * configuration defined in the design document.
 *
 * Path filter rules:
 * - /apps/customer/** → 'customer-apk'
 * - /aws/lambda/** → 'lambda-deploy'
 * - /infra/docker/terra-api/** or /apps/terra-api/** → 'terra-container'
 * - /src/** or /public/** → 'frontend'
 * - /packages/** or root configs → ALL jobs
 */

/** All possible build job identifiers */
export const BUILD_JOBS = [
  'customer-apk',
  'lambda-deploy',
  'terra-container',
  'frontend',
] as const;

export type BuildJob = (typeof BUILD_JOBS)[number];

/** Set of all build jobs (used when shared paths trigger everything) */
export const ALL_BUILD_JOBS: ReadonlySet<BuildJob> = new Set(BUILD_JOBS);

/**
 * Root config file patterns that trigger all builds.
 * These are files at the repository root that affect all components.
 */
const ROOT_CONFIG_PATTERNS = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vitest.config.ts',
  'vite.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierrc.json',
  '.github/workflows/',
  'Dockerfile',
] as const;

/**
 * Normalizes a file path to use forward slashes and ensure it starts with `/`.
 */
function normalizePath(filePath: string): string {
  let normalized = filePath.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized;
}

/**
 * Checks if a path is a root config file (i.e., a file in the root directory
 * that is a known configuration file).
 */
function isRootConfig(normalizedPath: string): boolean {
  // A root config is a file directly in root (only one path segment after leading slash)
  // or matches known config patterns
  for (const pattern of ROOT_CONFIG_PATTERNS) {
    if (normalizedPath === '/' + pattern) {
      return true;
    }
    // Handle directory-style patterns (e.g., .github/workflows/)
    if (pattern.endsWith('/') && normalizedPath.startsWith('/' + pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines which build jobs should be triggered for a single changed file path.
 */
function getJobsForPath(filePath: string): Set<BuildJob> {
  const normalized = normalizePath(filePath);
  const jobs = new Set<BuildJob>();

  // /apps/customer/** → customer-apk
  if (normalized.startsWith('/apps/customer/')) {
    jobs.add('customer-apk');
  }

  // /aws/lambda/** → lambda-deploy
  if (normalized.startsWith('/aws/lambda/')) {
    jobs.add('lambda-deploy');
  }

  // /infra/docker/terra-api/** or /apps/terra-api/** → terra-container
  if (
    normalized.startsWith('/infra/docker/terra-api/') ||
    normalized.startsWith('/apps/terra-api/')
  ) {
    jobs.add('terra-container');
  }

  // /src/** or /public/** → frontend
  if (normalized.startsWith('/src/') || normalized.startsWith('/public/')) {
    jobs.add('frontend');
  }

  // /packages/** or root configs → ALL jobs
  if (normalized.startsWith('/packages/') || isRootConfig(normalized)) {
    return new Set(BUILD_JOBS);
  }

  return jobs;
}

/**
 * Determines the complete set of build jobs that should be triggered
 * for a given set of changed file paths.
 *
 * @param changedPaths - Array of file paths that changed in a commit
 * @returns Set of build job identifiers that should be triggered
 */
export function getTriggeredJobs(changedPaths: string[]): Set<BuildJob> {
  const triggeredJobs = new Set<BuildJob>();

  for (const filePath of changedPaths) {
    const jobs = getJobsForPath(filePath);
    for (const job of jobs) {
      triggeredJobs.add(job);
    }

    // Early exit: if all jobs are triggered, no need to check more paths
    if (triggeredJobs.size === BUILD_JOBS.length) {
      break;
    }
  }

  return triggeredJobs;
}
