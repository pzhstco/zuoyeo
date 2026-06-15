/**
 * 首页投票列表页面
 * 功能：展示投票列表，从云数据库读取数据
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    voteList: [],        // 投票列表数据
    isLoading: false,    // 加载状态
    hasMore: true,       // 是否有更多数据
    pageSize: 10,        // 每页条数
    pageNum: 1,          // 当前页码
    emptyText: '暂无投票，快去发起一个吧~'
  },

  /**
   * 页面加载时执行
   */
  onLoad: function () {
    console.log('首页加载')
    this.loadVoteList()
  },

  /**
   * 页面显示时执行
   */
  onShow: function () {
    this.refreshList()
  },

  /**
   * 加载投票列表
   * @param {Boolean} isRefresh 是否为下拉刷新
   */
  async loadVoteList(isRefresh = false) {
    // 上拉加载时不显示 loading 提示
    if (!isRefresh && !this.data.isLoading) {
      this.setData({ isLoading: true })
    }
    
    // 下拉刷新显示 loading
    if (isRefresh) {
      this.setData({ voteList: [], pageNum: 1, isLoading: true })
      wx.showLoading({ title: '加载中...' })
    }

    try {
      const db = wx.cloud.database()
      const pageSize = this.data.pageSize
      
      const res = await db.collection('votes')
        .orderBy('createTime', 'desc')
        .skip(isRefresh ? 0 : (this.data.pageNum - 1) * pageSize)
        .limit(pageSize)
        .get()

      console.log('获取投票列表成功', res.data)

      const newVoteList = this.processVoteList(res.data)

      if (isRefresh) {
        this.setData({
          voteList: newVoteList,
          pageNum: 1,
          hasMore: newVoteList.length >= pageSize
        })
        wx.stopPullDownRefresh()
        wx.hideLoading()
      } else {
        this.setData({
          voteList: [...this.data.voteList, ...newVoteList],
          hasMore: newVoteList.length === pageSize
        })
      }
    } catch (err) {
      console.error('获取投票列表失败', err)
      wx.stopPullDownRefresh()
      wx.hideLoading()
      if (!isRefresh) {
        this.setData({ 
          pageNum: Math.max(1, this.data.pageNum - 1),
          hasMore: false
        })
      }
      wx.showToast({
        title: '加载失败，请下拉刷新',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 处理投票列表数据，添加状态信息
   * @param {Array} list 原始数据
   */
  processVoteList(list) {
    const now = Date.now()
    return list.map(item => {
      let statusText = '进行中'
      let isExpired = false
      
      if (item.endDate) {
        const endTime = new Date(item.endDate).getTime()
        if (endTime < now) {
          statusText = '已结束'
          isExpired = true
        }
      }

      let formattedTime = '无截止时间'
      if (item.endDate) {
        const date = new Date(item.endDate)
        formattedTime = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      }

      return {
        ...item,
        statusText,
        isExpired,
        formattedTime
      }
    })
  },

  /**
   * 查看投票详情
   * @param {Object} e 事件对象
   */
  viewVoteDetail: function (e) {
    const voteId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${voteId}`
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.loadVoteList(true)
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ pageNum: this.data.pageNum + 1 })
      this.loadVoteList()
    }
  },

  /**
   * 刷新列表（页面显示时调用）
   */
  refreshList: function () {
    if (this.data.voteList.length === 0) {
      this.loadVoteList()
    }
  }
})