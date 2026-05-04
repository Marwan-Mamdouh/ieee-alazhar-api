import cors from "cors";

const allowedOrigins = [
  "https://ieee-al-azhar-university.web.app",
  "https://ieee-al-azhar-university.firebaseapp.com",
  "http://localhost:5173",
];

const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsMiddleware;
