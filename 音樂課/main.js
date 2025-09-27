/* ================================ */
/*  轉換                            */
/* ================================ */
/* grid_r <=> 音符名 */
const grid_r對應音符名 = ["碎音鈸", "高帽鈸", "疊音鈸", "高音中鼓", "低音中鼓", "小鼓", "落地鼓", "大鼓", "腳踏鈸"];
function grid_r_轉_音符名(grid_r) {
  return grid_r對應音符名[grid_r - 1];
}
function 音符名_轉_grid_r(音符名) {
  return grid_r對應音符名.indexOf(音符名) + 1;
}
/* 音符碼名 <=> 音符名 */
const 音符名對應碼名 = {
  大鼓: "BD", 小鼓: "SD", 小鼓_鼓框: "SS",
  高音中鼓: "HT", 低音中鼓: "LT", 落地鼓: "FT",
  碎音鈸: "CC", 疊音鈸: "RC",
  高帽鈸: "HH", 高帽鈸_開鈸: "HO", 腳踏鈸: "HF",
};
function 音符名_轉_音符碼名(音符名) {
  return 音符名對應碼名[音符名];
}
function 音符碼名_轉_音符名(碼名) {
  return Object.entries(音符名對應碼名).find(([key, val]) => val == 碼名)[0];
}
/* 音符編碼 <=> dot */
function 音符編碼_轉_dot(音符編碼) {
  if(!音符編碼) return null;
  let [音符碼名帶技法碼, 音符位置, 音符長度] = 音符編碼.split("-");
  let 音符碼名 = 音符碼名帶技法碼.replace(/[^a-z]/gi, '');
  let 技法碼 = 音符碼名帶技法碼.replace(/[a-z]/gi, '');
  let dot = {
    碼: 音符碼名,
    音: 音符碼名_轉_音符名(音符碼名),
    時: +音符位置,
    長: +音符長度,
  };
  if(/\!/.test(技法碼)) {
    if(音符碼名 == "SD") dot.鼓框 = true;
    if(音符碼名 == "HH") dot.開鈸 = true;
  }
  return dot;
}
function 歌詞編碼_轉_dot(歌詞編碼) {
  if(!歌詞編碼) return null;
  let [歌詞, 歌詞位置, 歌詞長度] = 歌詞編碼.split("-");
  let dot = {
    詞: 歌詞,
    時: +歌詞位置,
    長: +歌詞長度,
  };
  return dot;
}
/* OX譜 <=> 譜編碼 */
function OX譜_轉_譜編碼(OX譜) {
  let 譜編碼 = [];
  OX譜.split("&").forEach(OX譜部 => {
    if(!OX譜部) return "";
    let 音符位置 = 0;
    let 音符碼名 = OX譜部.replace(/\(.*$/, "");
    OX譜部.replace(/^.*\(|\)$/g, "").match(/[Xx'Oo.Qq,][\*\~\^]*/g).forEach(OX音符 => {
      let 音符長度 = 0;
      switch(OX音符[0]) {
        case "X": case "O": case "Q": 音符長度 = 4; break;
        case "x": case "o": case "q": 音符長度 = 2; break;
        case "'": case ".": case ",": 音符長度 = 1; break;
      }
      音符長度 *= 2 ** (OX音符.split(/\*/).length - 1);
      if(/\~/.test(OX音符)) 音符長度 *= 1.5;
      音符長度 += OX音符.match(/\^/g)?.length || 0;
      if(!/[Xx']/.test(OX音符)) {
        let 技法碼 = /[Qq\,]/.test(OX音符) ? "!" : "";
        譜編碼.push(`${音符碼名}${技法碼}-${音符位置}-${音符長度}`);
      }
      音符位置 += 音符長度;
    });
  });
  return 譜編碼.join(" ");
}
function 譜編碼_轉_OX譜(譜編碼) {
  let OX譜部表 = {};
  譜編碼.split(" ")
  .map(音符編碼 => 音符編碼_轉_dot(音符編碼)).filter(dot => dot)
  .forEach(dot => {
    if(!OX譜部表[dot.碼]) OX譜部表[dot.碼] = [];
    while(OX譜部表[dot.碼].length < dot.時) OX譜部表[dot.碼].push("'");
    let OX音符 = (dot.鼓框 || dot.開鈸 ?
      [",", "q", "q~", "Q", "Q^", "Q~", "Q~^", "Q*"]:
      [".", "o", "o~", "O", "O^", "O~", "O~^", "O*"]
    )[dot.長 - 1];
    let 此音符佔據的arr = [OX音符].concat(new Array(dot.長 - 1).fill(""));
    OX譜部表[dot.碼].splice(dot.時, dot.長, ...此音符佔據的arr);
  });
  return grid_r對應音符名.map(音符名 => 音符名_轉_音符碼名(音符名))
  .map(音符碼名 => {
    if(!OX譜部表[音符碼名]) return;
    let OX譜部內容 = OX譜部表[音符碼名].join("");
    OX譜部內容 = OX譜部內容.replace(/''''/g, "X").replace(/''/g, "x");
    OX譜部內容 = OX譜部內容.replace(/[Xx']*$/, "");
    return `${音符碼名}(${OX譜部內容})`;
  })
  .filter(OX譜部 => OX譜部).join("&");
}

/* ================================ */
/*  操作                            */
/* ================================ */
function 按下小節時新增歌詞(小節el, grid_c) {
  let 點了第幾小節 = [...樂譜.children].indexOf(小節el);
  let 歌詞位置 = 點了第幾小節 * 顯示設定.一小節幾音符 + (grid_c - 1);
  let dot = {詞: "", 時: 歌詞位置, 長: 1};
  if(檢查點擊位置是否衝突(dot)) return;
  let 音符i = 樂譜操作.新增詞dot(dot);
  return 音符i;
}
function 按下小節時新增音符(小節el, grid_r, grid_c) {
  let 音符名 = grid_r_轉_音符名(grid_r);
  if(!音符名) return;
  let 點了第幾小節 = [...樂譜.children].indexOf(小節el);
  let 音符位置 = 點了第幾小節 * 顯示設定.一小節幾音符 + (grid_c - 1);
  let dot = {音: 音符名, 時: 音符位置, 長: 1};
  if(檢查點擊位置是否衝突(dot)) return;
  let 音符i = 樂譜操作.新增dot(dot);
  return 音符i;
}
function 新增小節() {
  let 新小節 = document.createElement("div");
  新小節.classList.add("小節");
  樂譜.append(新小節);
  新小節.setAttribute("index", document.querySelectorAll(".小節").length);
}
function 滑動調整音符長度(target_i, 目標長度) {
  let 檢查長度 = [];
  if(target_i.matches("i")) 檢查長度.push(顯示設定.一音符最長幾格);
  let 最近dot = 往後尋找最接近的dot(target_i.dot);
  if(最近dot) 檢查長度.push(最近dot.時 - target_i.dot.時);
  檢查長度.push(顯示設定.一小節幾音符 - target_i.dot.時 % 顯示設定.一小節幾音符);
  let 最大長度 = Math.min(...檢查長度);
  目標長度 = Math.min(Math.max(Math.floor(+目標長度 || 0), 1), 最大長度);
  target_i.dot.長 = 目標長度;
  更新cell顯示(target_i);
}
function 滑動刪除音符(target_i) {
  let index = dot譜.indexOf(target_i.dot);
  dot譜.splice(index, 1);
  target_i.remove();
}
function 滑動刪除歌詞(target_input) {
  let index = dot歌詞表.indexOf(target_input.dot);
  dot歌詞表.splice(index, 1);
  target_input.remove();
}
function 滑動移動音符(target_i, target_grid_c) {
  let 在第幾小節 = Math.floor(target_i.dot.時 / 顯示設定.一小節幾音符);
  let 最小位置候選 = [在第幾小節 * 顯示設定.一小節幾音符];
  let 最大位置候選 = [(在第幾小節 + 1) * 顯示設定.一小節幾音符 - 1];
  let 前dot = 往前尋找最接近的dot(target_i.dot);
  let 後dot = 往後尋找最接近的dot(target_i.dot);
  if(前dot) 最小位置候選.push(前dot.時 + 前dot.長);
  if(後dot) 最大位置候選.push(後dot.時 - target_i.dot.長);
  let 最小位置 = Math.max(...最小位置候選);
  let 最大位置 = Math.min(...最大位置候選);
  let 目標位置 = 在第幾小節 * 顯示設定.一小節幾音符 + target_grid_c - 1;
  目標位置 = Math.min(Math.max(Math.floor(+目標位置 || 0), 最小位置), 最大位置);
  target_i.dot.時 = 目標位置;
  更新cell顯示(target_i);
}
function 點擊切換音色(target_i) {
  let dot = target_i.dot;
  if(dot.音 == "高帽鈸") target_i.classList.toggle("開鈸", dot.開鈸 = !dot.開鈸);
  if(dot.音 == "小鼓") target_i.classList.toggle("鼓框", dot.鼓框 = !dot.鼓框);
}

/* ================================ */
/*  dot譜動作                       */
/* ================================ */
let dot譜 = []; // dot[]
let dot歌詞表 = []; // dot[]
function 檢查點擊位置是否衝突(check_dot) {
  if(check_dot.詞 != undefined) {
    return !!dot歌詞表
      .filter(dot => dot != check_dot)
      .find(dot => dot.時 < check_dot.時 + check_dot.長 && dot.時 + dot.長 > check_dot.時);
  }
  return !!dot譜
    .filter(dot => dot != check_dot && dot.音 == check_dot.音)
    .find(dot => dot.時 < check_dot.時 + check_dot.長 && dot.時 + dot.長 > check_dot.時);
}
function 往後尋找最接近的dot(check_dot) {
  if(check_dot.詞 != undefined) {
    return dot歌詞表
      .filter(dot => dot != check_dot && dot.時 > check_dot.時)
      .sort((dotA, dotB) => dotA.時 - dotB.時)[0] || null;
  }
  return dot譜
    .filter(dot => dot != check_dot && dot.音 == check_dot.音 && dot.時 > check_dot.時)
    .sort((dotA, dotB) => dotA.時 - dotB.時)[0] || null;
}
function 往前尋找最接近的dot(check_dot) {
  if(check_dot.詞 != undefined) {
    return dot歌詞表
      .filter(dot => dot != check_dot && dot.時 < check_dot.時)
      .sort((dotA, dotB) => dotB.時 - dotA.時)[0] || null;
  }
  return dot譜
    .filter(dot => dot != check_dot && dot.音 == check_dot.音 && dot.時 < check_dot.時)
    .sort((dotA, dotB) => dotB.時 - dotA.時)[0] || null;
}
function 更新cell顯示(target) {
  let grid_c = (target.dot.時 % 顯示設定.一小節幾音符) + 1;
  target.style.gridColumn = `${grid_c} / ${target.dot.長} span`;
}

/* ================================ */
/*  樂譜動作                        */
/* ================================ */
const 樂譜操作 = (() => {
  function 往樂譜新增一個詞dot(dot) {
    let 要加在第幾小節 = Math.floor(dot.時 / 顯示設定.一小節幾音符);
    let input = document.createElement("input");
    input.dot = dot;
    input.classList.add("歌詞");
    input.value = dot.詞;
    input.addEventListener("input", () => dot.詞 = input.value);
    input.addEventListener("change", () => 歷史管理.記住());
    更新cell顯示(input);
    dot歌詞表.push(dot);
    樂譜.children[要加在第幾小節].append(input);
    return input;
  }
  function 往樂譜新增一個dot(dot) {
    let 要加在第幾小節 = Math.floor(dot.時 / 顯示設定.一小節幾音符);
    let i = document.createElement("i");
    i.dot = dot;
    i.classList.add(dot.音);
    if(dot.鼓框) i.classList.add("鼓框");
    if(dot.開鈸) i.classList.add("開鈸");
    更新cell顯示(i);
    dot譜.push(dot);
    樂譜.children[要加在第幾小節].append(i);
    return i;
  }
  function 取得樂譜中的譜編碼(start小節, length小節) {
    let 最多幾小節 = 樂譜.childElementCount;
    let start時 = Math.min(Math.max(Math.floor(+start小節 || 0), 0), 最多幾小節 - 1) * 顯示設定.一小節幾音符;
    if(!+length小節) length小節 = 最多幾小節;
    let end時 = start時 + Math.min(Math.max(Math.floor(+length小節), 1), 最多幾小節) * 顯示設定.一小節幾音符 - 1;
    return dot譜
      .filter(dot => dot.時 >= start時 && dot.時 <= end時)
      .map(dot => {
        let 音符碼名 = 音符名_轉_音符碼名(dot.音);
        let 技法碼 = (dot.開鈸 || dot.鼓框) ? "!" : "";
        let 音符位置 = dot.時 - start時;
        let 音符長度 = dot.長;
        return `${音符碼名}${技法碼}-${音符位置}-${音符長度}`;
      }).join(" ");
  }
  function 取得樂譜中的歌詞(start小節, length小節) {
    let 最多幾小節 = 樂譜.childElementCount;
    let start時 = Math.min(Math.max(Math.floor(+start小節 || 0), 0), 最多幾小節 - 1) * 顯示設定.一小節幾音符;
    if(!+length小節) length小節 = 最多幾小節;
    let end時 = start時 + Math.min(Math.max(Math.floor(+length小節), 1), 最多幾小節) * 顯示設定.一小節幾音符 - 1;
    return dot歌詞表
      .filter(dot => dot.時 >= start時 && dot.時 <= end時)
      .map(dot => {
        let 歌詞字 = dot.詞.replace(/\-|\s/g, "") || "～";
        let 歌詞位置 = dot.時 - start時;
        let 歌詞長度 = dot.長;
        return `${歌詞字}-${歌詞位置}-${歌詞長度}`;
      }).join(" ");
  }
  function 清空目前樂譜() {
    播放器.指針位置 = 0;
    樂譜.querySelectorAll(".小節:not(:first-child), i, input").forEach(el => el.remove());
    dot譜 = [];
    dot歌詞表 = [];
  }
  function 往樂譜加入歌詞碼(位置歌詞碼) {
    let 位於小節 = 位置歌詞碼[0] == "[" ? +位置歌詞碼.replace(/^\[|\].*$/g, "") : 0;
    let start時 = 位於小節 * 顯示設定.一小節幾音符;
    let 歌詞碼 = 位置歌詞碼.replace(/^.*\]/g, "");
    let 新dot列 = !歌詞碼 ? [] : 歌詞碼.split(" ").map(歌詞編碼 => {
      let dot = 歌詞編碼_轉_dot(歌詞編碼);
      dot.時 += start時;
      return dot;
    });
    let 最遠位置 = Math.max(...新dot列.map(({時, 長}) => 時 + 長));
    let 幾小節 = Math.ceil(最遠位置 / 顯示設定.一小節幾音符);
    while(樂譜.childElementCount < 幾小節) 新增小節();
    新dot列.forEach(dot => 往樂譜新增一個詞dot(dot));
  }
  function 往樂譜加入譜編碼(位置譜編碼) {
    let 位於小節 = 位置譜編碼[0] == "[" ? +位置譜編碼.replace(/^\[|\].*$/g, "") : 0;
    let start時 = 位於小節 * 顯示設定.一小節幾音符;
    let 譜編碼 = 位置譜編碼.replace(/^.*\]/g, "");
    let 新dot列 = !譜編碼 ? [] : 譜編碼.split(" ").map(音符編碼 => {
      let dot = 音符編碼_轉_dot(音符編碼);
      dot.時 += start時;
      return dot;
    });
    let 最遠位置 = Math.max(...新dot列.map(({時, 長}) => 時 + 長));
    let 幾小節 = Math.ceil(最遠位置 / 顯示設定.一小節幾音符);
    while(樂譜.childElementCount < 幾小節) 新增小節();
    新dot列.forEach(dot => 往樂譜新增一個dot(dot));
  }
  function 將譜資料顯示到樂譜畫面(譜資料) {
    /* 重置 */
    播放器.停止();
    樂譜操作.清空();

    /* 元素統一轉為譜編碼 */
    let 譜編碼元素 = {};
    for(let key in 譜資料.元素表) {
      if(/\&|\(/.test(譜資料.元素表[key])) {
        譜編碼元素[key] = OX譜_轉_譜編碼(譜資料.元素表[key]);
      }
    }

    /* 譜句表顯示 */
    譜資料.譜句表
    .map(譜句 => 譜句.split(" ")).flat() // 全部切成譜節
    .forEach(譜節 => {
      let 元素名 = 譜節.replace(/^.*\]/g, "");
      let 位於小節 = +譜節.replace(/^\[|\].*$/g, "");
      let 譜編碼 = 譜編碼元素[元素名] || "";
      樂譜操作.加入譜編碼(`[${位於小節}]${譜編碼}`);
    });

    /* 歌詞表顯示 */
    譜資料.歌詞表.forEach(歌詞句子 => 樂譜操作.加入歌詞碼(歌詞句子));

    /* 讓歷史可以上下一步操作 */
    歷史管理.記住();
  }
  function 將目前樂譜轉為譜資料() {
    let 譜資料 = {
      元素表: {},
      譜句表: [],
      歌詞表: [],
    };
    let 已存在的OX譜紀錄 = {};
    let 元素名arr = [...樂譜.children]
    .map((小節el, 小節i) => {
      let 小節譜編碼 = 樂譜操作.取得譜編碼(小節i, 1);
      let 小節OX譜 = 譜編碼_轉_OX譜(小節譜編碼);
      if(已存在的OX譜紀錄[小節OX譜]) return `[${小節i}]${已存在的OX譜紀錄[小節OX譜]}`;
      let 元素名 = "sent" + 小節i;
      譜資料.元素表[元素名] = 小節OX譜;
      已存在的OX譜紀錄[小節OX譜] = 元素名;
      return `[${小節i}]${元素名}`;
    });

    let 幾小節為一句 = 20;
    let 分成幾句 = Math.ceil(樂譜.childElementCount / 幾小節為一句);
    for(let 譜句i=0; 譜句i<分成幾句; 譜句i++) {
      let 本句起點小節i = 譜句i * 幾小節為一句;
      譜資料.譜句表[譜句i] = 元素名arr.slice(本句起點小節i, 本句起點小節i + 幾小節為一句).join(" ");
    }

    for(let 歌詞句i=0; 歌詞句i<分成幾句; 歌詞句i++) {
      let 本句起點小節i = 歌詞句i * 幾小節為一句;
      let 本句歌詞 = 樂譜操作.取得歌詞碼(本句起點小節i, 幾小節為一句);
      if(本句歌詞) 譜資料.歌詞表.push(`[${本句起點小節i}]${本句歌詞}`);
    }
    return 譜資料;
  }
  return {
    新增dot: 往樂譜新增一個dot,
    新增詞dot: 往樂譜新增一個詞dot,
    取得譜編碼: 取得樂譜中的譜編碼,
    取得歌詞碼: 取得樂譜中的歌詞,
    取得譜資料: 將目前樂譜轉為譜資料,
    顯示譜資料: 將譜資料顯示到樂譜畫面,
    清空: 清空目前樂譜,
    加入譜編碼: 往樂譜加入譜編碼,
    加入歌詞碼: 往樂譜加入歌詞碼,
  };
})();

/* ================================ */
/*  顯示處理                        */
/* ================================ */
window.addEventListener("load", 顯示處理);
window.addEventListener("resize", 顯示處理);
const 顯示設定 = {
  一小節幾拍: 4,
  一拍幾音符: 4,
  一音符最長幾格: 4,
  線條寬度: 1,
  有幾種音: 10,
};
function 顯示處理() {
  let 小節w = 樂譜.offsetWidth;
  let 小節h = 樂譜.offsetWidth * 0.4;
  let 有幾格 = 顯示設定.一小節幾拍 * 顯示設定.一拍幾音符;
  let 一格w = (小節w + 顯示設定.線條寬度) / 有幾格 - 顯示設定.線條寬度;
  let 一格h = (小節h + 顯示設定.線條寬度) / 顯示設定.有幾種音 - 顯示設定.線條寬度;
  樂譜.style.setProperty("--line_width", 顯示設定.線條寬度 + "px");
  樂譜.style.setProperty("--sound_count", 顯示設定.有幾種音);
  樂譜.style.setProperty("--note_count", 有幾格);
  樂譜.style.setProperty("--sq_w", 一格w + "px");
  樂譜.style.setProperty("--sq_h", 一格h + "px");

  let sd_start = (一格h + 顯示設定.線條寬度) * (音符名_轉_grid_r("小鼓") - 1);
  let bar_w = (一格w + 顯示設定.線條寬度) * 顯示設定.一拍幾音符 - 顯示設定.線條寬度;
  樂譜.style.setProperty("--sd_bg", `linear-gradient(#8ec98e30) no-repeat left ${sd_start}px / 100% ${一格h}px`);
  樂譜.style.setProperty("--bar_bg", `linear-gradient(90deg, #0000 ${bar_w}px, #c3c3c3 ${bar_w}px) left / ${bar_w + 顯示設定.線條寬度}px auto`);
  樂譜.style.setProperty("--sound_bg", `linear-gradient(#0000 ${一格h}px, #dfdfdf ${一格h}px) top / auto ${一格h + 顯示設定.線條寬度}px`);
  樂譜.style.setProperty("--note_bg", `linear-gradient(90deg, #0000 ${一格w}px, #dfdfdf ${一格w}px) left / ${一格w + 顯示設定.線條寬度}px auto`);

  顯示設定.一小節幾音符 = 有幾格;
  顯示設定.一格w = 一格w;
  顯示設定.一格h = 一格h;
}

/* ================================ */
/*  post                            */
/* ================================ */
function post(action, data) {
  if(!window.XMLHttpRequest) {
    alert('無法連線，請更換瀏覽器');
    return;
  }
  data.action = action || "";
  let url = "https://script.google.com/macros/s/AKfycbx0G3vdSY_HaUlTqS1b3sjlrYjhyjKKwkJx9Nv9UiH2-c1AEJpOsJbI99TfSIozhUZveg/exec";
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.responseType = "json";
    xhr.addEventListener("load", () => {
      if(xhr.status == 200) {
        resolve(xhr.response);
      }
      else {
        reject(xhr.status);
      }
    });
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    let content = JSON.stringify(data);
    xhr.send("content=" + encodeURI(content.replace(/\&/g, "＆")));
  });
}
