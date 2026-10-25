/**
 * The thirteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十三个版本的更新内容：角落小地图与点击打开的世界全图都按势力给据点上色。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.13',
  date: '2026-10-24',
  title: '地图按势力上色：一眼看出每片地盘 · Faction colours on the maps',
  summary: [
    '点角落的小地图打开「世界全图」，每个城堡和村庄周围都画一圈归属色光环，名字牌也用归属色：你的城镇是蓝色、强盗灰色、苍狼王国紫色、赤鹰王国橙色，无主城镇保持原本的金色/淡色。',
    '右下角的小地图同样按势力给据点方块上色，和全图保持一致，势力的分布一眼可见。'
  ],
  batches: BATCHES
}
