import express from 'express';
import puppeteer from 'puppeteer';

const app = express();

app.get('/', async (req, res) => {
  const station = decodeURIComponent(req.query.station || '강남'); // ex: ?station=강남

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://smss.seoulmetro.co.kr/traininfo/traininfoUserView.do', {
    waitUntil: 'networkidle0'
  });

  // 🔄 2호선 클릭 & 대기 (기본값)
  await page.evaluate(() => {
    lineChange('2');
  });
  await page.waitForTimeout(2500); // 페이지 렌더링 대기

  const html = await page.content();

  await browser.close();

  // 🔍 `station`이 포함된 열차 행만 추출
  const rows = [...html.matchAll(/<div class="train_row">([\s\S]*?)<\/div>/g)];

  const result = rows.map((m) => {
    const clean = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return clean;
  }).filter(text => text.includes(station));

  // ⏩ 가장 가까운 열차 1개만 반환
  const nearest = result[0] || '해당 역의 열차 정보를 찾을 수 없습니다.';

  res.json({
    station,
    result: result.length,
    nearest
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚇 Server running on http://localhost:${port}`);
});