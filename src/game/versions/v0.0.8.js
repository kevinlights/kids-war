/**
 * The eighth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第八个版本的更新内容：远程小队后撤时不再把自己逼进墙角。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.8',
  date: '2026-10-23',
  title: '远程后撤不再钻墙角 · Ranged squads slip out of the corner',
  summary: [
    '攻击命令下的远程小队不再一路直线退到战场边缘：背后是墙或湖时会贴着墙滑开，必要时从敌人侧翼绕出去，不会把自己逼进角落站着对射。',
    '后撤前会先量每个方向还有多少空地，因此在开阔地里仍然是干脆地向后拉开距离，只在退路被挡住时才改道。',
    '后撤时也会避开敌人本身，不会为了找空地直接从敌人身上穿过去。'
  ],
  batches: BATCHES
}
