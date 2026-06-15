// miniprogram/pages/detail/detail.js
Page({
  data: {
    voteId: '',
    voteData: null,
    hasVoted: false,
    myVoteIndex: -1,
    loading: true,
    voting: false,
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  },

  onLoad(options) {
    console.log('详情页加载，voteId:', options.id);
    this.setData({ voteId: options.id });
    this.loadVoteDetail();
  },

  async loadVoteDetail() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('votes').doc(this.data.voteId).get();
      const vote = res.data;
      
      console.log('获取到投票数据:', vote);
      
      // 获取用户 openid
      const loginRes = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginRes.result.openid;
      console.log('当前用户openid:', openid);
      
      // 检查是否已投票（关键：votes 是对象，不是数组）
      const hasVoted = vote.votes && vote.votes[openid] !== undefined;
      const myVoteIndex = hasVoted ? vote.votes[openid] : -1;
      
      console.log('是否已投票:', hasVoted, '我的选项:', myVoteIndex);
      
      // 判断投票状态
      let status = vote.status;
      if (vote.endDate) {
        const now = Date.now();
        const endTime = new Date(vote.endDate).getTime();
        if (endTime < now && status === 'active') {
          status = 'ended';
        }
      }
      
      // 计算投票结果
      const total = vote.voteCount || 0;
      const percentages = vote.options.map((_, idx) => {
        const count = (vote.voteResults || [])[idx] || 0;
        return total === 0 ? 0 : Math.round(count / total * 100);
      });
      
      // 格式化时间
      const date = new Date(vote.createTime);
      
      this.setData({
        voteData: {
          ...vote,
          status,
          createTimeFormatted: `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`,
          voteResults: vote.voteResults || new Array(vote.options.length).fill(0),
          percentages,
          totalVotes: total
        },
        hasVoted,
        myVoteIndex,
        loading: false
      });
      
      wx.hideLoading();
    } catch (err) {
      console.error('加载失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async doVote(e) {
    const index = e.currentTarget.dataset.index;
    const { hasVoted, voteData, voting } = this.data;
    
    // 防止重复点击
    if (voting) return;
    
    // 检查是否已投票
    if (hasVoted) {
      wx.showToast({ title: '你已经投过票了', icon: 'none' });
      return;
    }
    
    // 检查投票是否进行中
    if (voteData.status !== 'active') {
      wx.showToast({ title: '投票已结束', icon: 'none' });
      return;
    }
    
    this.setData({ voting: true });
    wx.showLoading({ title: '投票中...' });
    
    try {
      const loginRes = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginRes.result.openid;
      
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 更新投票
      await db.collection('votes').doc(this.data.voteId).update({
        data: {
          voteCount: _.inc(1),
          voteResults: _.set(voteData.voteResults.map((count, idx) => 
            idx === index ? count + 1 : count
          )),
          votes: _.set({
            ...voteData.votes,
            [openid]: index
          })
        }
      });
      
      wx.hideLoading();
      wx.showToast({ title: '投票成功', icon: 'success' });
      
      // 重新加载数据显示结果
      setTimeout(() => {
        this.loadVoteDetail();
      }, 1000);
      
    } catch (err) {
      console.error('投票失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '投票失败', icon: 'none' });
      this.setData({ voting: false });
    }
  }
})