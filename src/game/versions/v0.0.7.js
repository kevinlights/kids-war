/**
 * The seventh release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第七个版本的更新内容：每一场战斗都重新生成一张战场。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.7',
  date: '2026-10-23',
  title: '每一战都是新战场 · A fresh battlefield for every battle',
  summary: [
    '每一场战斗都会重新生成战场：河流的走向、湖泊与山地的大小和位置、森林与沙地都不再固定，没有两场仗共用一张地图。',
    '同一个种子仍然会得到同一张地图；混战 / 平原 / 密林 / 山地 / 河流 / 湖泽六种预设也各自保证该有的地形。',
    '湖泊只落在战场内部并避开两侧列阵区，不会把战场切成两半，也不会让部队一开始就站在深水里。'
  ],
  batches: BATCHES
}
