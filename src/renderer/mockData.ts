import type {
  RepoData,
  WorkspaceData,
  SessionData,
  Message,
} from './client/types/entities';

// Mock messages
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Can you help me refactor this component?',
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Sure! I can see that this component could benefit from breaking down into smaller parts. Let me show you how.',
    timestamp: Date.now() - 3500000, // 58 minutes ago
  },
  {
    id: 'msg-3',
    role: 'user',
    content:
      'That makes sense. How would you structure the smaller components?',
    timestamp: Date.now() - 3400000, // 57 minutes ago
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content:
      'I would create separate components for the header, the file list, and the action buttons. This way each component has a single responsibility.',
    timestamp: Date.now() - 3300000, // 55 minutes ago
  },
];

// Mock sessions
const mockSessions: Record<string, SessionData> = {
  'session-1': {
    id: 'session-1',
    workspaceId: 'workspace-1',
    messages: mockMessages,
    context: {
      files: ['src/components/UserProfile.tsx', 'src/types/user.ts'],
      codeRefs: [
        { file: 'src/components/UserProfile.tsx', line: 25 },
        { file: 'src/components/UserProfile.tsx', line: 42 },
      ],
    },
    state: {
      pendingOperations: [],
      activeTasks: ['refactor-component'],
    },
    metadata: {
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 3300000, // 55 minutes ago
      status: 'active',
      tags: ['refactor', 'component'],
      labels: ['frontend', 'ui'],
    },
  },
  'session-2': {
    id: 'session-2',
    workspaceId: 'workspace-1',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'How do I implement the authentication flow?',
        timestamp: Date.now() - 7200000, // 2 hours ago
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content:
          "You can use the existing auth service. Here's an example of how to integrate it:",
        timestamp: Date.now() - 7100000, // 1 hour 58 minutes ago
      },
    ],
    context: {
      files: ['src/services/auth.ts', 'src/components/LoginForm.tsx'],
      codeRefs: [{ file: 'src/services/auth.ts', line: 15 }],
    },
    state: {
      pendingOperations: [],
      activeTasks: ['auth-implementation'],
    },
    metadata: {
      createdAt: Date.now() - 172800000, // 2 days ago
      updatedAt: Date.now() - 7100000, // 1 hour 58 minutes ago
      status: 'active',
      tags: ['auth', 'login'],
      labels: ['backend', 'security'],
    },
  },
  'session-3': {
    id: 'session-3',
    workspaceId: 'workspace-2',
    messages: [
      {
        id: 'msg-7',
        role: 'user',
        content: "What's the status of the API integration?",
        timestamp: Date.now() - 10800000, // 3 hours ago
      },
    ],
    context: {
      files: ['src/api/client.ts', 'src/services/dataService.ts'],
      codeRefs: [],
    },
    state: {
      pendingOperations: ['api-deployment'],
      activeTasks: [],
    },
    metadata: {
      createdAt: Date.now() - 259200000, // 3 days ago
      updatedAt: Date.now() - 10800000, // 3 hours ago
      status: 'active',
      tags: ['api', 'integration'],
      labels: ['backend', 'api'],
    },
  },
};

// Mock workspaces
const mockWorkspaces: Record<string, WorkspaceData> = {
  'workspace-1': {
    id: 'workspace-1',
    repoPath: '/Users/developer/projects/tnf',
    branch: 'feature/user-profile',
    worktreePath:
      '/Users/developer/projects/tnf/worktrees/feature-user-profile',
    sessionIds: ['session-1', 'session-2'],
    gitState: {
      currentCommit: 'a1b2c3d4e5f6',
      isDirty: true,
      pendingChanges: [
        'src/components/UserProfile.tsx',
        'src/types/user.ts',
        'src/styles/user.css',
      ],
    },
    metadata: {
      createdAt: Date.now() - 86400000, // 1 day ago
      description:
        'Implementing user profile component with edit functionality',
      status: 'active',
    },
    context: {
      activeFiles: ['src/components/UserProfile.tsx', 'src/types/user.ts'],
      settings: {},
      preferences: {},
    },
  },
  'workspace-2': {
    id: 'workspace-2',
    repoPath: '/Users/developer/projects/tnf',
    branch: 'develop',
    worktreePath: '/Users/developer/projects/tnf/worktrees/develop',
    sessionIds: ['session-3'],
    gitState: {
      currentCommit: 'f6e5d4c3b2a1',
      isDirty: false,
      pendingChanges: [],
    },
    metadata: {
      createdAt: Date.now() - 259200000, // 3 days ago
      description: 'Development branch with latest features',
      status: 'active',
    },
    context: {
      activeFiles: [],
      settings: {},
      preferences: {},
    },
  },
  'workspace-3': {
    id: 'workspace-3',
    repoPath: '/Users/developer/projects/takumi',
    branch: 'main',
    worktreePath: '/Users/developer/projects/takumi/worktrees/main',
    sessionIds: [],
    gitState: {
      currentCommit: '1a2b3c4d5e6f',
      isDirty: false,
      pendingChanges: [],
    },
    metadata: {
      createdAt: Date.now() - 604800000, // 1 week ago
      description: 'Main branch with production code',
      status: 'active',
    },
    context: {
      activeFiles: [],
      settings: {},
      preferences: {},
    },
  },
  'workspace-4': {
    id: 'workspace-4',
    repoPath: '/Users/developer/projects/takumi',
    branch: 'feature/api-integration',
    worktreePath:
      '/Users/developer/projects/takumi/worktrees/feature-api-integration',
    sessionIds: [],
    gitState: {
      currentCommit: '7f8e9d0c1b2a',
      isDirty: true,
      pendingChanges: [
        'src/api/client.ts',
        'src/services/dataService.ts',
        'tests/api.test.ts',
      ],
    },
    metadata: {
      createdAt: Date.now() - 172800000, // 2 days ago
      description: 'Integrating external API services',
      status: 'active',
    },
    context: {
      activeFiles: ['src/api/client.ts'],
      settings: {},
      preferences: {},
    },
  },
};

// Mock repos
const mockRepos: Record<string, RepoData> = {
  '/Users/developer/projects/tnf': {
    path: '/Users/developer/projects/tnf',
    name: 'tnf',
    workspaceIds: ['workspace-1', 'workspace-2'],
    metadata: {
      lastAccessed: Date.now() - 3600000, // 1 hour ago
      settings: {},
    },
    gitRemote: {
      originUrl: 'https://github.com/company/tnf.git',
      defaultBranch: 'main',
      syncStatus: 'synced',
    },
  },
  '/Users/developer/projects/takumi': {
    path: '/Users/developer/projects/takumi',
    name: 'takumi',
    workspaceIds: ['workspace-3', 'workspace-4'],
    metadata: {
      lastAccessed: Date.now() - 7200000, // 2 hours ago
      settings: {},
    },
    gitRemote: {
      originUrl: 'https://github.com/company/takumi.git',
      defaultBranch: 'main',
      syncStatus: 'ahead',
    },
  },
};

// Export the mock data
export const mockData = {
  repos: mockRepos,
  workspaces: mockWorkspaces,
  sessions: mockSessions,
};

// Export individual helpers for easier access
export const getMockRepos = () => Object.values(mockRepos);
export const getMockWorkspaces = () => Object.values(mockWorkspaces);
export const getMockSessions = () => Object.values(mockSessions);
