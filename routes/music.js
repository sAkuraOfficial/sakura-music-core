const express = require('express');
const router = express.Router();
const axios = require('axios');

// 假设这是你的音乐数据
const musicData = [
    {id: 1, title: '叶惠美', artist: '周杰伦'},
    {id: 2, title: '稻香', artist: '周杰伦'}
];

// 获取所有音乐项
router.get('/music', (req, res) => {
    res.json(musicData);
});

// 获取音乐项
router.get('/search', async (req, res) => {
    const keywords = req.query.keywords;

    if (!keywords) {
        return res.status(400).json({message: 'Keywords query parameter is required'});
    }

    try {
        const response = await axios.get(`http://114.132.98.222:3000/search?keywords=${encodeURIComponent(keywords)}`);
        const data = response.data;

        // 获取所有歌曲的 ID
        const songIds = data.result.songs.map(song => song.id);

        // 并发请求所有歌曲的封面图片
        const imgPromises = songIds.map(id =>
            axios.get(`http://114.132.98.222:3000/song/detail?ids=${encodeURIComponent(id)}`)
                .then(res => res.data.songs[0].al.picUrl)
                .catch(() => null) // 如果请求失败，则图片 URL 设为 null
        );

        const imgUrls = await Promise.all(imgPromises);

        // 提取歌曲信息
        const songs = data.result.songs.map((song, index) => ({
            id: song.id,
            name: song.name,
            img: imgUrls[index], // 从 imgUrls 中获取对应的图片 URL
            artists: song.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            }))
        }));

        res.json(songs);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({message: 'Error fetching data from external API'});
    }
});

// 根据音乐id获取音乐封面
router.get('/getMusicImg', async (req, res) => {
    const music_id = req.query.id;

    if (!music_id) {
        return res.status(400).json({message: 'ID query parameter is required'});
    }

    try {
        const response = await axios.get(`http://114.132.98.222:3000/song/detail?ids=${encodeURIComponent(music_id)}`);
        const data = response.data;
        const img = data.songs[0].al.picUrl;
        res.json({img});
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({message: 'Error fetching data from external API'});
    }
});

module.exports = router;
