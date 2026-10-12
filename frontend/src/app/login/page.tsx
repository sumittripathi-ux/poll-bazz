"use client";

import { Button, Card, Form, Input, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useLoginMutation } from "../../lib/apiSlice";
import { setCredentials } from "../../lib/authSlice";
import type { RootState } from "../../lib/store";

interface LoginFormValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const onFinish = async (values: LoginFormValues) => {
    try {
      const response = await login(values).unwrap();

      dispatch(setCredentials(response.access_token));
      router.replace("/dashboard");
    } catch {
      message.error("Invalid username or password.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <Typography.Title level={2}>Poll Bazz</Typography.Title>

        <Typography.Paragraph type="secondary">
          Log in using the credentials provided by your admin.
        </Typography.Paragraph>

        <Form<LoginFormValues>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Enter your username." }]}
          >
            <Input autoComplete="username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter your password." }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Log in
          </Button>
        </Form>
      </Card>
    </main>
  );
}
