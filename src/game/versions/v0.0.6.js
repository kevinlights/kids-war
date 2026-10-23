/**
 * The sixth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第六个版本的更新内容：开局先对峙，敌军变阵后才冲锋，命令全部由主角来下。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.6',
  date: '2026-10-23',
  title: '开局先对峙，命令由你下 · A standoff before the charge',
  summary: [
    '刚进战场时敌我双方都驻守原地，先看清战场、调整队形，再决定怎么打。',
    '对峙约 5 秒后敌军先变阵（远程一线、近战楔形），再过约 2.4 秒才冲锋；你先动手的话，敌军一秒内就会应战。',
    '命令由你来下：底部提示条可一键「⚔️ 全军出击」，也可以先选一支小队单独下令；减员的小队会收拢队形补上前排。'
  ],
  batches: BATCHES
}
