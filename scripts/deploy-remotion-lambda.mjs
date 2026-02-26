/**
 * Deploy script for Remotion Lambda.
 *
 * Usage:
 *   node scripts/deploy-remotion-lambda.mjs
 *
 * Prerequisites:
 *   - Set REMOTION_AWS_ACCESS_KEY_ID, REMOTION_AWS_SECRET_ACCESS_KEY,
 *     and REMOTION_AWS_REGION in .env.local or environment.
 *   - Create IAM role/user with `npx remotion lambda policies role` and
 *     `npx remotion lambda policies user`.
 */

import { deployFunction, deploySite, getOrCreateBucket } from "@remotion/lambda";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
try {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join("=").trim();
            }
        }
    });
} catch {
    console.log("No .env.local found, using environment variables.");
}

const region = process.env.REMOTION_AWS_REGION || "us-east-1";

async function main() {
    console.log("🚀 Deploying Remotion Lambda...");
    console.log(`   Region: ${region}`);

    // 1. Deploy Lambda function
    console.log("\n📦 Deploying Lambda function...");
    const { functionName, alreadyExisted } = await deployFunction({
        region,
        timeoutInSeconds: 240,
        memorySizeInMb: 3009,
        createCloudWatchLogGroup: true,
        architecture: "arm64",
    });
    console.log(
        `   Function: ${functionName} (${alreadyExisted ? "already existed" : "newly created"})`
    );

    // 2. Get or create S3 bucket
    console.log("\n🪣 Getting S3 bucket...");
    const { bucketName } = await getOrCreateBucket({ region });
    console.log(`   Bucket: ${bucketName}`);

    // 3. Deploy site (Remotion bundle)
    console.log("\n🌐 Deploying Remotion site...");
    const { serveUrl, siteName } = await deploySite({
        region,
        bucketName,
        entryPoint: path.join(__dirname, "..", "remotion", "index.ts"),
        siteName: "visioncraft-video",
    });
    console.log(`   Site: ${siteName}`);
    console.log(`   Serve URL: ${serveUrl}`);

    // 4. Print summary
    console.log("\n✅ Deployment complete! Add these to your .env.local:\n");
    console.log(`REMOTION_LAMBDA_FUNCTION_NAME=${functionName}`);
    console.log(`REMOTION_SITE_NAME=${siteName}`);
    console.log(`REMOTION_AWS_REGION=${region}`);
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
});
