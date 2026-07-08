import { z } from "zod";
import { registry } from "../../util/registry.js";
import {
  getBoardSchema,
  boardMemberDTO,
  boardIdSchema,
  addBoardMemberSchema,
  updateBoardMemberSchema,
} from "./board.schema.js";

registry.registerPath({
  method: "get",
  path: "/api/v1/board",
  tags: ["Board"],
  summary: "Get board members by board type, position and year",
  request: { query: getBoardSchema },
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
  method: "get",
  path: "/api/v1/board/years",
  tags: ["Board"],
  summary: "Get all board years",
  responses: {
    200: {
      description: "Successful response with board years",
      content: {
        "application/json": {
          schema: z.array(z.number()),
        },
      },
    },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/board",
  tags: ["Board"],
  summary: "Add board member",
  security: [{ cookieAuth: [] }],
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
    201: {
      description: "Board member added successfully",
      content: {
        "application/json": {
          schema: boardMemberDTO,
        },
      },
    },
    400: { description: "Bad request due to invalid request body" },
    401: { description: "Unauthorized due to missing authentication" },
    403: { description: "Forbidden due to insufficient permissions" },
    409: { description: "Board member already exists" },
    422: { description: "Unprocessable entity due to invalid request body" },
    429: { description: "Too many requests" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/board/{id}/avatar",
  tags: ["Board"],
  summary: "Update board avatar",
  security: [{ cookieAuth: [] }],
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
    401: { description: "Unauthorized due to missing authentication" },
    403: { description: "Forbidden due to insufficient permissions" },
    404: { description: "Board member not found" },
    422: { description: "Unprocessable entity due to invalid request body" },
    429: { description: "Too many requests" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/board/{id}",
  tags: ["Board"],
  summary: "Update board member",
  security: [{ cookieAuth: [] }],
  request: {
    params: boardIdSchema,
    body: {
      content: {
        "application/json": {
          schema: updateBoardMemberSchema,
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
    401: { description: "Unauthorized due to missing authentication" },
    404: { description: "Board member not found" },
    422: { description: "Unprocessable entity due to invalid request body" },
    429: { description: "Too many requests" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/board/{id}/avatar",
  tags: ["Board"],
  summary: "Delete board avatar",
  security: [{ cookieAuth: [] }],
  request: {
    params: boardIdSchema,
  },
  responses: {
    204: {
      description: "Avatar deleted successfully",
    },
    400: { description: "Bad request due to invalid request params" },
    401: { description: "Unauthorized due to missing authentication" },
    404: { description: "Board member not found" },
    422: { description: "Unprocessable entity due to invalid request body" },
    429: { description: "Too many requests" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/board/{id}",
  tags: ["Board"],
  summary: "Delete board member",
  security: [{ cookieAuth: [] }],
  request: {
    params: boardIdSchema,
  },
  responses: {
    204: {
      description: "Board member deleted successfully",
    },
    400: { description: "Bad request due to invalid request params" },
    401: { description: "Unauthorized due to missing authentication" },
    404: { description: "Board member not found" },
    422: { description: "Unprocessable entity due to invalid request body" },
    429: { description: "Too many requests" },
    500: { description: "Internal server error" },
  },
});
