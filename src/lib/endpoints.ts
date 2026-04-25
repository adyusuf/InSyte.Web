// API Endpoint constants
export const apiEndpoints = {
  auth: {
    login: '/v1/auth/login',
    refresh: '/v1/auth/refresh',
    me: '/v1/auth/me',
  },
  users: {
    list: () => '/users',
    detail: (id: string) => `/users/${id}`,
    create: () => '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  schools: {
    list: () => '/schools',
    detail: (id: string) => `/schools/${id}`,
    create: () => '/schools',
    update: (id: string) => `/schools/${id}`,
    delete: (id: string) => `/schools/${id}`,
    advisors: (id: string) => `/schools/${id}/advisors`,
    teachers: (id: string) => `/schools/${id}/teachers`,
  },
  criteria: {
    list: () => '/criteria',
    detail: (id: string) => `/criteria/${id}`,
    create: () => '/criteria',
    update: (id: string) => `/criteria/${id}`,
    delete: (id: string) => `/criteria/${id}`,
    questions: (id: string) => `/criteria/${id}/questions`,
    withQuestions: () => '/criteria/with-questions', // Batch fetch
  },
  questions: {
    create: (criteriaId: string) => `/criteria/${criteriaId}/questions`,
    update: (criteriaId: string, questionId: string) =>
      `/criteria/${criteriaId}/questions/${questionId}`,
    delete: (criteriaId: string, questionId: string) =>
      `/criteria/${criteriaId}/questions/${questionId}`,
  },
  videos: {
    list: () => '/videos',
    detail: (id: string) => `/videos/${id}`,
    create: () => '/videos',
    upload: () => '/videos/upload',
    delete: (id: string) => `/videos/${id}`,
    evaluate: (id: string) => `/videos/${id}/evaluate`,
  },
  reports: {
    list: () => '/reports',
    detail: (id: string) => `/reports/${id}`,
    pdf: (id: string) => `/reports/${id}/pdf`,
    send: (id: string) => `/reports/${id}/send`,
  },
  aiProviders: {
    list: () => '/ai-providers',
    detail: (id: string) => `/ai-providers/${id}`,
    create: () => '/ai-providers',
    update: (id: string) => `/ai-providers/${id}`,
    delete: (id: string) => `/ai-providers/${id}`,
    models: (id: string) => `/ai-providers/${id}/models`,
    createModel: (id: string) => `/ai-providers/${id}/models`,
  },
  evaluations: {
    list: () => '/evaluations',
    detail: (id: string) => `/evaluations/${id}`,
    approve: (id: string) => `/evaluations/${id}/approve`,
    reject: (id: string) => `/evaluations/${id}/reject`,
  },
};
