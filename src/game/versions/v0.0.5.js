/**
 * The fifth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第五个版本的更新内容：遇敌先说话，可以逃跑，也可以从对话框直接开战。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.5',
  date: '2026-10-23',
  title: '遇敌对话与逃跑 · Meet the enemy before the fight',
  summary: [
    '遇敌不再直接开战：双方先停下来对话，敌将的头像、身份和兵力一览就在对话框里。',
    '可以尝试逃跑：主角会随机退开 3–6 格，遇到的那支敌军短时间内追不上来，不损失一兵一卒。',
    '也可以直接开战：从对话框进入战场，敌人就是刚才拦路的那支队伍。'
  ],
  batches: BATCHES
}
