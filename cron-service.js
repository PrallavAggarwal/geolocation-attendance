import cron from "node-cron";
import { admin, db } from "./config/firebaseAdmin.js";

// Run every day at 1:30 AM IST (cron uses server timezone – adjust if needed)
cron.schedule("30 1 * * *", async () => {
  console.log("Running daily absent marking...");

  const now = new Date();
  now.setDate(now.getDate() - 1); // yesterday
  const targetDate = now.toISOString().split("T")[0];

  const usersSnap = await db.collection("users").get();

  const batch = db.batch();
  let absentCount = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const attRef = db
      .collection("users")
      .doc(userId)
      .collection("attendance")
      .doc(targetDate);

    const attSnap = await attRef.get();

    if (!attSnap.exists()) {
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
