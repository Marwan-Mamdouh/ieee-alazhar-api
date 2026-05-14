import {
	boardMembersProps,
	type MemberType,
	type BoardMember,
} from "./board.types.js";
import Board from "./model.js";
import type { AddBoardMember, UpdateBoardMember } from "./board.schema.js";
import UploadService from "../upload/upload.service.js";
import { AppError ,NotFoundError } from "../../errors/app.error.js";
import { toMemberDTO } from "./board.dto.js";


const boardService = {
	getBoard: async (positions: MemberType[], year: number) => {
		const members = await Board.find({
			boardYear: year,
			memberType: { $in: positions }, // <--- This matches any value in the array
		})
			.sort({ memberType: 1, _id: 1 })
			.select(boardMembersProps)
			.lean<BoardMember[]>()
			.exec();
		return members.map(toMemberDTO);
	},

	getBoardById: async (boardId: string) => {
		const board = await Board.findById(boardId)
			.select(boardMembersProps)
			.lean<BoardMember>()
			.exec();
		if (!board) throw new NotFoundError("Board member not found");
		return toMemberDTO(board);
	},

	addMember: async (member: AddBoardMember) => {
		const newMember = await new Board(member).save();
		return toMemberDTO(newMember);
	},

	updateBoard: async (boardId: string, boardData: UpdateBoardMember) => {
		const board = await Board.findByIdAndUpdate(boardId, boardData, {
			new: true,
		});
		if (!board) throw new NotFoundError("Board not found");
		return toMemberDTO(board);
	},

	deleteBoard: async (boardId: string) => {
		const board = await Board.findByIdAndDelete(boardId);
		if (!board) throw new NotFoundError("Board not found");
		if (board?.avatar?.public_id) {
			UploadService.deleteImage(board.avatar.public_id).catch((err) => {
				console.error("Failed to delete avatar image:", err);
			});
		}
		return toMemberDTO(board);
	},

	updateBoardAvatar: async (boardId: string, file: Express.Multer.File) => {
		const board = await Board.findById(boardId);
		if (!board) throw new NotFoundError("Board not found");

		if (board?.avatar?.public_id) {
			UploadService.deleteImage(board.avatar.public_id).catch((err) => {
				console.error("Failed to delete avatar image:", err);
			});
		}
		const result = await UploadService.uploadImage(
			file.buffer,
			"board/avatars",
		);
		board.avatar = { url: result.secure_url, public_id: result.public_id };

		try {
			const savedMember = await board.save();
			return toMemberDTO(savedMember);
		} catch (err) {
			try {
				await UploadService.deleteImage(result.public_id);
			} catch (cleanupErr) {
				throw new AppError(
					`Board save failed AND cleanup failed: ${cleanupErr}`,
				);
			}
			throw new AppError(`Failed to save board avatar: ${err}`);
		}
	},

	deleteBoardAvatar: async (boardId: string) => {
		const board = await Board.findById(boardId);
		if (!board) throw new NotFoundError("Board not found");

		if (board?.avatar?.public_id) {
			await UploadService.deleteImage(board.avatar.public_id).catch((err) => {
				console.error("Failed to delete avatar image:", err);
			});
			board.avatar = { url: "", public_id: "" };
		}

		const savedBoard = await board.save();
		return toMemberDTO(savedBoard);
	},
};

export default boardService;
