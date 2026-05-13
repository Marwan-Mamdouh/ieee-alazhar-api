import { z } from "zod";
import { registry } from "../../util/registry.js";
import {
	getBoardSchema,
	boardMemberDTO,
	boardIdSchema,
	addBoardMemberSchema,
} from "./board.schema.js";

registry.registerPath({
	method: "get",
	path: "/api/v1/board",
	tags: ["Board"],
	summary: "Get board members by board type, position and year",
	request: { params: getBoardSchema },
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: z.array(boardMemberDTO),
				},
			},
		},
		400: { description: "Bad request due to invalid query parameters" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/board/{id}",
	tags: ["Board"],
	summary: "Get board member by id",
	request: { params: boardIdSchema },
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: {
			description:
				"Bad request due to invalid request parameter, invalid board id",
		},
		404: { description: "Board member not found" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/board",
	tags: ["Board"],
	summary: "Add board member",
	request: {
		body: {
			content: {
				"application/json": {
					schema: addBoardMemberSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: { description: "Bad request due to invalid request body" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/board/{id}/avatar",
	tags: ["Board"],
	summary: "Update board avatar",
	request: {
		params: boardIdSchema,
		body: {
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
						properties: {
							avatar: {
								type: "string",
								format: "binary",
							},
						},
					},
				},
			},
		},
	},
	responses: {
		200: {
			description: "Successful response with uploaded avatar",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: { description: "Bad request due to invalid request body" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/board/{id}",
	tags: ["Board"],
	summary: "Update board member",
	request: {
		params: boardIdSchema,
		body: {
			content: {
				"application/json": {
					schema: addBoardMemberSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: { description: "Bad request due to invalid request body" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/board/{id}/avatar",
	tags: ["Board"],
	summary: "Delete board avatar",
	request: {
		params: boardIdSchema,
	},
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: { description: "Bad request due to invalid request params" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/board/{id}",
	tags: ["Board"],
	summary: "Delete board member",
	request: {
		params: boardIdSchema,
	},
	responses: {
		200: {
			description: "Successful response with board members",
			content: {
				"application/json": {
					schema: boardMemberDTO,
				},
			},
		},
		400: { description: "Bad request due to invalid request params" },
		500: { description: "Internal server error" },
	},
});
