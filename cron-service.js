import cron from "node-cron";
import { admin, db } from "./config/firebaseAdmin.js";
import express from "express";

// Run every day at 1:30 AM IST (cron uses server timezone – adjust if needed)
cron.schedule("0 0 * * 1-6", async () => {
  console.log("Running daily absent marking...");

  const now = new Date();
  const targetDate = now.toISOString().split("T")[0];

  const usersSnap = await db.collection("users").get();

  const batch = db.batch();
  let absentCount = 0;

  console.log("usersSnap : ", usersSnap.docs);

  for (const userDoc of usersSnap.docs) {
    console.log("userDoc : ", userDoc.data());
    const userId = userDoc.id;
    const attRef = db
      .collection("users")
      .doc(userId)
      .collection("attendance")
      .doc(targetDate);

    const attSnap = await attRef.get();
    console.log("attSnap :", attSnap.data());

    if (!attSnap.exists) {
      batch.set(attRef, {
        status: "absent",
        autoMarked: true,
        markedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      absentCount++;
    }
  }

  await batch.commit();
  console.log(`Marked ${absentCount} absences for ${targetDate}`);
});

// Optional: keep process alive (important for free hosts)
console.log("Cron job scheduler started");
process.on("SIGTERM", () => process.exit(0));

const app = express();

// Simple health endpoint so Render sees an open port
app.get("/health", (req, res) => {
  res.status(200).send("Cron is alive");
});

// Optional: root route for debugging
app.get("/", (req, res) => {
  res.send("This is a background cron job service");
});

// Start the HTTP server on Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Dummy server listening on port ${PORT} (for Render health check)`,
  );
});

// Your node-cron code stays exactly the same below or above
// ...
console.log("Cron scheduler started");
