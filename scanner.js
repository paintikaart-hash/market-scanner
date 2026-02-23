// Market Scanner – GitHub Actions
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const COINS = [
  {symbol:'BTCUSDT',label:'BTC/USD',name:'Bitcoin'},
  {symbol:'ETHUSDT',label:'ETH/USD',name:'Ethereum'},
  {symbol:'BNBUSDT',label:'BNB/USD',name:'Binance Coin'},
  {symbol:'SOLUSDT',label:'SOL/USD',name:'Solana'},
  {symbol:'XRPUSDT',label:'XRP/USD',name:'XRP'},
  {symbol:'ADAUSDT',label:'ADA/USD',name:'Cardano'},
  {symbol:'AVAXUSDT',label:'AVAX/USD',name:'Avalanche'},
  {symbol:'DOTUSDT',label:'DOT/USD',name:'Polkadot'},
  {symbol:'LINKUSDT',label:'LINK/USD',name:'Chainlink'},
  {symbol:'POLUSDT',label:'POL/USD',name:'Polygon'},
  {symbol:'DOGEUSDT',label:'DOGE/USD',name:'Dogecoin'},
  {symbol:'LTCUSDT',label:'LTC/USD',name:'Litecoin'},
  {symbol:'ATOMUSDT',label:'ATOM/USD',name:'Cosmos'},
  {symbol:'NEARUSDT',label:'NEAR/USD',name:'NEAR Protocol'},
  {symbol:'UNIUSDT',label:'UNI/USD',name:'Uniswap'},
  {symbol:'SUIUSDT',label:'SUI/USD',name:'Sui'},
  {symbol:'INJUSDT',label:'INJ/USD',name:'Injective'},
  {symbol:'ARBUSDT',label:'ARB/USD',name:'Arbitrum'},
  {symbol:'OPUSDT',label:'OP/USD',name:'Optimism'},
  {symbol:'RENDERUSDT',label:'RNDR/USD',name:'Render'},
  {symbol:'TONUSDT',label:'TON/USD',name:'Toncoin'},
  {symbol:'PEPEUSDT',label:'PEPE/USD',name:'Pepe'},
  {symbol:'WIFUSDT',label:'WIF/USD',name:'dogwifhat'},
  {symbol:'BONKUSDT',label:'BONK/USD',name:'Bonk'},
  {symbol:'JUPUSDT',label:'JUP/USD',name:'Jupiter'},
  {symbol:'SEIUSDT',label:'SEI/USD',name:'Sei'},
  {symbol:'TIAUSDT',label:'TIA/USD',name:'Celestia'},
  {symbol:'PYTHUSDT',label:'PYTH/USD',name:'Pyth Network'},
  {symbol:'STRKUSDT',label:'STRK/USD',name:'Starknet'},
  {symbol:'MANTAUSDT',label:'MANTA/USD',name:'Manta Network'},
  {symbol:'AAVEUSDT',label:'AAVE/USD',name:'Aave'},
  {symbol:'MKRUSDT',label:'MKR/USD',name:'Maker'},
  {symbol:'CRVUSDT',label:'CRV/USD',name:'Curve'},
  {symbol:'LDOUSDT',label:'LDO/USD',name:'Lido DAO'},
  {symbol:'EIGENUSDT',label:'EIGEN/USD',name:'Eigenlayer'},
  {symbol:'PENDLEUSDT',label:'PENDLE/USD',name:'Pendle'},
  {symbol:'BLURUSDT',label:'BLUR/USD',name:'Blur'},
  {symbol:'GMXUSDT',label:'GMX/USD',name:'GMX'},
  {symbol:'DYDXUSDT',label:'DYDX/USD',name:'dYdX'},
  {symbol:'ETHFIUSDT',label:'ETHFI/USD',name:'Ether.fi'},
  {symbol:'FETUSDT',label:'FET/USD',name:'Fetch.ai'},
  {symbol:'AGIXUSDT',label:'AGIX/USD',name:'SingularityNET'},
  {symbol:'OCEANUSDT',label:'OCEAN/USD',name:'Ocean Protocol'},
  {symbol:'TAOUSDT',label:'TAO/USD',name:'Bittensor'},
  {symbol:'WLDUSDT',label:'WLD/USD',name:'Worldcoin'},
];

// ── INDIKATOREN ──
function ema(d,p){if(!d||d.length<2)return d?.[d.length-1]||0;const k=2/(p+1);const s=Math.min(p,d.length);let v=d.slice(0,s).reduce((a,b)=>a+b,0)/s;for(let i=s;i<d.length;i++)v=d[i]*k+v*(1-k);return v;}
function rsi(c,p=14){if(c.length<p+1)return 50;let g=0,l=0;const s=c.length-p;for(let i=s;i<c.length;i++){const d=c[i]-c[i-1];if(d>0)g+=d;else l-=d;}let ag=g/p,al=l/p;if(al===0)return 100;return 100-100/(1+ag/al);}
function macdH(c){if(c.length<26)return 0;const line=ema(c.slice(-12),12)-ema(c.slice(-26),26);return line-(line*0.85);}
function bbPct(c,p=20){if(c.length<p)return 50;const sl=c.slice(-p);const mean=sl.reduce((a,b)=>a+b,0)/p;const std=Math.sqrt(sl.reduce((a,b)=>a+(b-mean)**2,0)/p);const upper=mean+2*std,lower=mean-2*std;const last=c[c.length-1];return std>0?((last-lower)/(upper-lower))*100:50;}
function stochR(c,p=14){const rv=[];for(let i=p;i<c.length;i++)rv.push(rsi(c.slice(i-p,i+1),p));if(rv.length<p)return 50;const sl=rv.slice(-p);const mn=Math.min(...sl),mx=Math.max(...sl);return mx===mn?50:((rv[rv.length-1]-mn)/(mx-mn))*100;}
function atrFn(c,p=14){if(c.length<p+1)return c[c.length-1]*0.01;const trs=[];for(let i=1;i<c.length;i++)trs.push(Math.abs(c[i]-c[i-1]));return trs.slice(-p).reduce((a,b)=>a+b,0)/p;}
function adxFn(closes,period=14){if(closes.length<period*2+1)return{adx:0,strong:false};const plusDM=[],minusDM=[],tr=[];for(let i=1;i<closes.length;i++){const up=closes[i]-closes[i-1],down=closes[i-1]-closes[i];plusDM.push(up>down&&up>0?up:0);minusDM.push(down>up&&down>0?down:0);tr.push(Math.abs(closes[i]-closes[i-1]));}function wilder(arr,p){let s=arr.slice(0,p).reduce((a,b)=>a+b,0);const out=[s];for(let i=p;i<arr.length;i++){s=s-s/p+arr[i];out.push(s);}return out;}const sTR=wilder(tr,period),sPDM=wilder(plusDM,period),sMDM=wilder(minusDM,period);const DIs=sTR.map((t,i)=>t>0?100*sPDM[i]/t:0);const DIm=sTR.map((t,i)=>t>0?100*sMDM[i]/t:0);const DX=DIs.map((p,i)=>{const s=p+DIm[i];return s>0?100*Math.abs(p-DIm[i])/s:0;});const adxVal=DX.slice(-period).reduce((a,b)=>a+b,0)/period;return{adx:adxVal,strong:adxVal>40};}

function analyze(closes){
  if(closes.length<30)return null;
  const e50=ema(closes.slice(-50),Math.min(50,closes.length));
  const e200=ema(closes.slice(-200),Math.min(200,closes.length));
  const last=closes[closes.length-1];
  const r=rsi(closes),m=macdH(closes),bb=bbPct(closes),srVal=stochR(closes);
  let score=0;
  if(e50>e200&&last>e50)score+=2; else if(e50<e200&&last<e50)score-=2;
  if(r<35)score++; else if(r>65)score--;
  if(m>0)score++; else if(m<0)score--;
  if(bb<20)score++; else if(bb>80)score--;
  if(srVal<20)score++; else if(srVal>80)score--;
  const adxResult=adxFn(closes);
  if(adxResult.strong)score+=0.5; else if(adxResult.adx<25)score*=0.6;
  return{signal:score>=2?'buy':score<=-2?'sell':'neutral',score,rsi:r,adx:adxResult.adx};
}

// ── BINANCE FETCH – multiple endpoints ──
const BINANCE_ENDPOINTS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
];

async function fetchBinance(symbol, interval, limit=150) {
  for (const base of BINANCE_ENDPOINTS) {
    try {
      const url = `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {'User-Agent':'Mozilla/5.0','Accept':'application/json'},
      });
      if (!res.ok) { console.log(`  ${base} → HTTP ${res.status}`); continue; }
      const data = await res.json();
      if (!Array.isArray(data)||data.length<5) continue;
      return data.map(k=>parseFloat(k[4])).filter(v=>!isNaN(v)&&v>0);
    } catch(e) { console.log(`  ${base} → ${e.message}`); continue; }
  }
  return null;
}

// ── TELEGRAM ──
async function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN||!TELEGRAM_CHAT_ID) { console.log('Telegram nicht konfiguriert'); return false; }
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text:msg,parse_mode:'HTML'})
    });
    const data = await res.json();
    if (data.ok) console.log('✅ Telegram gesendet');
    else console.log('❌ Telegram Fehler:', data.description);
    return data.ok;
  } catch(e) { console.log('❌ Telegram Exception:', e.message); return false; }
}

function fmtPrice(p){if(p>1000)return p.toLocaleString('de-CH',{maximumFractionDigits:0});if(p>1)return p.toFixed(2);return p.toFixed(5);}

// ── MAIN ──
async function runScan() {
  console.log(`\n🔍 Scan gestartet: ${new Date().toLocaleString('de-CH')}`);

  // Test Binance connectivity first
  console.log('\n📡 Teste Binance Verbindung...');
  const testData = await fetchBinance('BTCUSDT', '1d', 5);
  if (!testData) {
    console.log('❌ Binance nicht erreichbar – alle Endpoints blockiert');
    await sendTelegram('⚠️ Market Scanner: Binance API nicht erreichbar von GitHub Actions. Bitte manuell prüfen.');
    return;
  }
  console.log(`✅ Binance erreichbar, BTC Preis: ${fmtPrice(testData[testData.length-1])}`);

  const signals = [];
  let scanned = 0;

  for (const coin of COINS) {
    try {
      const [h1h,h4h,h1d] = await Promise.all([
        fetchBinance(coin.symbol,'1h',150),
        fetchBinance(coin.symbol,'4h',150),
        fetchBinance(coin.symbol,'1d',400),
      ]);

      if (!h1h||!h4h||!h1d||h1h.length<5) { console.log(`⏭ ${coin.label}: keine Daten`); continue; }
      scanned++;

      const tf1h=analyze(h1h), tf4h=analyze(h4h), tf1d=analyze(h1d);
      if (!tf1h||!tf4h||!tf1d) continue;

      const buys=[tf1h,tf4h,tf1d].filter(s=>s.signal==='buy').length;
      const sells=[tf1h,tf4h,tf1d].filter(s=>s.signal==='sell').length;
      if (buys!==3&&sells!==3) continue;

      const signal=buys===3?'buy':'sell';
      const price=h1h[h1h.length-1];
      const atr=atrFn(h1d);
      const slMult=signal==='buy'?-1.5:1.5;
      const sl=price+atr*slMult;
      const tp1=price-atr*slMult*1.5;
      const tp2=price-atr*slMult*3;

      signals.push({...coin,signal,price,sl,tp1,tp2,rsi:tf4h.rsi,adx:tf4h.adx});
      console.log(`★ ${coin.label}: ${signal.toUpperCase()}`);
      await new Promise(r=>setTimeout(r,150));
    } catch(e) { console.log(`✗ ${coin.symbol}: ${e.message}`); }
  }

  console.log(`\n📊 ${scanned} Coins gescannt · ${signals.length} STARK Signale`);

  if (signals.length===0) { console.log('Keine Signale – kein Telegram'); return; }

  await sendTelegram(
    `🔍 <b>MARKET SCANNER – ${new Date().toLocaleString('de-CH')}</b>\n` +
    `📊 ${scanned} Coins · ${signals.length} STARK Signal${signals.length!==1?'e':''}\n━━━━━━━━━━━━━━━━━━━━`
  );
  await new Promise(r=>setTimeout(r,500));

  for (const sig of signals) {
    const dir=sig.signal==='buy'?'🟢 KAUFEN':'🔴 VERKAUFEN';
    await sendTelegram(
      `${dir} <b>${sig.label}</b> ★ STARK\n\n` +
      `💰 Preis: <code>${fmtPrice(sig.price)}</code>\n` +
      `🛑 Stop-Loss: <code>${fmtPrice(sig.sl)}</code>\n` +
      `🎯 TP1: <code>${fmtPrice(sig.tp1)}</code>\n` +
      `🎯 TP2: <code>${fmtPrice(sig.tp2)}</code>\n` +
      `📈 RSI: ${sig.rsi.toFixed(0)} · ADX: ${sig.adx.toFixed(0)}\n` +
      `⏱ Alle 3 Timeframes bestätigt`
    );
    await new Promise(r=>setTimeout(r,400));
  }
}

runScan().catch(console.error);
