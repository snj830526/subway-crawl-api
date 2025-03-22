import express from 'express';
import puppeteer from 'puppeteer';

const app = express();

app.get('/', async (req, res) => {
  try {
    const stationRaw = req.query.station || '강남';
    const station = decodeURIComponent(stationRaw.trim());
    const line = req.query.line || '2'; // ex: ?line=2

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.goto('https://smss.seoulmetro.co.kr/traininfo/traininfoUserView.do', {
      waitUntil: 'networkidle0',
    });

    // 노선 선택
    await page.evaluate((line) => {
      lineChange(line); // 페이지 내에 있는 JS 함수 호출
    }, line);

    // 페이지 렌더링 대기
    await page.waitForTimeout(2500);

    // 브라우저 내부에서 필요한 데이터만 추출
    const result = await page.evaluate((station) => {
      const rows = Array.from(document.querySelectorAll('.train_row'));
      return rows
        .map((row) => row.textContent.trim().replace(/\s+/g, ' '))
        .filter((text) => text.includes(station));
    }, station);

    await browser.close();

    // 가장 가까운 열차 1개만 반환
    res.json({
      station,
      line,
      result: result.length,
      nearest: result[0] || '해당 역의 열차 정보를 찾을 수 없습니다.',
    });
  } catch (e) {
    console.error('🚨 오류 발생:', e);
    res.status(500).json({ error: '데이터를 불러오는 데 실패했어요.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚇 Server running on http://localhost:${port}`);
});
