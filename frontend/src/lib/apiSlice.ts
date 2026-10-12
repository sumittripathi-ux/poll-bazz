// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

// export interface RootResponse {
//   message: string;
//   status: string;
// }

// export interface HealthResponse {
//   status: string;
//   service: string;
//   timestamp: string;
// }

// export interface TestResponse {
//   success: boolean;
//   message: string;
//   project: string;
// }

// export interface LoginRequest {
//   username: string;
//   password: string;
// }

// export interface TokenResponse {
//   access_token: string;
//   token_type: "bearer";
//   expires_in: number;
// }

// export interface CurrentUser {
//   id: number;
//   username: string;
//   role: "admin" | "user";
//   is_active: boolean;
// }

// export const apiSlice = createApi({
//   reducerPath: "api",

//   baseQuery: fetchBaseQuery({
//     baseUrl,
//   }),

//   tagTypes: ["Backend"],

//   endpoints: (builder) => ({
//     getRoot: builder.query<RootResponse, void>({
//       query: () => "/",
//       providesTags: ["Backend"],
//     }),

//     getHealth: builder.query<HealthResponse, void>({
//       query: () => "/health",
//       providesTags: ["Backend"],
//     }),

//     testBackend: builder.query<TestResponse, void>({
//       query: () => "/api/test",
//       providesTags: ["Backend"],
//     }),

//     login: builder.mutation<TokenResponse, LoginRequest>({
//       query: (credentials) => ({
//         url: "/api/auth/login",
//         method: "POST",
//         body: credentials,
//       }),
//     }),

//     getCurrentUser: builder.query<CurrentUser, void>({
//       query: () => "/api/auth/me",
//     }),
//   }),
// });

// export const {
//   useGetRootQuery,
//   useGetHealthQuery,
//   useTestBackendQuery,
//   useLoginMutation,
//   useGetCurrentUserQuery,
// } = apiSlice;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface LoginRequest {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface CurrentUser {
  id: number;
  username: string;
  role: "admin" | "user";
  is_active: boolean;
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
}

interface QuizResponse {
  questions: QuizQuestion[];
  count: number;
  message: string | null;
}

interface SubmitAnswerRequest {
  question_id: number;
  option_id: number;
}

export interface SubmitAnswerResponse {
  question_id: number;
  option_id: number;
  tokens_awarded: number;
  balance: number;
}

interface BalanceResponse {
  balance: number;
}

export interface AdminUser {
  id: number;
  username: string;
  role: "admin" | "user";
  is_active: boolean;
  balance: number;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  temporary_password: string;
}

export interface QuestionOptionInput {
  id?: number;
  text: string;
  weight: number;
}

export interface AdminQuestion {
  id: number;
  text: string;
  is_active: boolean;
  created_at: string;
  options: {
    id: number;
    text: string;
    weight: number;
  }[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",

    prepareHeaders: (headers, { getState }) => {
      const state = getState() as {
        auth: { token: string | null };
      };

      if (state.auth.token) {
        headers.set("Authorization", `Bearer ${state.auth.token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Balance", "AdminUsers", "AdminQuestions"],

  endpoints: (builder) => ({
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    getCurrentUser: builder.query<CurrentUser, void>({
      query: () => "/api/auth/me",
    }),

    getQuiz: builder.query<QuizResponse, void>({
      query: () => "/api/quiz",
    }),

    submitAnswer: builder.mutation<SubmitAnswerResponse, SubmitAnswerRequest>({
      query: (answer) => ({
        url: "/api/quiz/answer",
        method: "POST",
        body: answer,
      }),
      invalidatesTags: ["Balance"],
    }),

    getBalance: builder.query<BalanceResponse, void>({
      query: () => "/api/quiz/balance",
      providesTags: ["Balance"],
    }),

    getAdminUsers: builder.query<AdminUser[], void>({
      query: () => "/api/admin/users",
      providesTags: ["AdminUsers"],
    }),

    createAdminUser: builder.mutation<AdminUser, CreateUserRequest>({
      query: (body) => ({
        url: "/api/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers"],
    }),

    updateUserStatus: builder.mutation<
      AdminUser,
      { userId: number; is_active: boolean }
    >({
      query: ({ userId, ...body }) => ({
        url: `/api/admin/users/${userId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminUsers"],
    }),

    resetUserPassword: builder.mutation<
      void,
      { userId: number; temporary_password: string }
    >({
      query: ({ userId, ...body }) => ({
        url: `/api/admin/users/${userId}/password`,
        method: "PATCH",
        body,
      }),
    }),

    getAdminQuestions: builder.query<AdminQuestion[], void>({
      query: () => "/api/admin/questions",
      providesTags: ["AdminQuestions"],
    }),

    createAdminQuestion: builder.mutation<
      AdminQuestion,
      { text: string; options: QuestionOptionInput[] }
    >({
      query: (body) => ({
        url: "/api/admin/questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminQuestions"],
    }),

    updateAdminQuestion: builder.mutation<
      AdminQuestion,
      {
        questionId: number;
        text?: string;
        options?: QuestionOptionInput[];
      }
    >({
      query: ({ questionId, ...body }) => ({
        url: `/api/admin/questions/${questionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminQuestions"],
    }),

    updateQuestionStatus: builder.mutation<
      AdminQuestion,
      { questionId: number; is_active: boolean }
    >({
      query: ({ questionId, ...body }) => ({
        url: `/api/admin/questions/${questionId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminQuestions"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useGetQuizQuery,
  useSubmitAnswerMutation,
  useGetBalanceQuery,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useGetAdminQuestionsQuery,
  useCreateAdminQuestionMutation,
  useUpdateAdminQuestionMutation,
  useUpdateQuestionStatusMutation,
} = apiSlice;
