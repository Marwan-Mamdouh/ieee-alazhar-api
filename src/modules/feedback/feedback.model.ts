import { Document, Schema, model } from "mongoose";

import { FEEDBACK_STATUSES, type FeedbackStatus } from "./feedback.types.js";

export interface Feedback extends Document {
	name: string;
	email: string;
	phoneNumber: string;
	message: string;
	status: FeedbackStatus;
	handledAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const FeedbackSchema = new Schema<Feedback>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true },
		phoneNumber: { type: String, required: false },
		message: { type: String, required: true },
		status: { type: String, enum: FEEDBACK_STATUSES, default: "unread" },
		handledAt: { type: Date, default: null },
	},
	{
		timestamps: true,
	},
);

FeedbackSchema.index({ status: 1, createdAt: -1 });

const FeedbackModel = model<Feedback>("Feedback", FeedbackSchema);

export default FeedbackModel;
