const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // ✅ 이 줄 추가
const app = express();

app.get('/', async (req, res) => {
  const formData = new URLSearchParams();
  formData.append('line', '2');
  formData.append('isCb', 'N');

  const response = await fetch('https://smss.seoulmetro.co.kr/traininfo/traininfoUserMap.do', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://smss.seoulmetro.co.kr/traininfo/traininfoUserView.do',
      'Origin': 'https://smss.seoulmetro.co.kr',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0'
    },
    body: formData.toString()
  });

  const html = await response.text();

  // ✅ 응답 내용 콘솔에 출력
  console.log('🔍 HTML 응답 시작 ----------------------');
  console.log(html.slice(0, 1000)); // 너무 길지 않게 앞 1000자만
  console.log('🔍 HTML 응답 끝 ------------------------');

  const rows = [...html.matchAll(/<div class="train_row">([\s\S]*?)<\/div>/g)].map(m =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  );

  res.json({ station: '강남', results: rows });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚇 Server running on port ${PORT}`));
