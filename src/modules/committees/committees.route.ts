import { Router, type Request, type Response } from "express";

import asyncHandler from "../../util/async.handler.js";
import { getCachedData, CACHE_KEYS, TTL } from "../../infra/cache/cache.js";
import committeesService from "./committees.service.js";

const router = Router();

router.get(
	"/",
	asyncHandler(async (_: Request, res: Response) => {
		const result = await getCachedData(
			CACHE_KEYS.committeesList(),
			() => committeesService.getCommittees(),
			TTL.COMMITTEES_LIST,
		);

		return res.json({ data: result });
	}),
);

export default router;
