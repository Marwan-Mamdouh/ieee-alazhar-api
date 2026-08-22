import { Router } from "express";

import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import adminFormsRouter from "./forms/admin.forms.router.js";
import adminSubmissionsRouter from "./submissions/admin.submissions.router.js";

const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(isAuthenticated, isAdmin);

adminRouter.use("/forms", adminFormsRouter);
adminRouter.use("/forms", adminSubmissionsRouter);

export default adminRouter;
