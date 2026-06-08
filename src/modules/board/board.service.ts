import {
	boardMembersProps,
	OFFICER_POSITIONS,
	BOARD_TYPES,
	type BoardMember,
	type MemberType,
	type OfficerPosition,
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
			...(data.track && { track: { $in: data.track } }),
			...(data.position && { position: { $in: data.position } }),
		};

		const groupedMembers = await Board.aggregate([])
			.match(query)
			.group({
				_id: "$memberType",
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

		const initialOutput: Record<MemberType, BoardMember[]> = {
			officer: [],
			technical: [],
			branding: [],
			operation: [],
		};

		const unsortedResult = groupedMembers.reduce((acc, currentGroup) => {
			acc[currentGroup._id] = sortMembers(
				currentGroup._id,
				currentGroup.members.map(toMemberDTO),
			);
			return acc;
		}, initialOutput);
		// Sort the groups themselves: officer → technical → branding → operation
		return Object.fromEntries(
			Object.entries(unsortedResult).sort(
				([a], [b]) =>
					BOARD_TYPES.indexOf(a as MemberType) -
					BOARD_TYPES.indexOf(b as MemberType),
			),
		);
	},

	async getBoardYears() {
		const years = await Board.distinct("boardYear")
			.sort({ boardYear: -1 })
			.exec();
		console.log(years);
		return years;
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

const sortMembers = (
	memberType: MemberType,
	members: BoardMember[],
): BoardMember[] => {
	if (memberType === "officer") {
		return members.sort(
			(a, b) =>
				OFFICER_POSITIONS.indexOf(a.position as OfficerPosition) -
				OFFICER_POSITIONS.indexOf(b.position as OfficerPosition),
		);
	}

	return members.sort((a, b) => {
		// 1. Sort by track A → Z
		const trackCmp = (a.track ?? "").localeCompare(b.track ?? "");
		if (trackCmp !== 0) return trackCmp;

		// 2. Within same track: head before vice
		if (a.position === "head") return -1;
		if (b.position === "head") return 1;
		return 0;
	});
};

export default boardService;
