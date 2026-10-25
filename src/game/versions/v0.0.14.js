/**
 * The fourteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十四个版本的更新内容：双方主将亲自上阵，各有四名亲兵挡刀。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.14',
  date: '2026-10-24',
  title: '主将上阵与四方亲兵：打倒敌人主将也结束不了这场仗 · Two generals on the field',
  summary: [
    '战场左右各站着一位主将：你是领主，对面是所属势力的大将。走到敌人身边，主将会自己挥刀。',
    '开战前双方各从自己的近战士兵里抽出 4 名亲兵围住主将：亲兵没死光，主将一下都挨不到。',
    '你的血量归零＝这场战斗立刻失败：损失一半士兵，被亲兵抬到随机一座城镇旁，血量回到一半，之后慢慢恢复（自己的城镇更快）。',
    '敌人主将打不倒——他会被抬到附近、回一半血，你可以一路追击；只有把敌人的士兵全部消灭才算赢。'
  ],
  batches: BATCHES
}
