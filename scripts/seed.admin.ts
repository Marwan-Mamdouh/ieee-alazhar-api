// scripts/seed-admin.ts
// Run once locally to create the initial admin account.
// Requires a valid .env file. Never expose this as an HTTP route.
// Usage: npx tsx scripts/seed-admin.ts
import auth from "../src/util/auth.js";

await auth.api.createUser({
  body: {
    name: "Marwan",
    email: "your@email.com",
    password: "strong-password-here",
    role: "admin",
  },
});

console.log("Admin created");
process.exit(0);
