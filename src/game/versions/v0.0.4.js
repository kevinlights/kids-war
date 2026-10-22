/**
 * The fourth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第四个版本的更新内容：城镇里的慢钟，以及会走、会跳、会受伤、会倒下的士兵。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.4',
  date: '2026-10-23',
  title: '城镇慢钟与战场动画 · A slow town clock and a living battlefield',
  summary: [
    '城镇里的时间放慢 60 倍：现实 1 秒等于游戏里的 1 分钟，城镇里的一天是 24 分钟。',
    '士兵会走、会跳、会呼吸：行军时脚下扬起尘土，站定时轻轻起伏。',
    '受伤与阵亡有了动画：白光与红圈、身体晃动、重伤的红色脉冲，倒下的士兵会倒下并淡出。'
  ],
  batches: BATCHES
}
