import {
	boardMembersProps,
	type BoardMember,
	type MemberType,
} from "./board.types.js";
import Board from "./board.model.js";
import type {
	AddBoardMember,
	GetBoard,
	UpdateBoardMember,
} from "./board.schema.js";
import UploadService from "../upload/upload.service.js";
import { AppError, NotFoundError } from "../../errors/app.error.js";
import { toMemberDTO } from "./board.dto.js";

const boardService = {
	getBoard: async (data: GetBoard) => {
		const query = {
			boardYear: { $gte: data.yearFrom, $lte: data.yearTo },
			...(data.memberType && { memberType: { $in: data.memberType } }),
			...(data.position && { position: { $in: data.position } }),
			...(data.track && { track: { $in: data.track } }),
		};

		const groupedMembers = await Board.aggregate([])
			.match(query) // Stage 1: Filter documents based on the query
			.sort({ name: 1, memberType: 1, _id: 1 }) // Stage 2: Sort documents *before* grouping
			.group({
				// Stage 3: Group by memberType and push the desired fields into a members array
				_id: "$memberType", // Grouping key
				members: {
					$push: {
						_id: "$_id",
						name: "$name",
						bio: "$bio",
						avatar: "$avatar",
						linkedin_url: "$linkedin_url",
						position: "$position",
						memberType: "$memberType",
						track: "$track",
						boardYear: "$boardYear",
					},
				},
			})
			.exec();

		// Shape the final object dynamically in TypeScript
		const initialOutput: Record<MemberType, BoardMember[]> = {
			officer: [],
			technical: [],
			branding: [],
			operation: [],
		};

		return groupedMembers.reduce((acc, currentGroup) => {
			// Format each member using your DTO function
			acc[currentGroup._id] = currentGroup.members.map(toMemberDTO);
			return acc;
		}, initialOutput);
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
			returnDocument: "after",
		})
			.select(boardMembersProps)
			.lean<BoardMember>()
			.exec();
		if (!board) throw new NotFoundError("Board not found");
		return toMemberDTO(board);
	},

	deleteBoard: async (boardId: string) => {
		const board = await Board.findByIdAndDelete(boardId)
			.select(boardMembersProps)
			.lean<BoardMember>()
			.exec();
		if (!board) throw new NotFoundError("Board not found");
		if (board?.avatar?.public_id) {
			UploadService.deleteImage(board.avatar.public_id).catch((err) => {
				console.error("Failed to delete avatar image:", err);
			});
		}
		return toMemberDTO(board);
	},

	updateBoardAvatar: async (boardId: string, file: Express.Multer.File) => {
		const board = await Board.findById(boardId)
			.select(boardMembersProps)
			.exec();
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
		const board = await Board.findById(boardId)
			.select(boardMembersProps)
			.exec();
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
