/**
 * Property-based tests for CI path filter logic
 * Properties 18 & 19: path filter correctly triggers build jobs
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getTriggeredJobs, BUILD_JOBS, ALL_BUILD_JOBS } from '../../shared/src/ci-path-filter';

describe('CI Path Filter — Property Tests', () => {
  // Property 18: /android/customer/** always triggers customer-apk
  it('Property 18: paths under /android/customer/ always trigger customer-apk', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9_\-\/\.]+$/),
        (suffix) => {
          const path = `android/customer/${suffix}`;
          const triggered = getTriggeredJobs([path]);
          expect(triggered.has('customer-apk')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19: /backend/lambda/** always triggers lambda-deploy
  it('Property 19: paths under /backend/lambda/ always trigger lambda-deploy', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9_\-\/\.]+$/),
        (suffix) => {
          const path = `backend/lambda/${suffix}`;
          const triggered = getTriggeredJobs([path]);
          expect(triggered.has('lambda-deploy')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: /shared/** triggers ALL jobs
  it('paths under /shared/ trigger all build jobs', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9_\-\/\.]+$/),
        (suffix) => {
          const path = `shared/${suffix}`;
          const triggered = getTriggeredJobs([path]);
          for (const job of BUILD_JOBS) {
            expect(triggered.has(job)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: result is always a subset of BUILD_JOBS
  it('triggered jobs are always a subset of BUILD_JOBS', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        (paths) => {
          const triggered = getTriggeredJobs(paths);
          for (const job of triggered) {
            expect(BUILD_JOBS).toContain(job);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property: empty array returns empty set
  it('empty changed paths returns empty set', () => {
    const triggered = getTriggeredJobs([]);
    expect(triggered.size).toBe(0);
  });

  // Property: root config files trigger all jobs
  it('root config files trigger all jobs', () => {
    const rootConfigs = [
      'package.json',
      'tsconfig.json',
      'vitest.config.ts',
      'vite.config.ts',
      '.github/workflows/deploy.yml',
      'Dockerfile',
    ];
    for (const config of rootConfigs) {
      const triggered = getTriggeredJobs([config]);
      expect(triggered.size).toBe(BUILD_JOBS.length);
    }
  });

  // Property: multiple paths union their triggered jobs
  it('multiple paths produce the union of their individual triggered jobs', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('android/customer/MainActivity.java', 'backend/lambda/index.js'),
          fc.constantFrom('frontend/src/App.tsx', 'android/driver/MainActivity.java'),
        ),
        ([path1, path2]) => {
          const combined = getTriggeredJobs([path1, path2]);
          const jobs1 = getTriggeredJobs([path1]);
          const jobs2 = getTriggeredJobs([path2]);
          for (const job of jobs1) expect(combined.has(job)).toBe(true);
          for (const job of jobs2) expect(combined.has(job)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property: /android/driver/** triggers driver-apk
  it('android/driver paths trigger driver-apk', () => {
    const driverPaths = [
      'android/driver/app/src/main/java/com/opusaimobility/driver/MainActivity.java',
      'android/driver/app/build.gradle',
    ];
    for (const path of driverPaths) {
      const triggered = getTriggeredJobs([path]);
      expect(triggered.has('driver-apk')).toBe(true);
    }
  });

  // Property: /frontend/** and /public/** trigger frontend
  it('frontend and public paths trigger frontend job', () => {
    const frontendPaths = [
      'frontend/src/App.tsx',
      'frontend/src/components/MapView.tsx',
      'public/manifest.json',
      'public/index.html',
    ];
    for (const path of frontendPaths) {
      const triggered = getTriggeredJobs([path]);
      expect(triggered.has('frontend')).toBe(true);
    }
  });
});
