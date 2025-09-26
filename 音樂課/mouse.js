/* 分辨是哪種點擊 */
window.addEventListener("load", () => {
  let 已經touch = false;
  樂譜.addEventListener("mousedown", ({target, pageX, pageY}) => {
    if(已經touch) return;
    點擊開始(target, pageX, pageY);
  });
  樂譜.addEventListener("touchstart", ({target, touches}) => {
    if(touches.length > 1) return;
    let {pageX, pageY} = touches[0];
    點擊開始(target, pageX, pageY);
    已經touch = true;
    setTimeout(() => 已經touch = false, 100);
  });
  document.addEventListener("mousemove", ({pageX, pageY}) => 滑鼠移動中(pageX, pageY));
  document.addEventListener("touchmove", ({changedTouches}) => {
    let {pageX, pageY} = changedTouches[0];
    滑鼠移動中(pageX, pageY);
  });
  document.addEventListener("mouseup", ({pageX, pageY}) => 點擊結束(pageX, pageY));
  document.addEventListener("touchend", ({changedTouches}) => {
    let {pageX, pageY} = changedTouches[0];
    點擊結束(pageX, pageY);
  });

  // 對音符頭按下、移動脫離音符頭 = 移動音符
  // 對音符頭按下、在音符頭放開 = 切換音色
  // 對音符身按下、移動脫離起始格 = 調整音符長度
  // 對音符身按下、在原位置放開 = 切換音色
  // 對音符任意處按下、脫離音符垂直夠遠時放開 = 刪除音符
  // 在空小節處按下會新增音符，放開之前都可以調整音符長度，放開就確定新增

  let 已經按下 = false, 起點是哪 = null, 滑動狀態 = null, 起點i = null;
  let 按下時音符中心x = 0, 按下時音符中心y = 0;
  let 單位w = 10, 單位h = 10;
  function 點擊開始(target, pageX, pageY) {
    if(已經按下) return;
    let 小節el = target.closest(".小節");
    if(!小節el) return;
    let 小節左上x = 小節el.offsetLeft - 樂譜.scrollLeft;
    let 小節左上y = 小節el.offsetTop - 樂譜.scrollTop;
    let offsetX = pageX - 小節左上x, offsetY = pageY - 小節左上y;
    單位w = 顯示設定.一格w + 顯示設定.線條寬度;
    單位h = 顯示設定.一格h + 顯示設定.線條寬度;
    let 音符中心x = pageX - offsetX % 單位w + 單位w / 2;
    let 音符中心y = pageY - offsetY % 單位h + 單位h / 2;
    if(target.matches("input")) {
      起點i = target;
      按下時音符中心y = 音符中心y;
      起點是哪 = "歌詞身";
      已經按下 = true;
    }
    else if(target.matches("i")) {
      起點i = target;
      按下時音符中心x = 音符中心x;
      按下時音符中心y = 音符中心y;
      let 起點i的最左 = (起點i.dot.時 % 顯示設定.一小節幾音符) * 單位w;
      if(offsetX - 起點i的最左 <= 顯示設定.一格w * 0.7) 起點是哪 = "音符頭";
      else 起點是哪 = "音符身";
      已經按下 = true;
    }
    else if(target.matches(".小節")) {
      let grid_c = Math.floor(offsetX / 單位w) + 1;
      let grid_r = Math.floor(offsetY / 單位h) + 1;
      if(grid_r == 10) {
        let 歌詞input = 按下小節時新增歌詞(target, grid_c);
        if(!歌詞input) return;
        起點是哪 = "歌詞";
        起點i = 歌詞input;
      }
      else {
        let 音符i = 按下小節時新增音符(target, grid_r, grid_c);
        if(!音符i) return;
        起點是哪 = "小節";
        起點i = 音符i;
      }
      if(起點i) {
        按下時音符中心x = 音符中心x;
        按下時音符中心y = 音符中心y;
        已經按下 = true;
      }
    }
  }
  function 滑鼠移動中(pageX, pageY) {
    if(!已經按下 || !起點i) return;
    if(滑動狀態 == null) {
      let 已移動x = pageX - 按下時音符中心x;
      if(Math.abs(已移動x) > 單位w / 2) {
        if(起點是哪 == "音符頭") 滑動狀態 = "移動音符";
        else if(起點是哪 == "音符身" || 起點是哪 == "小節" || 起點是哪 == "歌詞") 滑動狀態 = "調整音符長度";
      }
      return;
    }
    let 小節el = 起點i.closest(".小節");
    let offsetX = pageX - (小節el.offsetLeft - 樂譜.scrollLeft);
    let target_grid_c = Math.ceil(offsetX / 單位w);
    if(滑動狀態 == "移動音符") {
      滑動移動音符(起點i, target_grid_c);
    }
    else if(滑動狀態 == "調整音符長度") {
      let dot_grid_c = 起點i.dot.時 % 顯示設定.一小節幾音符 + 1;
      滑動調整音符長度(起點i, target_grid_c - dot_grid_c + 1);
    }
  }
  function 點擊結束(pageX, pageY) {
    if(!已經按下) return;
    if(起點是哪 == "歌詞身") {
      let 已移動y = 按下時音符中心y - pageY;
      if(Math.abs(已移動y) > 單位h * 3) 滑動刪除歌詞(起點i);
    }
    if(起點是哪 == "音符頭" || 起點是哪 == "音符身") {
      let 已移動y = 按下時音符中心y - pageY;
      if(Math.abs(已移動y) > 單位h * 3) 滑動刪除音符(起點i);
      else if(滑動狀態 == null) 點擊切換音色(起點i);
    }
    if(起點是哪) 歷史管理.記住();
    已經按下 = false;
    起點是哪 = null;
    起點i = null;
    滑動狀態 = null;
    按下時音符中心x = 0;
    按下時音符中心y = 0;
  }
});
