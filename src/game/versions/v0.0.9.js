/**
 * The ninth release of the game.
 *
 * The notes of a release are the batches it shipped: the whole history of
 * the game lives in `progress.md`, and `tools/build-versions.mjs` turns its
 * 「已完成功能 · Completed Features」 section into the data below.
 *
 * 第九个版本的更新内容：战斗界面可以随时退出、显示帧率、用鼠标或手指拖动，
 * 手机左缘的滑动返回也不会再把一场战斗甩掉。
 */
import { BATCHES } from './batches'

export default {
  version: '0.0.9',
  date: '2026-10-23',
  title: '战斗界面：随时退出、帧率与拖动 · Battle screen: leave, frame rate and dragging',
  summary: [
    '快速战斗的右上角多出「← 返回」，什么时候都能回到快速战斗的设置页，不必等一方被打垮。',
    '右上角的小芯片显示最近半秒的平均帧率，低于 50 变成金色、低于 30 变成红色；悬停或按住还能看到这半秒里最慢的一帧。',
    '战场可以用鼠标左键或手指拖动：拖动会停止自动跟随，点「🎯」回到战斗；轻点仍然是移动指挥官，拖动不会被当成一次点击。',
    '战斗进行中，手机浏览器左缘的滑动返回会被拦下并给出提示，要离开请用界面上的返回按钮或打完这一仗。',
    '战斗界面底部的命令栏不再铺一层黑色半透明背景，小队与命令按钮各自带面板，地图在按钮之间依然看得见。'
  ],
  batches: BATCHES
}
