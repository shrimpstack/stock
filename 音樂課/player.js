/* ================================ */
/*  播放                            */
/* ================================ */
const 播放器 = (() => {
  const obj = {};
  let 播放狀態 = false;
  let 指針位置 = 0;
  let 開始時間 = 0;
  let 間隔 = 0;

  /* 播放控制 */
  Object.defineProperty(obj, "播放切換", {
    writable: false,
    value: () => {
      播放狀態 = !播放狀態;
      if(播放狀態) {
        開始時間 = new Date().getTime();
        播放器.指針位置 = null;
        播放目前針的聲音();
      }
    },
  });
  Object.defineProperty(obj, "暫停", {
    writable: false,
    value: () => {
      播放狀態 = false;
    },
  });
  Object.defineProperty(obj, "停止", {
    writable: false,
    value: () => {
      播放狀態 = false;
      播放器.指針位置 = 0;
    },
  });

  /* 指針控制 */
  Object.defineProperty(obj, "上一小節", {
    writable: false, value: () => { 第幾小節input.value -= 1; 播放器.從輸入框更新指針(); }
  });
  Object.defineProperty(obj, "上一拍", {
    writable: false, value: () => { 第幾拍input.value -= 1; 播放器.從輸入框更新指針(); }
  });
  Object.defineProperty(obj, "下一拍", {
    writable: false, value: () => { 第幾拍input.value = +第幾拍input.value + 1; 播放器.從輸入框更新指針(); }
  });
  Object.defineProperty(obj, "下一小節", {
    writable: false, value: () => { 第幾小節input.value = +第幾小節input.value + 1; 播放器.從輸入框更新指針(); }
  });

  /* 指針相關 */
  Object.defineProperty(obj, "指針最大位置", {
    get: () => {
      return 樂譜.childElementCount * 顯示設定.一小節幾音符 - 1;
    },
  });
  Object.defineProperty(obj, "指針位置", {
    get: () => {
      return 指針位置;
    },
    set: (目標位置) => {
      let 最大位置 = 樂譜.childElementCount * 顯示設定.一小節幾音符 - 1;
      if(目標位置 == null) 目標位置 = 指針位置;
      指針位置 = 目標位置 = Math.min(Math.max(Math.floor(目標位置), 0), 播放器.指針最大位置);
      let 第幾小節 = Math.floor(目標位置 / 顯示設定.一小節幾音符);
      let 小節el = 樂譜.children[第幾小節];
      小節el.append(mark);
      mark.style.gridColumn = 目標位置 % 顯示設定.一小節幾音符 + 1;
      樂譜.scrollTop = 小節el.offsetTop - 樂譜.offsetTop;
      第幾小節input.value = Math.floor(目標位置 / 顯示設定.一小節幾音符) + 1;
      第幾拍input.value = Math.floor(目標位置 % 顯示設定.一小節幾音符 / 顯示設定.一拍幾音符) + 1;
    },
  });
  Object.defineProperty(obj, "從輸入框更新指針", {
    writable: false,
    value: () => {
      let 小節數量 = 樂譜.childElementCount;
      let 目標節 = Math.floor(+第幾小節input.value || 0) - 1;
      let 目標拍 = Math.floor(+第幾拍input.value || 0) - 1;
      if(目標拍 < 0 || 目標拍 >= 顯示設定.一小節幾拍) {
        目標節 += Math.floor(目標拍 / 顯示設定.一小節幾拍);
      }
      目標拍 = (目標拍 + 顯示設定.一小節幾拍) % 顯示設定.一小節幾拍;
      目標節 = (目標節 + 小節數量) % 小節數量;
      第幾小節input.value = 目標節 + 1;
      第幾拍input.value = 目標拍 + 1;
      播放器.指針位置 = 目標節 * 顯示設定.一小節幾音符 + 目標拍 * 顯示設定.一拍幾音符;
    },
  });

  /* 設定區 */
  Object.defineProperty(obj, "改變BPM", { value: 改變BPM, writable: false });
  function 改變BPM() {
    間隔 = 60e3 / +BPM.value / 4;
  }
  window.addEventListener("load", 改變BPM);

  /* 循環區 */
  function 這一直循環() {
    if(播放狀態) {
      if(new Date().getTime() - 開始時間 >= 間隔) {
        開始時間 = new Date().getTime();
        if(播放器.指針位置 == 播放器.指針最大位置) 播放器.指針位置 = 0;
        else 播放器.指針位置 += 1;
        播放目前針的聲音();
      }
    }
    requestAnimationFrame(這一直循環);
  }
  requestAnimationFrame(這一直循環);

  /* ================================ */
  /*  聲音處理                        */
  /* ================================ */
  const 鼓聲名稱 = {
    大鼓: "bass", 小鼓: "share-drum", 小鼓_鼓框: "share-stick",
    // BD bass drum; SD; SS
    高音中鼓: "tom1", 低音中鼓: "tom2", 落地鼓: "floor-tom",
    // T1 high tom; T2 low tom; FT
    碎音鈸: "crash", 疊音鈸: "ride",
    // CC crash cymbal; RC ride cymbal
    高帽鈸: "hihat", 高帽鈸_開鈸: "hihat-open", 腳踏鈸: "hihat-foot",
    // HH; HO; HF
  };
  const 鼓聲 = {};
  function 聲音初始化() {
    Object.entries(鼓聲名稱).forEach(([名稱, 檔名]) => {
      鼓聲[名稱] = {i: 0, arr: []};
      for(let i = 0; i < 8; i++) {
        let audio = new Audio();
        audio.src = `./${檔名}.mp3`;
        鼓聲[名稱].arr.push(audio);
      }
    });
  }
  聲音初始化();
  function 播放目前針的聲音() {
    if(不要聲音.checked) return;
    dot譜.filter(dot => dot.時 == 播放器.指針位置)
    .map(dot => {
      if(dot.鼓框) return "小鼓_鼓框";
      if(dot.開鈸) return "高帽鈸_開鈸";
      return dot.音;
    })
    .forEach(音符名 => {
      let 聲音obj = 鼓聲[音符名];
      聲音obj.arr[聲音obj.i].play();
      聲音obj.i = (聲音obj.i + 1) % 8;
    });
  }

  return obj;
})();
