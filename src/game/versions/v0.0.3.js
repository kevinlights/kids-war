/**
 * The third release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第三个版本的更新内容：题库检索、更多样的答题形式，以及更小的金币。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.3',
  date: '2026-10-21',
  title: '题库检索与更多答题形式 · The question bank and more shapes',
  summary: [
    '首页新增「🔎 题库检索」：搜索题目、按年级与科目过滤、点开看答案与解析。',
    '答题不再只有四选一：新增填空、配对与排序三种形式，数学、英文、语文与逻辑都有新题型。',
    '简单难度改成练习模式：每答对一题只奖励 5 个金币，普通与困难沿用原来的数值。'
  ],
  batches: BATCHES
}
