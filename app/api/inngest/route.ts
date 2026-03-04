import { serve } from "inngest/next";
import { inngest } from "../../../lib/inngest/client";
import { generateVideo } from "../../../lib/inngest/functions";
import { sendVideoEmailNotification } from "../../../lib/inngest/notifications";
import { scheduleSeriesDaily, processScheduledSeries } from "../../../lib/inngest/scheduling";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateVideo,
        sendVideoEmailNotification,
        scheduleSeriesDaily,
        processScheduledSeries,
    ],
});