/**
 * The eighteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十八个版本的更新内容：招募的随从会跟着主角在世界地图上走。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.18',
  date: '2026-10-25',
  title: '随从跟着走：地图上的小队 A companion rides along on the map',
  summary: [
    '招募的随从不再只在城镇里出现：主角行走时，他们排在身后两人一排跟着走，停下时就在身后站定。',
    '走动时随从会轻轻起伏，夜里和主角一起待在提灯的光圈里。',
    '小地图上主角周围多出一圈随从小点，详细全图里能直接看到他们的像素小人。',
    '世界地图顶部新增「👥 随从」芯片，路上一键打开面板分配士兵，不必跑回城里。'
  ],
  batches: BATCHES
}
