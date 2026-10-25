/**
 * The sixteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十六个版本的更新内容：士兵打光之后，主将独自支撑，撑不住可以撤退。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.16',
  date: '2026-10-24',
  title: '士兵打光之后：孤军奋战与撤退 · The last stand of a lone general',
  summary: [
    '最后一名士兵倒下，战斗不会立刻结束：主将独自支撑 8 秒，攻击更强、出手更快。',
    '你只剩主将时会出现「🏳 撤退」按钮：这一场判负，但不会再损失第二批士兵，带着当前生命退回战场周围。',
    '敌方主将独自撑到最后会只身逃走 —— 这一场算你赢，战利品与占领照常结算。',
    '快速推演的回合没有这 8 秒（没有地图可回），士兵打光即结束。'
  ],
  batches: BATCHES
}
