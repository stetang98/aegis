/**
 * Split a Qwen3-Thinking-style completion into its hidden reasoning and the user-facing answer.
 * MedPsy emits `<think>…</think>` before the answer; the UI shows `answer` and may show `thinking`.
 *
 * Robust to: no block, multiple blocks, unclosed block (truncated stream / context overflow),
 * case-insensitive and whitespace-tolerant tags (`< think >`), a stray `</think>` with no open,
 * and a trailing partial tag fragment at a stream boundary (`…<thi`, `…</thin`). The invariant that
 * matters for a health app: a tag (or fragment) must NEVER leak into `answer`, and reasoning must
 * never be shown as the answer.
 */

export interface SplitThinkResult {
  thinking: string | null;
  answer: string;
}

const THINK_BLOCK = /<\s*think\s*>([\s\S]*?)<\s*\/\s*think\s*>/gi;
const OPEN_TAG = /<\s*think\s*>/i;
const STRAY_CLOSE = /<\s*\/\s*think\s*>/gi;
/** A trailing fragment that is a (partial) opening/closing think tag, e.g. "<", "</", "<thi", "</thin". */
const PARTIAL_TAIL = /<\s*\/?\s*(?:t(?:h(?:i(?:n(?:k)?)?)?)?)?$/i;

export function splitThink(raw: string): SplitThinkResult {
  const thinkParts: string[] = [];

  // 1) Pull out every complete <think>…</think> block (non-greedy, ws-tolerant, case-insensitive).
  let answer = raw.replace(THINK_BLOCK, (_match, inner: string) => {
    thinkParts.push(inner);
    return "";
  });

  // 2) An unclosed opening tag means the stream/context was cut mid-reasoning: the rest is reasoning.
  const open = OPEN_TAG.exec(answer);
  if (open) {
    thinkParts.push(answer.slice(open.index + open[0].length));
    answer = answer.slice(0, open.index);
  }

  // 3) Strip any stray closing tag(s) and 4) any trailing partial tag fragment so nothing leaks.
  answer = answer.replace(STRAY_CLOSE, "").replace(PARTIAL_TAIL, "");

  const joined = thinkParts.join("\n").trim();
  return { thinking: joined.length > 0 ? joined : null, answer: answer.trim() };
}
