/**
 * 发起投票页面
 * 功能：表单收集标题、描述、动态选项、截止时间
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    title: '',           // 投票标题
    description: '',     // 投票描述
    options: ['', ''],   // 投票选项（至少2个）
    deadline: '',        // 截止时间（组合后的日期时间字符串）
    date: '',            // 日期
    time: '',            // 时间
    isSubmitting: false  // 提交状态
  },

  /**
   * 页面加载时执行
   */
  onLoad: function () {
    console.log('发起投票页面加载')
  },

  /**
   * 输入投票标题
   * @param {Object} e 事件对象
   */
  onTitleInput: function (e) {
    this.setData({ title: e.detail.value })
  },

  /**
   * 输入投票描述
   * @param {Object} e 事件对象
   */
  onDescriptionInput: function (e) {
    this.setData({ description: e.detail.value })
  },

  /**
   * 输入投票选项
   * 通过 data-index 获取当前选项索引
   * @param {Object} e 事件对象
   */
  onOptionInput: function (e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const options = [...this.data.options]
    options[index] = value
    this.setData({ options })
  },

  /**
   * 添加投票选项
   */
  addOption: function () {
    if (this.data.options.length >= 10) {
      wx.showToast({
        title: '最多添加10个选项',
        icon: 'none'
      })
      return
    }
    this.setData({
      options: [...this.data.options, '']
    })
  },

  /**
   * 删除投票选项
   * @param {Object} e 事件对象
   */
  removeOption: function (e) {
    const index = e.currentTarget.dataset.index
    if (this.data.options.length <= 2) {
      wx.showToast({
        title: '至少保留2个选项',
        icon: 'none'
      })
      return
    }
    const options = this.data.options.filter((_, i) => i !== index)
    this.setData({ options })
  },

  /**
   * 选择日期
   * @param {Object} e 事件对象
   */
  onDateChange: function (e) {
    this.setData({ date: e.detail.value })
    this.updateDeadline()
  },

  /**
   * 选择时间
   * @param {Object} e 事件对象
   */
  onTimeChange: function (e) {
    this.setData({ time: e.detail.value })
    this.updateDeadline()
  },

  /**
   * 更新截止时间
   */
  updateDeadline: function () {
    const { date, time } = this.data
    if (date && time) {
      this.setData({ deadline: `${date} ${time}` })
    } else if (date) {
      this.setData({ deadline: `${date} 23:59:59` })
    }
  },

  /**
   * 提交投票
   */
  async submitVote: function () {
    // 验证表单
    const { title, options, deadline } = this.data
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入投票标题',
        icon: 'none'
      })
      return
    }

    // 验证选项
    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      wx.showToast({
        title: '至少填写2个选项',
        icon: 'none'
      })
      return
    }

    // 防止重复提交
    if (this.data.isSubmitting) {
      return
    }

    this.setData({ isSubmitting: true })
    wx.showLoading({ title: '提交中...' })

    try {
      // 获取用户信息
      const loginRes = await wx.cloud.callFunction({ name: 'login' })
      const openid = loginRes.result.openid

      // 构造投票数据
      const voteData = {
        title: title.trim(),
        description: this.data.description.trim(),
        options: validOptions,
        createTime: new Date(),
        voteCount: 0,
        voteResults: new Array(validOptions.length).fill(0),
        votes: {},
        status: 'active',
        creator: '用户',
        openid: openid
      }

      // 如果有截止时间，添加到数据中
      if (deadline) {
        voteData.endDate = new Date(deadline)
      }

      // 提交到云数据库
      const db = wx.cloud.database()
      const res = await db.collection('votes').add({
        data: voteData
      })

      console.log('投票创建成功', res)

      wx.hideLoading()
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })

      // 重置表单
      this.setData({
        title: '',
        description: '',
        options: ['', ''],
        deadline: '',
        date: '',
        time: '',
        isSubmitting: false
      })

      // 延迟返回首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)

    } catch (err) {
      console.error('创建投票失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      })
      this.setData({ isSubmitting: false })
    }
  }
})