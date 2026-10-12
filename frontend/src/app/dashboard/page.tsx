"use client";

import { Alert, Button, Card, Spin, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useGetCurrentUserQuery, useGetBalanceQuery } from "../../lib/apiSlice";
import { logout } from "../../lib/authSlice";
import type { RootState } from "../../lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const userQuery = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  const balanceQuery = useGetBalanceQuery(undefined, {
    skip: !token || userQuery.data?.role !== "user",
  });

  useEffect(() => {
    if (userQuery.data?.role === "admin") {
      router.replace("/admin/users");
    }
  }, [userQuery.data, router]);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    if (
      userQuery.error &&
      "status" in userQuery.error &&
      userQuery.error.status === 401
    ) {
      dispatch(logout());
      message.error("Your session has expired. Please log in again.");
      router.replace("/login");
    }
  }, [userQuery.error, dispatch, router]);

  if (!token || userQuery.isLoading || !userQuery.data) {
    return <Spin fullscreen />;
  }

  const user = userQuery.data;

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 24 }}>
      <Typography.Title level={2}>Welcome, {user.username}</Typography.Title>

      {user.role === "admin" ? (
        <Alert
          type="info"
          showIcon
          title="Admin account"
          description="The user quiz dashboard is for normal users. Admin management screens will be connected separately."
        />
      ) : (
        <Card>
          <Typography.Text type="secondary">Your token balance</Typography.Text>

          {balanceQuery.isLoading ? (
            <Spin />
          ) : balanceQuery.isError ? (
            <Alert type="error" title="Could not load your balance." />
          ) : (
            <Typography.Title level={1}>
              {balanceQuery.data?.balance ?? 0} tokens
            </Typography.Title>
          )}

          <Button type="primary" onClick={() => router.push("/quiz")}>
            Start Quiz
          </Button>
        </Card>
      )}

      <Button
        style={{ marginTop: 16 }}
        onClick={() => {
          dispatch(logout());
          router.replace("/login");
        }}
      >
        Log out
      </Button>
    </main>
  );
}
