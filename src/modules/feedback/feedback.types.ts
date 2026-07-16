export const FEEDBACK_STATUSES = [
  "unread",
  "read",
  "archived",
  "resolved",
] as const;

export const feedbackProps =
  "_id name email phoneNumber message status handledAt createdAt updatedAt" as const;

export interface FeedbackItem {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: FeedbackStatus;
  handledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackResult {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
  handledAt?: Date | undefined;
}

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
