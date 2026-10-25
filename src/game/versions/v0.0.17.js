/**
 * The seventeenth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十七个版本的更新内容：据点变成可以走动的城镇，镇上有名字的居民、委托与随从。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.17',
  date: '2026-10-25',
  title: '走进城镇：居民、委托与随从 Walks through town: its people, jobs and companions',
  summary: [
    '据点变成可以走动的场景：主街、广场喷泉、房屋与设施，点地面走路、点房子走到门口、点人走过去说话。',
    '每座城镇有七位有名字的居民（村庄四位），八个职业各有台词；头顶「?」未接、「!」进行中、「✓」已完成。',
    '委托要先点「📜 接受委托」才开始计数；城镇与世界地图都能打开委托日志，做完可以一键回城找他。',
    '委托做完花金币招为随从，再把士兵交给他的旗子 —— 他会带着这些人跟你上战场，伤亡分开结算。',
    '39 张新的 32×32 像素素材：地面、建筑与设施、街道道具与居民，仍由 Pixelorama 桥接绘制。'
  ],
  batches: BATCHES
}
