"use client";

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
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
  useGetAdminQuestionsQuery,
  useCreateAdminQuestionMutation,
  useUpdateAdminQuestionMutation,
  useUpdateQuestionStatusMutation,
  type AdminQuestion,
  type QuestionOptionInput,
} from "../../../lib/apiSlice";
import { logout } from "../../../lib/authSlice";
import type { RootState } from "../../../lib/store";

interface QuestionFormValues {
  text: string;
  options: QuestionOptionInput[];
}

export default function AdminQuestionsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const me = useGetCurrentUserQuery(undefined, { skip: !token });
  const questions = useGetAdminQuestionsQuery(undefined, {
    skip: !token || me.data?.role !== "admin",
  });

  const [createQuestion, createState] = useCreateAdminQuestionMutation();
  const [updateQuestion, updateState] = useUpdateAdminQuestionMutation();
  const [updateStatus, statusState] = useUpdateQuestionStatusMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(
    null,
  );
  const [form] = Form.useForm<QuestionFormValues>();

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

  const openCreate = () => {
    setEditingQuestion(null);
    form.resetFields();
    form.setFieldsValue({
      text: "",
      options: [
        { text: "", weight: 0 },
        { text: "", weight: 0 },
      ],
    });
    setModalOpen(true);
  };

  const openEdit = (question: AdminQuestion) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      text: question.text,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        weight: option.weight,
      })),
    });
    setModalOpen(true);
  };

  const handleSave = async (values: QuestionFormValues) => {
    try {
      if (editingQuestion) {
        await updateQuestion({
          questionId: editingQuestion.id,
          text: values.text,
          options: values.options,
        }).unwrap();

        message.success("Question updated.");
      } else {
        await createQuestion({
          text: values.text,
          options: values.options.map(({ text, weight }) => ({
            text,
            weight,
          })),
        }).unwrap();

        message.success("Question created.");
      }

      setModalOpen(false);
      setEditingQuestion(null);
      form.resetFields();
    } catch {
      message.error(
        "Could not save question. Check option count and historical answers.",
      );
    }
  };

  const columns: TableProps<AdminQuestion>["columns"] = [
    {
      title: "Question",
      dataIndex: "text",
      key: "text",
    },
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      render: (options: AdminQuestion["options"]) => options.length,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Active" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, question: AdminQuestion) => (
        <Space wrap>
          <Button size="small" onClick={() => openEdit(question)}>
            Edit
          </Button>

          <Button
            size="small"
            loading={statusState.isLoading}
            onClick={async () => {
              try {
                await updateStatus({
                  questionId: question.id,
                  is_active: !question.is_active,
                }).unwrap();

                message.success(
                  question.is_active
                    ? "Question disabled."
                    : "Question enabled.",
                );
              } catch {
                message.error("Could not update question status.");
              }
            }}
          >
            {question.is_active ? "Disable" : "Enable"}
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
            <Typography.Title level={2}>Question Management</Typography.Title>
            <Typography.Text type="secondary">
              Create and maintain opinion questions.
            </Typography.Text>
          </div> */}
          <div style={{ marginBottom: 24 }}>
            <Typography.Title level={2}>Question Management</Typography.Title>
            <Typography.Text type="secondary">
              Create and maintain the Poll Bazz question bank.
            </Typography.Text>
          </div>

          <Space wrap>
            <Button onClick={() => router.push("/admin/users")}>
              Manage Users
            </Button>
            <Button type="primary" onClick={openCreate}>
              Add Question
            </Button>
          </Space>
        </Space>

        {questions.isError && (
          <Alert
            type="error"
            showIcon
            message="Could not load questions."
            style={{ marginBottom: 16 }}
          />
        )}

        <Card>
          <Table<AdminQuestion>
            rowKey="id"
            columns={columns}
            dataSource={questions.data ?? []}
            loading={questions.isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 700 }}
          />
        </Card>

        <Modal
          title={editingQuestion ? "Edit Question" : "Create Question"}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingQuestion(null);
            form.resetFields();
          }}
          footer={null}
          width={700}
          destroyOnHidden
        >
          <Form<QuestionFormValues>
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              label="Question text"
              name="text"
              rules={[{ required: true, whitespace: true }, { max: 1000 }]}
            >
              <Input.TextArea rows={3} maxLength={1000} />
            </Form.Item>

            <Typography.Title level={5}>Options (2–6)</Typography.Title>

            <Form.List
              name="options"
              rules={[
                {
                  validator: async (_, options) => {
                    if (!options || options.length < 2 || options.length > 6) {
                      throw new Error("Add between 2 and 6 options.");
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      align="start"
                      style={{ display: "flex", marginBottom: 8 }}
                      wrap
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "text"]}
                        label={`Option ${field.name + 1}`}
                        rules={[
                          { required: true, whitespace: true },
                          { max: 300 },
                        ]}
                      >
                        <Input placeholder="Option text" maxLength={300} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, "weight"]}
                        label="Weight"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} max={10} precision={0} />
                      </Form.Item>

                      {fields.length > 2 && (
                        <Button
                          danger
                          onClick={() => remove(field.name)}
                          style={{ marginTop: 30 }}
                        >
                          Remove
                        </Button>
                      )}
                    </Space>
                  ))}

                  <Form.ErrorList errors={errors} />

                  <Button
                    disabled={fields.length >= 6}
                    onClick={() => add({ text: "", weight: 0 })}
                  >
                    Add Option
                  </Button>
                </>
              )}
            </Form.List>

            <Button
              type="primary"
              htmlType="submit"
              loading={createState.isLoading || updateState.isLoading}
              block
              style={{ marginTop: 24 }}
            >
              {editingQuestion ? "Save Changes" : "Create Question"}
            </Button>
          </Form>
        </Modal>
      </main>
    </>
  );
}
