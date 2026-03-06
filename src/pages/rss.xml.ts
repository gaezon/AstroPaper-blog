import { createLocalizedRssResponse } from "@/utils/i18n-api";

export async function GET() {
  return createLocalizedRssResponse("zh-CN");
}
