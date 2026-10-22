/**
 * The second release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第二个版本的更新内容：学习主线全面升级，首页与地图界面也收拾了一遍。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.2',
  date: '2026-10-21',
  title: '考试就是经验 · An exam is experience',
  summary: [
    '一次考试现在结算得更多：连击、满分、长卷与及格都有加成，答错不扣钱。',
    '做题会掉道具，答对的题数还会解锁军旗、徽章、药箱与驿马四个永久道具。',
    '及格的卷子给出经验，经验换成统御、医术、工程与谋略，让学习真的改变战斗。',
    '新增掌握度地图、只考错题与复习队列两种复习卷。',
    '首页只留一个版本入口，配色与布局更清爽，手机竖屏更好用；地图提示移到顶部。'
  ],
  batches: BATCHES
}
