"use client";

import {
  Alert,
  Button,
  Card,
  Radio,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useGetQuizQuery, useSubmitAnswerMutation } from "../../lib/apiSlice";
import { logout } from "../../lib/authSlice";
import type { RootState } from "../../lib/store";

export default function QuizPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const {
    data: quiz,
    isLoading,
    isError,
    refetch,
  } = useGetQuizQuery(undefined, {
    skip: !token,
  });

  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [earned, setEarned] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [lastAward, setLastAward] = useState<number | null>(null);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token || isLoading) {
    return <Spin fullscreen />;
  }

  if (isError || !quiz) {
    return (
      <main style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message="Could not load the quiz."
          description="Check your connection and try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
        <Button
          style={{ marginTop: 16 }}
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </main>
    );
  }

  const questions = quiz.questions;
  const question = questions[questionIndex];

  const handleSubmit = async () => {
    if (!question || selectedOptionId === null) {
      message.warning("Please select an option.");
      return;
    }

    try {
      const result = await submitAnswer({
        question_id: question.id,
        option_id: selectedOptionId,
      }).unwrap();

      setEarned((previous) => previous + result.tokens_awarded);
      setLastAward(result.tokens_awarded);
      setSelectedOptionId(null);

      if (questionIndex === questions.length - 1) {
        setRoundComplete(true);
      } else {
        setQuestionIndex((previous) => previous + 1);
      }
    } catch {
      message.error(
        "Could not submit your answer. It may already have been answered.",
      );
    }
  };

  const startAnotherRound = async () => {
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setEarned(0);
    setLastAward(null);
    setRoundComplete(false);

    const result = await refetch();

    if (result.isError) {
      message.error("Could not load another quiz round.");
    }
  };

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <Button type="link" onClick={() => router.push("/dashboard")}>
        Back to Dashboard
      </Button>

      <Typography.Title level={2}>Poll Bazz Quiz</Typography.Title>

      {roundComplete ? (
        <Card>
          <Typography.Title level={3}>Round complete!</Typography.Title>

          <Typography.Paragraph>
            You answered {questions.length} question(s).
          </Typography.Paragraph>

          <Typography.Title level={2}>Tokens earned: {earned}</Typography.Title>

          <Button type="primary" onClick={() => router.push("/dashboard")}>
            View Balance
          </Button>

          <Button style={{ marginLeft: 8 }} onClick={startAnotherRound}>
            Start Another Round
          </Button>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <Alert
            type="info"
            showIcon
            message={
              quiz.message ?? "No new questions right now, come back later."
            }
          />
          <Button
            style={{ marginTop: 16 }}
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Card>
      ) : (
        <Card>
          <Typography.Text type="secondary">
            Question {questionIndex + 1} of {questions.length}
          </Typography.Text>

          <Typography.Title level={4}>{question.text}</Typography.Title>

          <Radio.Group
            value={selectedOptionId}
            onChange={(event) =>
              setSelectedOptionId(event.target.value as number)
            }
            style={{ width: "100%" }}
          >
            <Space direction="vertical" size="middle">
              {question.options.map((option) => (
                <Radio key={option.id} value={option.id}>
                  {option.text}
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          {lastAward !== null && (
            <Alert
              style={{ marginTop: 20 }}
              type="success"
              showIcon
              message={`You earned ${lastAward} token(s) for your previous answer.`}
            />
          )}

          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              block
              loading={isSubmitting}
              disabled={selectedOptionId === null}
              onClick={handleSubmit}
            >
              {questionIndex === questions.length - 1
                ? "Submit & Finish"
                : "Submit & Next"}
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
