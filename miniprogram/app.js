/**
 * 小程序入口文件
 * 负责初始化小程序、配置云开发环境
 */

App({
  /**
   * 全局数据存储
   */
  globalData: {
    userInfo: null,   // 用户信息
    voteList: [],     // 投票列表缓存
  },

  /**
   * 小程序初始化时执行
   */
  onLaunch: function () {
    console.log('班级投票助手小程序启动')

    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      // 配置云开发环境
      wx.cloud.init({
        env: 'cloud1-d8ga3qbdhe7e0e0ff',  // ← 直接填入环境ID
        traceUser: true,
      })
      console.log('云开发初始化成功，环境ID: cloud1-d8ga3qbdhe7e0e0ff')
    }
  },

  /**
   * 获取用户信息（可选）
   */
  getUserInfo: function () {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (userRes) => {
              this.globalData.userInfo = userRes.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(userRes)
              }
            }
          })
        }
      }
    })
  }
})