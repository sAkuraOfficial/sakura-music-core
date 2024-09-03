const express = require('express');
const router = express.Router();

// 假设这是你的音乐数据
const musicData = [
    { id: 1, title: '叶惠美', artist: '周杰伦' },
    { id: 2, title: '稻香', artist: '周杰伦' }
];

// 获取所有音乐项
router.get('/music', (req, res) => {
    res.json(musicData);
});

module.exports = router;
