import { describe, expect, it, beforeEach } from "vitest";
import type { Job } from "./api";
import i18n from "../i18n";
import { getJobProgressDisplay, parseAggregatedErrors } from "./jobErrors";

describe("jobErrors", () => {
  describe("parseAggregatedErrors (legacy Chinese)", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    it("处理空输入", () => {
      expect(parseAggregatedErrors("")).toEqual([]);
      expect(parseAggregatedErrors(undefined)).toEqual([]);
      expect(parseAggregatedErrors("   ")).toEqual([]);
    });

    it("解析单一常规错误", () => {
      const groups = parseAggregatedErrors("用户不存在或已被封禁 (404 Not Found)");
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("用户不存在或已被封禁 (404 Not Found)");
      expect(groups[0].count).toBe(1);
      expect(groups[0].targets).toEqual([]);
    });

    it("解析单个账号的报错", () => {
      const groups = parseAggregatedErrors("读取 @alice 的媒体时间线失败: 连接超时");
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("连接超时");
      expect(groups[0].action).toBe("读取媒体时间线失败");
      expect(groups[0].targets).toEqual(["@alice"]);
      expect(groups[0].count).toBe(1);
    });

    it("聚合相同原因的报错并合并账号及追加数量（历史无换行粘连文本场景）", () => {
      const rawScreenshotError =
        "读取 @ld98625239830 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @Finngangpao 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @luojiashan0 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @GN_175 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @franky_mmm 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @ZKJT0P1 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @LichengRyan 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "读取 @EDSIONTOP1 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 " +
        "另有 23 个错误";

      const groups = parseAggregatedErrors(rawScreenshotError);
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("X 客户端暂时全部限流，请稍后重试");
      expect(groups[0].action).toBe("读取媒体时间线失败");
      expect(groups[0].targets).toHaveLength(8);
      expect(groups[0].targets).toContain("@ld98625239830");
      expect(groups[0].targets).toContain("@EDSIONTOP1");
      expect(groups[0].count).toBe(31);
    });

    it("多行换行分割的多种异常聚合", () => {
      const multiline = [
        "读取 @u1 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试",
        "读取 @u2 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试",
        "读取 @u3 的媒体时间线失败: 404 Not Found",
        "创建 @u4 的归档链接失败: 权限不足",
      ].join("\n");

      const groups = parseAggregatedErrors(multiline);
      expect(groups).toHaveLength(3);

      const rateLimitGroup = groups.find((g) => g.reason.includes("限流"));
      expect(rateLimitGroup).toBeDefined();
      expect(rateLimitGroup?.count).toBe(2);
      expect(rateLimitGroup?.targets).toEqual(["@u1", "@u2"]);

      const notFoundGroup = groups.find((g) => g.reason.includes("404"));
      expect(notFoundGroup).toBeDefined();
      expect(notFoundGroup?.count).toBe(1);
      expect(notFoundGroup?.targets).toEqual(["@u3"]);

      const linkGroup = groups.find((g) => g.action?.includes("归档链接"));
      expect(linkGroup).toBeDefined();
      expect(linkGroup?.targets).toEqual(["@u4"]);
    });

    it("解析后端新版预聚合格式", () => {
      const backendAggregated =
        "读取媒体时间线失败: X 客户端暂时全部限流，请稍后重试 (共 31 个账号: @u1、@u2、@u3 等)";
      const groups = parseAggregatedErrors(backendAggregated);
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("X 客户端暂时全部限流，请稍后重试");
      expect(groups[0].action).toBe("读取媒体时间线失败");
      expect(groups[0].count).toBe(31);
      expect(groups[0].targets).toEqual(["@u1", "@u2", "@u3"]);
    });
  });

  describe("parseAggregatedErrors (English)", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("en");
    });

    it("parses a single-account English timeline error", () => {
      const groups = parseAggregatedErrors(
        "Failed to read timeline for @alice: connection timed out",
      );
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("connection timed out");
      expect(groups[0].action).toBe("Failed to read timeline");
      expect(groups[0].targets).toEqual(["@alice"]);
      expect(groups[0].count).toBe(1);
    });

    it("aggregates concatenated English rate-limit rows with trailer", () => {
      const raw =
        "Failed to read timeline for @u1: X clients temporarily rate limited; retry later " +
        "Failed to read timeline for @u2: X clients temporarily rate limited; retry later " +
        "Failed to read timeline for @u3: X clients temporarily rate limited; retry later " +
        "and 5 more errors";

      const groups = parseAggregatedErrors(raw);
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("X clients temporarily rate limited; retry later");
      expect(groups[0].action).toBe("Failed to read timeline");
      expect(groups[0].targets).toEqual(["@u1", "@u2", "@u3"]);
      expect(groups[0].count).toBe(8);
    });

    it("parses English backend pre-aggregated format", () => {
      const backendAggregated =
        "Failed to read timeline: X clients temporarily rate limited; retry later (31 accounts: @u1, @u2, @u3)";
      const groups = parseAggregatedErrors(backendAggregated);
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("X clients temporarily rate limited; retry later");
      expect(groups[0].action).toBe("Failed to read timeline");
      expect(groups[0].count).toBe(31);
      expect(groups[0].targets).toEqual(["@u1", "@u2", "@u3"]);
    });

    it("maps known codes via errors.* catalog", () => {
      const groups = parseAggregatedErrors("rate_limited: ignored detail");
      expect(groups).toHaveLength(1);
      expect(groups[0].reason).toBe("X clients temporarily rate limited; retry later");
    });
  });

  describe("getJobProgressDisplay", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    it("正常进行中的任务返回其进度文案", () => {
      const job: Job = {
        id: 1,
        kind: "user",
        status: "downloading",
        input: "@user",
        title: "用户 user",
        progress: 45,
        message: "正在下载推文媒体...",
        createdAt: "",
        updatedAt: "",
      };
      const display = getJobProgressDisplay(job);
      expect(display.displayMsg).toBe("正在下载推文媒体...");
      expect(display.hasError).toBe(false);
    });

    it("成功任务返回完成文案", () => {
      const job: Job = {
        id: 2,
        kind: "user",
        status: "completed",
        input: "@user",
        title: "用户 user",
        progress: 100,
        message: "归档完成：下载 10",
        createdAt: "",
        updatedAt: "",
      };
      const display = getJobProgressDisplay(job);
      expect(display.displayMsg).toBe("归档完成：下载 10");
      expect(display.hasError).toBe(false);
    });

    it("单一错误任务返回清晰的错误原因", () => {
      const job: Job = {
        id: 3,
        kind: "user",
        status: "failed",
        input: "@failed",
        title: "用户 failed",
        progress: 0,
        message: "任务失败",
        error: "用户不存在或已被封禁 (404 Not Found)",
        createdAt: "",
        updatedAt: "",
      };
      const display = getJobProgressDisplay(job);
      expect(display.displayMsg).toBe("用户不存在或已被封禁 (404 Not Found)");
      expect(display.hasError).toBe(true);
    });

    it("多账号聚合限流时，进度列展示聚合原因与受影响项数", () => {
      const job: Job = {
        id: 4,
        kind: "following",
        status: "completed_with_errors",
        input: "@chenbin3625",
        title: "关注 @chenbin3625",
        progress: 100,
        message: "归档完成：用户 262，推文 8794，下载 101，跳过 10893，失败 31",
        error:
          "读取 @u1 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 读取 @u2 的媒体时间线失败: X 客户端暂时全部限流，请稍后重试 另有 29 个错误",
        createdAt: "",
        updatedAt: "",
      };
      const display = getJobProgressDisplay(job);
      expect(display.displayMsg).toBe("X 客户端暂时全部限流，请稍后重试 (31项)");
      expect(display.hasError).toBe(true);
      expect(display.tooltip).toContain("归档完成");
      expect(display.tooltip).toContain("X 客户端暂时全部限流，请稍后重试 [31项]");
    });

    it("aggregates English stored errors in EN UI", async () => {
      await i18n.changeLanguage("en");
      const job: Job = {
        id: 5,
        kind: "following",
        status: "completed_with_errors",
        input: "@owner",
        title: "Following @owner",
        progress: 100,
        message: "Archive complete: users 2, tweets 10, downloaded 1, failed 3",
        error:
          "Failed to read timeline for @u1: X clients temporarily rate limited; retry later " +
          "Failed to read timeline for @u2: X clients temporarily rate limited; retry later " +
          "and 1 more errors",
        createdAt: "",
        updatedAt: "",
      };
      const display = getJobProgressDisplay(job);
      expect(display.displayMsg).toBe(
        "X clients temporarily rate limited; retry later (3 items)",
      );
      expect(display.hasError).toBe(true);
    });
  });
});
