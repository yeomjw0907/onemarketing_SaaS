/**
 * .next 폴더 삭제 (Windows EPERM / OneDrive 잠금 방지용)
 * 사용: npm run clean
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", ".next");
if (fs.existsSync(dir)) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    console.log("Removed .next");
  } catch (e) {
    console.error("Failed to remove .next:", e.message);
    process.exit(1);
  }
} else {
  console.log(".next not found (already clean)");
}
