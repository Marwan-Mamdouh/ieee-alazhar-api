import cors from "cors";
import { ForbiddenError } from "../errors/app.error.js";

const allowedOrigins = new Set([
	"https://ieee-al-azhar-university.web.app",
	"https://ieee-al-azhar-university.firebaseapp.com",
	"https://ieee-alazhar-web.vercel.app",
	"http://localhost:5173",
	// "http://localhost:4173",
]);

const corsMiddleware = cors({
	origin: (origin, cb) => {
		if (!origin || allowedOrigins.has(origin)) cb(null, true);
		else cb(new ForbiddenError("Not allowed by CORS"));
	},
	methods: ["GET", "POST", "PATCH", "DELETE"],
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsMiddleware;
