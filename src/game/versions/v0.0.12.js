/**
 * The twelfth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十二个版本的更新内容：玩家可以把自己的部队留驻在己方城镇，驻军随城镇恢复。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.12',
  date: '2026-10-24',
  title: '驻守：把部队留在自己的城镇 · Station your soldiers in your towns',
  summary: [
    '在自己占领的城镇里，「驻守士兵」一栏把每种兵都列成一行，点「➕ 驻守」把部队里的一个士兵留下守城，点「➖ 撤回」再把他带回来。',
    '士兵的生命值跟着人走，不会凭空回满，也不会白白丢掉。',
    '留在城里的士兵会像主角一样，随城镇的等级与医院逐日恢复生命值；地图上这座城镇的兵力角标也会跟着驻军人数的变化实时更新。'
  ],
  batches: BATCHES
}
