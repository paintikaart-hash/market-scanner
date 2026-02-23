// Market Scanner – GitHub Actions – CoinGecko Batch Edition
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const COINS = [
  {symbol:'bitcoin',label:'BTC/USD',name:'Bitcoin'},
  {symbol:'ethereum',label:'ETH/USD',name:'Ethereum'},
  {symbol:'binancecoin',label:'BNB/USD',name:'Binance Coin'},
  {symbol:'solana',label:'SOL/USD',name:'Solana'},
  {symbol:'ripple',label:'XRP/USD',name:'XRP'},
  {symbol:'cardano',label:'ADA/USD',name:'Cardano'},
  {symbol:'avalanche-2',label:'AVAX/USD',name:'Avalanche'},
  {symbol:'polkadot',label:'DOT/USD',name:'Polkadot'},
  {symbol:'chainlink',label:'LINK/USD',name:'Chainlink'},
  {symbol:'matic-network',label:'POL/USD',name:'Polygon'},
  {symbol:'dogecoin',label:'DOGE/USD',name:'Dogecoin'},
  {symbol:'litecoin',label:'LTC/USD',name:'Litecoin'},
  {symbol:'cosmos',label:'ATOM/USD',name:'Cosmos'},
  {symbol:'near',label:'NEAR/USD',name:'NEAR Protocol'},
  {symbol:'uniswap',label:'UNI/USD',name:'Uniswap'},
  {symbol:'sui',label:'SUI/USD',name:'Sui'},
  {symbol:'injective-protocol',label:'INJ/USD',name:'Injective'},
  {symbol:'arbitrum',label:'ARB/USD',name:'Arbitrum'},
  {symbol:'optimism',label:'OP/USD',name:'Optimism'},
  {symbol:'render-token',label:'RNDR/USD',name:'Render'},
  {symbol:'toncoin',label:'TON/USD',name:'Toncoin'},
  {symbol:'pepe',label:'PEPE/USD',name:'Pepe'},
  {symbol:'dogwifcoin',label:'WIF/USD',name:'dogwifhat'},
  {symbol:'bonk',label:'BONK/USD',name:'Bonk'},
  {symbol:'jupiter-exchange-solana',label:'JUP/USD',name:'Jupiter'},
  {symbol:'sei-network',label:'SEI/USD',name:'Sei'},
  {symbol:'celestia',label:'TIA/USD',name:'Celestia'},
  {symbol:'pyth-network',label:'PYTH/USD',name:'Pyth Network'},
  {symbol:'starknet',label:'STRK/USD',name:'Starknet'},
  {symbol:'aave',label:'AAVE/USD',name:'Aave'},
  {symbol:'maker',label:'MKR/USD',name:'Maker'},
  {symbol:'curve-dao-token',label:'CRV/USD',name:'Curve'},
  {symbol:'lido-dao',label:'LDO/USD',name:'Lido DAO'},
  {symbol:'pendle',label:'PENDLE/USD',name:'Pendle'},
  {symbol:'gmx',label:'GMX/USD',name:'GMX'},
  {symbol:'dydx-chain',label:'DYDX/USD',name:'dYdX'},
  {symbol:'fetch-ai',label:'FET/USD',name:'Fetch.ai'},
  {symbol:'singularitynet',label:'AGIX/USD',name:'SingularityNET'},
  {symbol:'ocean-protocol',label:'OCEAN/USD',name:'Ocean Protocol'},
  {symbol:'bittensor',label:'TAO/USD',name:'Bittensor'},
  {symbol:'worldcoin-wld',label:'WLD/USD',name:'Worldcoin'},
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

// ── COINGECKO: Eine Anfrage für alle Coins ──
// Holt OHLC Daten (90 Tage) für einen Coin
async function fetchOHLC(coinId, days=90) {
  await new Promise(r=>setTimeout(r,1500)); // 1.5s zwischen Anfragen
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.log(`  Rate limit – warte 60s...`);
        await new Promise(r=>setTimeout(r,60000));
        // Retry
        const res2 = await fetch(url, {headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'}});
        if (!res2.ok) return null;
        const data2 = await res2.json();
        if (!Array.isArray(data2)||data2.length<5) return null;
        return data2.map(k=>k[4]); // close prices
      }
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)||data.length<5) return null;
    return data.map(k=>k[4]); // OHLC: [timestamp, open, high, low, close]
  } catch(e) { return null; }
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
  } catch(e) { return false; }
}

function fmtPrice(p){
  if(p>1000)return p.toLocaleString('de-CH',{maximumFractionDigits:0});
  if(p>1)return p.toFixed(2);
  if(p>0.01)return p.toFixed(4);
  return p.toFixed(7);
}

// ── MAIN ──
async function runScan() {
  console.log(`\n🔍 Scan gestartet: ${new Date().toLocaleString('de-CH')}`);
  console.log(`📊 ${COINS.length} Coins werden analysiert...\n`);

  const signals = [];
  let scanned = 0;
  let errors = 0;

  for (const coin of COINS) {
    try {
      // OHLC: 90 Tage für 4H-Simulation, 1 Tag für kurzfristig
      const [data90, data365] = await Promise.all([
        fetchOHLC(coin.symbol, 90),
        fetchOHLC(coin.symbol, 365),
      ]);

      if (!data90||data90.length<30) {
        console.log(`⏭ ${coin.label}: keine Daten`);
        errors++;
        continue;
      }

      scanned++;
      const c1d = data365 || data90;
      const c4h = data90;
      const c1h = data90.slice(-30);

      const tf1h=analyze(c1h), tf4h=analyze(c4h), tf1d=analyze(c1d);
      if (!tf1h||!tf4h||!tf1d) continue;

      const buys=[tf1h,tf4h,tf1d].filter(s=>s.signal==='buy').length;
      const sells=[tf1h,tf4h,tf1d].filter(s=>s.signal==='sell').length;

      if (buys===3||sells===3) {
        const signal=buys===3?'buy':'sell';
        const price=c1h[c1h.length-1];
        const atr=atrFn(c1d);
        const slMult=signal==='buy'?-1.5:1.5;
        signals.push({
          ...coin, signal, price,
          sl: price+atr*slMult,
          tp1: price-atr*slMult*1.5,
          tp2: price-atr*slMult*3,
          rsi: tf4h.rsi, adx: tf4h.adx
        });
        console.log(`★ ${coin.label}: ${signal.toUpperCase()}`);
      } else {
        console.log(`  ${coin.label}: ${tf1h.signal}/${tf4h.signal}/${tf1d.signal}`);
      }

    } catch(e) {
      console.log(`✗ ${coin.symbol}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n📊 ${scanned}/${COINS.length} Coins gescannt · ${signals.length} STARK Signale · ${errors} Fehler`);

  if (signals.length===0) {
    console.log('Keine Signale – kein Telegram');
    return;
  }

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
  console.log(`✅ Fertig!`);
}

runScan().catch(console.error);
