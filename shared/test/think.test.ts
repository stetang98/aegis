import { test, expect, describe } from "vitest";
import { splitThink } from "../src/reasoning/think";

describe("splitThink", () => {
  test("splits a closed think block from the answer", () => {
    expect(splitThink("<think>reasoning here</think>The answer.")).toEqual({
      thinking: "reasoning here",
      answer: "The answer.",
    });
  });

  test("no think block → thinking null, full text is the answer", () => {
    expect(splitThink("Just the answer, no thinking.")).toEqual({
      thinking: null,
      answer: "Just the answer, no thinking.",
    });
  });

  test("unclosed think (truncated stream) → reasoning captured, empty answer", () => {
    expect(splitThink("<think>partial reasoning that got cut")).toEqual({
      thinking: "partial reasoning that got cut",
      answer: "",
    });
  });

  test("trims whitespace around thinking and answer", () => {
    expect(splitThink("<think>\n  r  \n</think>\n\n  answer  ")).toEqual({
      thinking: "r",
      answer: "answer",
    });
  });

  test("text before the think block is part of the answer", () => {
    const r = splitThink("Hi <think>x</think> there");
    expect(r.thinking).toBe("x");
    expect(r.answer).not.toContain("x");
    expect(r.answer).toContain("there");
  });

  test("tags are case-insensitive", () => {
    expect(splitThink("<THINK>r</Think>ans")).toEqual({ thinking: "r", answer: "ans" });
  });

  test("empty think block → thinking null", () => {
    expect(splitThink("<think></think>ans")).toEqual({ thinking: null, answer: "ans" });
  });

  test("multiple think blocks are joined", () => {
    expect(splitThink("<think>a</think>mid<think>b</think>end")).toEqual({
      thinking: "a\nb",
      answer: "midend",
    });
  });

  // --- robustness (from review): a tag/fragment must NEVER leak into answer ---

  test("stray closing tag (no open) is stripped from the answer", () => {
    expect(splitThink("</think>The answer")).toEqual({ thinking: null, answer: "The answer" });
  });

  test("trailing partial OPEN tag at stream boundary does not leak", () => {
    const r = splitThink("Here is your advice <thi");
    expect(r.answer).toBe("Here is your advice");
    expect(r.answer).not.toContain("<");
  });

  test("trailing partial CLOSE tag → reasoning captured, answer empty, no leak", () => {
    const r = splitThink("<think>reasoning</thin");
    expect(r.answer).toBe("");
    expect(r.thinking).toContain("reasoning");
  });

  test("whitespace inside tags is tolerated", () => {
    expect(splitThink("< think >reasoning</ think>answer")).toEqual({
      thinking: "reasoning",
      answer: "answer",
    });
  });

  test("nested open tags do not leak a tag into the answer", () => {
    const r = splitThink("<think>outer<think>inner</think>result");
    expect(r.answer).toBe("result");
    expect(r.answer.toLowerCase()).not.toContain("think");
  });

  test("empty input", () => {
    expect(splitThink("")).toEqual({ thinking: null, answer: "" });
  });

  test("open tag only → empty answer, thinking null", () => {
    expect(splitThink("<think>")).toEqual({ thinking: null, answer: "" });
  });

  test("large input with no tags returns intact and fast", () => {
    const big = "x".repeat(100000);
    const r = splitThink(big);
    expect(r.thinking).toBeNull();
    expect(r.answer.length).toBe(100000);
  });
});
