"use client";

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import AdminNavbar from "@/components/AdminNavbar";

import {
  useGetCurrentUserQuery,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  type AdminUser,
} from "../../../lib/apiSlice";
import { logout } from "../../../lib/authSlice";
import type { RootState } from "../../../lib/store";

export default function AdminUsersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const me = useGetCurrentUserQuery(undefined, { skip: !token });
  const users = useGetAdminUsersQuery(undefined, {
    skip: !token || me.data?.role !== "admin",
  });

  const [createUser, createState] = useCreateAdminUserMutation();
  const [updateStatus, statusState] = useUpdateUserStatusMutation();
  const [resetPassword, resetState] = useResetUserPasswordMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  const [createForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    if (me.data && me.data.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [me.data, router]);

  useEffect(() => {
    if (me.error && "status" in me.error && me.error.status === 401) {
      dispatch(logout());
      router.replace("/login");
    }
  }, [me.error, dispatch, router]);

  const handleCreate = async (values: {
    username: string;
    temporary_password: string;
  }) => {
    try {
      await createUser(values).unwrap();
      message.success("User created successfully.");
      setCreateOpen(false);
      createForm.resetFields();
    } catch (error: unknown) {
      message.error(
        "Could not create user. Check whether the username already exists.",
      );
    }
  };

  const handleStatus = async (user: AdminUser) => {
    try {
      await updateStatus({
        userId: user.id,
        is_active: !user.is_active,
      }).unwrap();

      message.success(user.is_active ? "User deactivated." : "User activated.");
    } catch {
      message.error("Could not update user status.");
    }
  };

  const handlePasswordReset = async (values: {
    temporary_password: string;
  }) => {
    if (!resetUser) return;

    try {
      await resetPassword({
        userId: resetUser.id,
        temporary_password: values.temporary_password,
      }).unwrap();

      message.success("Password reset successfully.");
      setResetUser(null);
      passwordForm.resetFields();
    } catch {
      message.error("Could not reset password.");
    }
  };

  const columns: TableProps<AdminUser>["columns"] = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : "default"}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (balance: number) => `${balance} tokens`,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, user: AdminUser) => (
        <Space wrap>
          <Button
            size="small"
            loading={statusState.isLoading}
            disabled={me.data?.id === user.id && user.is_active}
            onClick={() => handleStatus(user)}
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </Button>

          <Button size="small" onClick={() => setResetUser(user)}>
            Reset password
          </Button>
        </Space>
      ),
    },
  ];

  if (!token || me.isLoading || !me.data) {
    return <Typography.Paragraph>Loading admin access...</Typography.Paragraph>;
  }

  if (me.data.role !== "admin") return null;

  return (
    <>
      <AdminNavbar />
      <main style={{ maxWidth: 1200, margin: "32px auto", padding: 24 }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
          wrap
        >
          {/* <div>
            <Typography.Title level={2}>User Management</Typography.Title>
            <Typography.Text type="secondary">
              Create accounts and manage access.
            </Typography.Text>
          </div> */}
          <div style={{ marginBottom: 24 }}>
            <Typography.Title level={2}>User Management</Typography.Title>
            <Typography.Text type="secondary">
              Create accounts and manage access, passwords and token balances.
            </Typography.Text>
          </div>

          <Space wrap>
            <Button onClick={() => router.push("/admin/questions")}>
              Manage Questions
            </Button>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Create User
            </Button>
            <Button
              onClick={() => {
                dispatch(logout());
                router.replace("/login");
              }}
            >
              Log out
            </Button>
          </Space>
        </Space>

        {users.isError && (
          <Alert
            type="error"
            showIcon
            message="Could not load users."
            style={{ marginBottom: 16 }}
          />
        )}

        <Card>
          <Table<AdminUser>
            rowKey="id"
            columns={columns}
            dataSource={users.data ?? []}
            loading={users.isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </Card>

        <Modal
          title="Create User"
          open={createOpen}
          onCancel={() => {
            setCreateOpen(false);
            createForm.resetFields();
          }}
          footer={null}
          destroyOnHidden
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Enter a username." },
                { max: 50, message: "Maximum 50 characters." },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            <Form.Item
              label="Temporary password"
              name="temporary_password"
              rules={[
                { required: true },
                { min: 8, message: "Minimum 8 characters." },
                { max: 128, message: "Maximum 128 characters." },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={createState.isLoading}
              block
            >
              Create User
            </Button>
          </Form>
        </Modal>

        <Modal
          title={`Reset password: ${resetUser?.username ?? ""}`}
          open={resetUser !== null}
          onCancel={() => {
            setResetUser(null);
            passwordForm.resetFields();
          }}
          footer={null}
          destroyOnHidden
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordReset}
          >
            <Form.Item
              label="New temporary password"
              name="temporary_password"
              rules={[
                { required: true },
                { min: 8, message: "Minimum 8 characters." },
                { max: 128, message: "Maximum 128 characters." },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={resetState.isLoading}
              block
            >
              Reset Password
            </Button>
          </Form>
        </Modal>
      </main>
    </>
  );
}
