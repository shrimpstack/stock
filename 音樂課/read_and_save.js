/*
  名稱規定：
    譜句: [0]元素名 [1]元素名 [2]元素名
      譜節: [0]元素名
    位置譜編碼: [0] SD-0-2 SD!-8-1
      位於小節: [0]
      譜編碼：SD-0-2 LT!-8-1
        音符編碼：SD-0-1
          音符碼名：SD
          技法碼：!
          音符位置：0
          音符長度：1
    OX譜：HH(ooooooox)&HT(XXXxo)&SD(Xox'.xox)&BD(oxx~.ooX)
      OX譜部：HT(XXXxo)
        OX音符：X
    音符名：大鼓
    dot: {
      碼: 音符碼名,
      音: 音符名,
      時: 音符位置,
      長: 音符長度,
      鼓框: t/f,
      開鈸: t/f,
    }
  譜資料：
    {
      譜名: string,
      BPM: 120,
      元素表?: {元素名: 譜編碼 | OX譜},
      譜句表: 譜句[],
    }
*/

const 載入畫面 = (() => {
  const obj = {};
  Object.defineProperty(obj, "toggle", {
    set: (val) => {
      載入中.classList.toggle("hidden", !val);
    },
  });
  return obj;
})();

window.addEventListener("load", 讀取固定譜有哪些);
async function 讀取固定譜有哪些() {
  let res = await post("取得固定譜名稱列表", {});
  固定譜名.innerHTML = "";
  if(res.data) {
    res.data.forEach(譜名 => {
      let option = document.createElement("option");
      option.innerText = 譜名;
      option.value = 譜名;
      固定譜名.append(option);
    });
  }
}
async function 讀取固定譜() {
  播放器.停止();
  載入畫面.toggle = true;
  let res = await post("取得固定譜", {name: 固定譜名.value});
  if(res.data) 樂譜操作.顯示譜資料(res.data);
  載入畫面.toggle = false;
}
async function 儲存目前的譜(覆蓋) {
  if(!儲存譜名.value) {
    alert("名稱不能空白");
    return;
  }
  播放器.停止();
  載入畫面.toggle = true;
  let 譜資料 = 樂譜操作.取得譜資料();
  let res = await post("儲存譜", {
    name: 儲存譜名.value,
    sents: 譜資料.元素表,
    sheet: 譜資料.譜句表,
    lyrics: 譜資料.歌詞表,
    replace: !!覆蓋,
  });
  if(res.data.error == "這個譜名已經存在") {
    let 要不要覆蓋 = confirm("這個譜名已經存在，確定要覆蓋嗎？");
    if(要不要覆蓋) return 儲存目前的譜(true);
  }
  else alert(res.data.error || res.data.success);
  載入畫面.toggle = false;
}

async function 讀取隨機列表() {
  播放器.停止();
  載入畫面.toggle = true;
  let res = await post("讀取隨機列表", {class_name: 編輯隨機類名.value});
  樂譜操作.清空();
  res.data
  .map(譜元素 => {
    if(/\&|\(/.test(譜元素)) return OX譜_轉_譜編碼(譜元素);
    return 譜元素;
  })
  .forEach((譜編碼, i) => {
    樂譜操作.加入譜編碼(`[${i}]${譜編碼}`);
  });
  載入畫面.toggle = false;
}
async function 儲存隨機列表() {
  let 隨機內容arr = [...樂譜.children]
  .map((小節el, 小節i) => {
    let 譜編碼 = 樂譜操作.取得譜編碼(小節i, 1);
    let OX譜 = 譜編碼_轉_OX譜(譜編碼);
    return OX譜;
  })
  .filter(譜元素 => 譜元素);
  載入畫面.toggle = true;
  let res = await post("儲存隨機列表", {class_name: 編輯隨機類名.value, content_arr: 隨機內容arr});
  alert(res.data.error || res.data.success);
  載入畫面.toggle = false;
}

async function 產生隨機譜() {
  播放器.停止();
  載入畫面.toggle = true;
  let res = await post("取得所有隨機列表", {});
  let 隨機列表 = res.data;
  let OX譜arr = [];
  let 類型組arr = 隨機譜模式.value.split(" ");
  for(let i=0; i<+隨機譜要幾小節.value; i++) {
    let 類型組 = 類型組arr[i % 類型組arr.length].split("+");
    let 決定類名 = 類型組[Math.floor(Math.random() * 類型組.length)];
    let 可用OX譜 = 隨機列表[決定類名];
    let 決定OX譜 = 可用OX譜[Math.floor(Math.random() * 可用OX譜.length)];
    OX譜arr.push(決定OX譜);
  }
  for(let i=0; i<+隨機譜開頭要幾小節.value; i++) {
    OX譜arr.unshift("HH(oxoxoxox)");
  }
  樂譜操作.清空();
  OX譜arr.forEach((OX譜, 小節i) => {
    let 譜編碼 = OX譜_轉_譜編碼(OX譜);
    樂譜操作.加入譜編碼(`[${小節i}]${譜編碼}`);
  });
  載入畫面.toggle = false;
}
