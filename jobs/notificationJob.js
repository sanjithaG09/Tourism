const cron = require("node-cron");
const User = require("../models/User");
const Trip = require("../models/trip");
const { sendTripReminderEmail } = require("../services/emailService");

// tracks which trip+day combos we've emailed this process run (in-memory dedup)
const sentToday = new Set();

// ── Core reminder logic — exported so it can be triggered manually too ────────
async function runReminderJob() {
    console.log("[CRON] Running trip reminder job…");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split("T")[0];

    const reminderDays = [5, 3, 1];
    let emailsSent = 0;

    for (const daysLeft of reminderDays) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysLeft);

        const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
        const end   = new Date(targetDate); end.setHours(23, 59, 59, 999);

        const upcomingTrips = await Trip.find({ date: { $gte: start, $lte: end } });

        for (const trip of upcomingTrips) {
            const dedupeKey = `${todayKey}_${daysLeft}d_${trip._id}`;
            if (sentToday.has(dedupeKey)) continue;

            const user = await User.findById(trip.userId).select("name email");
            if (!user) continue;

            // Send reminder email
            try {
                await sendTripReminderEmail(user.name, user.email, trip.city, trip.date, daysLeft);
                sentToday.add(dedupeKey);
                console.log(`[CRON] Reminder sent → ${user.email} | ${trip.city} | ${daysLeft}d away`);
                emailsSent++;
            } catch (err) {
                console.error(`[CRON] Email failed → ${user.email} | ${err.message}`);
            }
        }
    }

    console.log(`[CRON] Done — ${emailsSent} reminder email(s) sent.`);
    return emailsSent;
}

// ── Schedule: every day at 9 AM ───────────────────────────────────────────────
const startNotificationJob = () => {
    cron.schedule("0 9 * * *", async () => {
        try {
            await runReminderJob();
        } catch (err) {
            console.error("[CRON] Unexpected error:", err.message);
        }
    });
    console.log("[CRON] Trip reminder job scheduled — runs daily at 9 AM");
};

module.exports = { startNotificationJob, runReminderJob };
