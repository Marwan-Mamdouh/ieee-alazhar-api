import { Router, type Response } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  addBoardMemberSchema,
  getBoardSchema,
  type AddBoardMember,
  type GetBoard,
} from "./board.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import asyncHandler from "../../util/async.handler.js";
import boardService from "./board.service.js";

const router = Router();
router.get(
  "/",
  validate(getBoardSchema),
  asyncHandler(async (req: TypedRequest<GetBoard>, res: Response) => {
    return res.json(
      await boardService.getBoard(
        req.validatedData?.memberType ?? [],
        req.validatedData?.boardYear ?? 2026,
      ),
    );
  }),
);

router.post(
  "/",
  validate(addBoardMemberSchema),
  asyncHandler(async (req: TypedRequest<AddBoardMember>, res: Response) => {
    res.json(await boardService.addMember(req.validatedData!));
  }),
);

export default router;
