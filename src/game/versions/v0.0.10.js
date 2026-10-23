/**
 * The tenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十个版本的更新内容：400 v 400（800 名士兵）的战场稳定跑满 60 帧。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.10',
  date: '2026-10-23',
  title: '800 人战场稳定 60 帧 · A big battle holds 60 frames',
  summary: [
    '400 v 400（800 名士兵）的战场在桌面 Chrome 里从 8 帧提到 60 帧，帧率芯片、双方兵力与小队芯片照常刷新。',
    '找敌人不再每帧扫描全场：最近的敌人改在 90 px 的粗网格里按圈搜索，每名士兵把目标记住 0.18 秒，视线检查只在敌人进入攻击距离时才做。',
    '战场数据不再经过 Vue 代理，命令栏由每秒十次的计数器驱动，因此数百名士兵的坐标与生命值不再拖慢界面。',
    '点「⚔️ 全军出击」后对峙提示条立刻收起，底部提示换成冲锋说明。',
    '新增真实 Chrome 的大战场帧率检查：开一场 400 v 400，等双方接战后采样 6 秒，断言至少 30 帧、95% 的帧不超过 50 ms。'
  ],
  batches: BATCHES
}
