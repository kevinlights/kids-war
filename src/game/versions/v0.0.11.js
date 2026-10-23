/**
 * The eleventh release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第十一个版本的更新内容：战场面积翻倍、镜头拖出边缘、手机战斗界面重排，以及近战冲锋与齐射减速。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.11',
  date: '2026-10-23',
  title: '手机战场、拖动缓冲与大战场冲锋 · A phone battlefield, a drag buffer and the charge',
  summary: [
    '战场的面积翻倍：1000 × 680 扩到 1400 × 960（约 1.98 倍面积），两军相距 784 px，开局有更多时间排兵布阵。',
    '镜头可以拖出战场四边约 140 px，看到外围的空地，边上的士兵不再被钉在屏幕边上；点 🎯 回到战斗。',
    '手机战斗界面重排：顶栏不再截断，命令栏从 256 px 压到 220 px，中间留出 69% 的净空，开局镜头缩到 0.42 让两支军队同时入镜。',
    '近战在 90 px 外会冲锋（+30% 速度），几秒后疲劳；弓箭手齐射后会短暂减速，贴到 32 px 内无法开弓，被咬住后很难继续风筝。',
    '同数量对局：长矛兵 8v8 只赢 1/5、20v20 惨胜 5/5；民兵仍打不过同数量弓箭手，骑兵依旧克制弓箭手。',
    '新增真实 Chrome 的手机战斗检查：390 × 844、dpr 3，量布局、遮挡、按钮尺寸与拖动缓冲。'
  ],
  batches: BATCHES
}
