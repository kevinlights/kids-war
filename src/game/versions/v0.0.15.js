/**
 * The fifteenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十五个版本的更新内容：主将倒下即结束这场战斗，两军退回战场旁。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.15',
  date: '2026-10-24',
  title: '主将倒下即收兵：两军退回战场旁 · A general going down ends the battle',
  summary: [
    '任何一位主将倒下，这场战斗都立刻结算：双方退回世界地图上刚刚那片战场周围（3–7 格）。',
    '你被打败：损失一半士兵、血量回到一半，但不再被送到随机城镇——就倒在战场旁边，敌人还在附近。',
    '敌人会继续追上来，你也可以按「逃跑」脱身；想翻盘就回头再打一场。',
    '把敌方主将打倒：同样立刻结算退回战场，你的队伍一个兵不少，敌队仍在原地，追不追由你决定。',
    '战斗要算赢，仍然得把敌人的士兵全部消灭。'
  ],
  batches: BATCHES
}
