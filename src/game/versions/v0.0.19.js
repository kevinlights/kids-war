/**
 * The nineteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十九个版本的更新内容：全图上的随从也有兵力角标，世界地图上方统一成黑色透明玻璃。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.19',
  date: '2026-10-25',
  title: '全图标都有兵数，顶部一律黑玻璃 Badges on every icon, one black glass above the map',
  summary: [
    '详细全图上的每位随从，右上角也画出兵力徽章 —— 和领主、敌将一样，只是小一号；没有兵的随从不挂。',
    '世界地图上方统一成一块黑色透明玻璃：状态栏芯片与按钮、小地图、图例和它的开关共用同一背景。',
    '悬停按钮只是加深黑色，不再闪白色或金色；文字颜色照旧各自区分。'
  ],
  batches: BATCHES
}
