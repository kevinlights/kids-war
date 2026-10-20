/**
 * The first release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 首个版本的更新内容：它包含游戏至今的全部批次。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.1',
  date: '2026-10-21',
  title: '首个版本 · First release',
  summary: [
    '首页显示游戏版本号，点击后用对话框查看本次更新的内容。',
    '扎营时新增「🎯 练兵」：没有敌人的训练场，用训练木桩练习移动、队形与攻击。',
    '新增「⚡ 快速战斗」：选战场、选敌我势力与士兵规模，模拟器替你打一遍。'
  ],
  batches: BATCHES
}
