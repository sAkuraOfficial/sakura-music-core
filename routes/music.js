const express = require('express');
const router = express.Router();
const axios = require('axios');

// 创建 Axios 实例，设置超时
const axiosInstance = axios.create({
    timeout: 5000, // 设置请求超时为 5 秒
});

// 使用动态导入
let pLimit;
(async () => {
    pLimit = (await import('p-limit')).default; // 确保使用 .default
})();

// 假设这是你的音乐数据
const musicData = [
    { id: 1, title: '叶惠美', artist: '周杰伦' },
    { id: 2, title: '稻香', artist: '周杰伦' },
];

// 获取所有音乐项
router.get('/music', (req, res) => {
    res.json(musicData);
});

// 获取音乐项
router.get('/search', async (req, res) => {
    const keywords = req.query.keywords;

    if (!keywords) {
        return res.status(400).json({ message: 'Keywords query parameter is required' });
    }

    console.log(`Received request for /search with keywords: ${keywords}`);

    try {
        const response = await axiosInstance.get(`http://127.0.0.1:3000/search?keywords=${encodeURIComponent(keywords)}`);
        const data = response.data;

        if (!data.result || !data.result.songs) {
            return res.status(500).json({ message: 'Invalid response from external API' });
        }

        const songIds = data.result.songs.map(song => song.id);
        const limit = pLimit(15); // 限制并发数量为 5

        const imgPromises = songIds.map(id => limit(() => axiosInstance.get(`http://127.0.0.1:3000/song/detail?ids=${encodeURIComponent(id)}`)
            .then(res => res.data.songs[0]?.al.picUrl || null)
            .catch(() => null)
        ));

        const imgUrls = await Promise.all(imgPromises);

        const songs = data.result.songs.map((song, index) => ({
            id: song.id,
            name: song.name,
            img: imgUrls[index],
            artists: song.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
            })),
        }));

        res.json(songs);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ message: 'Error fetching data from external API' });
    }
});

// 根据音乐ID获取音乐封面
router.get('/getMusicImg', async (req, res) => {
    const music_id = req.query.id;

    if (!music_id) {
        return res.status(400).json({ message: 'ID query parameter is required' });
    }

    console.log(`Received request for /getMusicImg with ID: ${music_id}`);

    try {
        const response = await axiosInstance.get(`http://127.0.0.1:3000/song/detail?ids=${encodeURIComponent(music_id)}`);
        const data = response.data;

        if (!data.songs || !data.songs.length) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const img = data.songs[0].al.picUrl;
        res.json({ img });
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ message: 'Error fetching data from external API' });
    }
});

// 获取横幅
router.get('/getBanner', async (req, res) => {
    console.log('Received request for /getBanner');

    try {
        const response = await axiosInstance.get(`http://127.0.0.1:3000/banner`);
        const data = response.data;

        if (!data.banners || !Array.isArray(data.banners)) {
            return res.status(500).json({ message: 'Invalid response from external API' });
        }

        let banners = data.banners.filter(banner => banner.targetType !== 3000);
        banners = banners.map(banner => ({
            img: banner.imageUrl,
        }));

        res.json(banners);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ message: 'Error fetching data from external API' });
    }
});

// 获取个性化歌单，参数是数量
router.get('/personalized', async (req, res) => {
    const limit = req.query.limit;

    if (!limit) {
        return res.status(400).json({ message: 'limit query parameter is required' });
    }

    console.log(`Received request for /personalized with limit: ${limit}`);

    try {
        const response = await axiosInstance.get(`http://127.0.0.1:3000/personalized?limit=${encodeURIComponent(limit)}`);
        const data = response.data;

        if (!data.result) {
            return res.status(500).json({ message: 'Invalid response from external API' });
        }

        const playlists = data.result.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            img: playlist.picUrl,
            playCount: playlist.playCount,
        }));

        res.json(playlists);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ message: 'Error fetching data from external API' });
    }
});

module.exports = router;
