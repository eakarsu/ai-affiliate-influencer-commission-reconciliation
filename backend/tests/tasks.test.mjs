import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseTaskPriority, parseTaskStatus } from "../tasks.mjs";

test("task priority falls back to NORMAL", () => {
  assert.equal(parseTaskPriority("HIGH"), "HIGH");
  assert.equal(parseTaskPriority("LOW"), "LOW");
  assert.equal(parseTaskPriority("urgent"), "NORMAL");
  assert.equal(parseTaskPriority(undefined), "NORMAL");
});

test("task status validates strictly", () => {
  assert.equal(parseTaskStatus("DONE"), "DONE");
  assert.equal(parseTaskStatus("OPEN"), "OPEN");
  assert.equal(parseTaskStatus("CANCELLED"), "CANCELLED");
  assert.equal(parseTaskStatus("DELETED"), null);
  assert.equal(parseTaskStatus(""), null);
});

test("tasks are mounted behind auth and backed by a real table", () => {
  const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
  assert.ok(server.includes("mountTasks(app"), "server must mount tasks");
  assert.ok(
    server.indexOf("mountRecoveryRecordActions(app") < server.indexOf("mountTasks(app"),
    "tasks must mount after mountRecoveryRecordActions",
  );
  assert.ok(server.includes("mountTasks(app,{pool,audit,auth})"), "tasks must sit behind existing JWT auth");
  const tasks = fs.readFileSync(new URL("../tasks.mjs", import.meta.url), "utf8");
  assert.ok(tasks.includes('"/api/tasks"'), "tasks module must expose /api/tasks");
  const sql = fs.readFileSync(new URL("../migrations/002_tasks.sql", import.meta.url), "utf8");
  assert.ok(sql.includes("staff_tasks"), "migration must create staff_tasks");
});

test("session secret fails closed and demo-credentials endpoint is removed", () => {
  const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
  assert.ok(!server.includes("local-domain-recovery-session-change-before-production"), "no hard-coded SESSION_SECRET fallback");
  assert.ok(!server.includes("/api/auth/demo-credentials"), "demo-credentials endpoint must be removed");
  assert.ok(server.includes("at least 32"), "SESSION_SECRET must require 32+ chars");
});
