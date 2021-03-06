import { vol } from 'memfs';

import { mockExpoXDL } from '../../../__tests__/mock-utils';
import {
  jester,
  testAppJson,
  testBundleIdentifier,
  testExperienceName,
} from '../../../credentials/test-fixtures/mocks-constants';
import {
  getApiV2WrapperMock,
  testAllCredentialsForApp,
} from '../../../credentials/test-fixtures/mocks-ios';
import { BuilderOptions } from '../BaseBuilder.types';
import IOSBuilder from '../ios/IOSBuilder';

jest.setTimeout(30e3); // 30s

jest.mock('fs');

let mockIosCredentialsApi;

jest.mock('@expo/plist', () => {
  const plistModule = jest.requireActual('@expo/plist');
  return {
    ...plistModule,
    parse: jest.fn(() => ({ ExpirationDate: new Date('Apr 30, 3000'), TeamIdentifier: ['sdf'] })),
  };
});
jest.mock('../utils', () => {
  const utilsModule = jest.requireActual('../utils');
  return {
    ...utilsModule,
    checkIfSdkIsSupported: jest.fn(),
  };
});
jest.mock('commander', () => {
  const commander = jest.requireActual('commander');
  return {
    ...commander,
    nonInteractive: true,
  };
});
jest.mock('../../../credentials/api/IosApiV2Wrapper', () => {
  return jest.fn(() => mockIosCredentialsApi);
});

const mockedXDLModules = {
  UserManager: {
    ensureLoggedInAsync: jest.fn(() => jester),
    getCurrentUserAsync: jest.fn(() => jester),
    getCurrentUsernameAsync: jest.fn(() => jester.username),
  },
  ApiV2: {
    clientForUser: jest.fn(),
  },
  Project: {
    getBuildStatusAsync: jest.fn(() => ({ jobs: [] })),
    getLatestReleaseAsync: jest.fn(() => ({ publicationId: 'test-publication-id' })),
    findReusableBuildAsync: jest.fn(() => ({})),
    startBuildAsync: jest.fn(() => ({})),
  },
  IosCodeSigning: {
    validateProvisioningProfile: jest.fn(),
  },
  PKCS12Utils: { getP12CertFingerprint: jest.fn(), findP12CertSerialNumber: jest.fn() },
};
mockExpoXDL(mockedXDLModules);

beforeEach(() => {
  mockIosCredentialsApi = getApiV2WrapperMock();
});

describe('build ios', () => {
  const projectRootNoBundleId = '/test-project-no-bundle-id';
  const projectRoot = '/test-project';
  const packageJson = JSON.stringify(
    {
      name: 'testing123',
      version: '0.1.0',
      description: 'fake description',
      main: 'index.js',
    },
    null,
    2
  );
  const appJson = JSON.stringify(testAppJson);

  beforeAll(() => {
    vol.fromJSON({
      [projectRoot + '/package.json']: packageJson,
      [projectRoot + '/app.json']: appJson,
      // no bundle id
      [projectRootNoBundleId + '/package.json']: packageJson,
      [projectRootNoBundleId + '/app.config.json']: JSON.stringify({ sdkVersion: '38.0.0' }),
    });
  });

  afterAll(() => {
    vol.reset();
  });

  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  beforeAll(() => {
    console.warn = jest.fn();
    console.log = jest.fn();
    console.error = jest.fn();
  });
  afterAll(() => {
    console.warn = originalWarn;
    console.log = originalLog;
    console.error = originalError;
  });

  afterEach(() => {
    const mockedXDLModuleObjects = Object.values(mockedXDLModules);
    for (const module of mockedXDLModuleObjects) {
      const xdlFunctions = Object.values(module);
      for (const xdlFunction of xdlFunctions) {
        xdlFunction.mockClear();
      }
    }
  });

  it('fails if no bundle-id is used in non-interactive mode', async () => {
    const projectRoot = '/test-project-no-bundle-id';

    const builderOptions: BuilderOptions = {
      type: 'archive',
      parent: { nonInteractive: true },
    };

    const iosBuilder = new IOSBuilder(projectRoot, builderOptions);
    await expect(iosBuilder.command()).rejects.toThrow(
      /Your project must have a `bundleIdentifier` set in the Expo config/
    );

    // expect that we get the latest release and started build
    // expect(mockedXDLModules.Project.getLatestReleaseAsync.mock.calls.length).toBe(1);
    // expect(mockedXDLModules.Project.startBuildAsync.mock.calls.length).toBe(1);
  });
  it('archive build: basic case', async () => {
    const projectRoot = '/test-project';
    (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(
      () => testAllCredentialsForApp
    );

    const builderOptions: BuilderOptions = {
      type: 'archive',
      parent: { nonInteractive: true },
    };

    const iosBuilder = new IOSBuilder(projectRoot, builderOptions);
    await iosBuilder.command();

    // expect that we get the latest release and started build
    expect(mockedXDLModules.Project.getLatestReleaseAsync.mock.calls.length).toBe(1);
    expect(mockedXDLModules.Project.startBuildAsync.mock.calls.length).toBe(1);
  });
  it('archive build: fails if user passes in incomplete credential flags', async () => {
    const projectRoot = '/test-project';
    setupMockForNonInteractiveCliOptions();
    (mockIosCredentialsApi as any).getAllCredentialsApi.mockImplementation(() => ({
      appCredentials: [],
      userCredentials: [],
    }));

    const builderOptions: BuilderOptions = {
      type: 'archive',
      parent: { nonInteractive: true },
      pushId: 'sdf',
    };

    const iosBuilder = new IOSBuilder(projectRoot, builderOptions);

    await expect(iosBuilder.command()).rejects.toThrowError(
      'Unable to proceed, see the above error message.'
    );
    // fail if we proceed to get the latest release and started build
    expect(mockedXDLModules.Project.getLatestReleaseAsync.mock.calls.length).toBe(0);
    expect(mockedXDLModules.Project.startBuildAsync.mock.calls.length).toBe(0);
  });
  it('archive build: fails if user has no credentials', async () => {
    const projectRoot = '/test-project';
    (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(() => null);
    (mockIosCredentialsApi as any).getAllCredentialsApi.mockImplementation(() => ({
      appCredentials: [],
      userCredentials: [],
    }));

    const builderOptions: BuilderOptions = {
      type: 'archive',
      parent: { nonInteractive: true },
    };

    const iosBuilder = new IOSBuilder(projectRoot, builderOptions);
    await expect(iosBuilder.command()).rejects.toThrowError(
      'Unable to proceed, see the above error message.'
    );

    // fail if we proceed to get the latest release and started build
    expect(mockedXDLModules.Project.getLatestReleaseAsync.mock.calls.length).toBe(0);
    expect(mockedXDLModules.Project.startBuildAsync.mock.calls.length).toBe(0);
  });
  it('archive build: pass in all credentials from cli', async () => {
    const OLD_ENV = process.env;
    setupMockForNonInteractiveCliOptions();
    try {
      process.env = { ...OLD_ENV, EXPO_IOS_DIST_P12_PASSWORD: 'sdf' };

      const projectRoot = '/test-project';

      const builderOptions: BuilderOptions = {
        type: 'archive',
        parent: { nonInteractive: true },
        teamId: 'sdf',
        distP12Path: projectRoot + '/package.json',
        pushP8Path: projectRoot + '/package.json',
        pushId: 'sdf',
        provisioningProfilePath: projectRoot + '/package.json',
      };

      const iosBuilder = new IOSBuilder(projectRoot, builderOptions);
      await iosBuilder.command();

      // expect that we get the latest release and started build
      expect(mockedXDLModules.Project.getLatestReleaseAsync.mock.calls.length).toBe(1);
      expect(mockedXDLModules.Project.startBuildAsync.mock.calls.length).toBe(1);
    } finally {
      process.env = { ...OLD_ENV };
    }
  });
});

function setupMockForNonInteractiveCliOptions() {
  let savedDistCert;
  let savedPushKey;
  let savedProvProfile;
  (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(() => null);
  (mockIosCredentialsApi as any).createDistCertApi.mockImplementation((_, distCert) => {
    savedDistCert = distCert;
    return 1; //userCredentialsId
  });
  (mockIosCredentialsApi as any).createPushKeyApi.mockImplementation((_, pushKey) => {
    savedPushKey = pushKey;
    return 2;
  });
  // api is refetching user credentials after creation
  (mockIosCredentialsApi as any).getUserCredentialsByIdApi.mockImplementationOnce(() => ({
    ...savedDistCert,
    id: 1,
    type: 'dist-cert',
  }));
  (mockIosCredentialsApi as any).getUserCredentialsByIdApi.mockImplementationOnce(() => ({
    ...savedPushKey,
    id: 2,
    type: 'push-key',
  }));
  (mockIosCredentialsApi as any).useDistCertApi.mockImplementationOnce(() => {
    (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(() => ({
      experienceName: testExperienceName,
      bundleIdentifier: testBundleIdentifier,
      credentials: {
        teamId: savedDistCert.teamId,
      },
      distCredentialsId: 1,
      distCredentials: savedDistCert,
    }));
  });
  (mockIosCredentialsApi as any).usePushKeyApi.mockImplementationOnce(() => {
    (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(() => ({
      experienceName: testExperienceName,
      bundleIdentifier: testBundleIdentifier,
      credentials: {
        teamId: savedDistCert.teamId,
      },
      distCredentialsId: 1,
      distCredentials: savedDistCert,
      pushCredentialsId: 2,
      pushCredentials: savedPushKey,
    }));
  });
  (mockIosCredentialsApi as any).updateProvisioningProfileApi.mockImplementationOnce(
    (_, profile) => {
      savedProvProfile = profile;
      (mockIosCredentialsApi as any).getAllCredentialsForAppApi.mockImplementation(() => ({
        experienceName: testExperienceName,
        bundleIdentifier: testBundleIdentifier,
        credentials: {
          ...savedProvProfile,
        },
        distCredentialsId: 1,
        distCredentials: savedDistCert,
        pushCredentialsId: 2,
        pushCredentials: savedPushKey,
      }));
    }
  );
}
