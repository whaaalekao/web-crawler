# Shopee 網頁爬取工具

## 專案介紹

該程式利用 **`async/await`** 來處理頁面滾動、資料擷取和自動翻頁的過程，以確保所有操作按順序非同步執行。通過此程式，我們可以自動滾動 Shopee 搜尋結果頁面，擷取頁面上顯示的商品資訊，並且能夠自動翻頁直到最後一頁。最終，所有擷取到的商品資料會被整理並輸出。

## 程式功能介紹

### 1. 頁面滾動
- **功能概述**：程式能夠自動滾動頁面，以便觸發 Shopee 的懶加載機制（Lazy Loading）。Shopee 的商品列表是隨著頁面向下滾動而動態加載的，因此自動滾動是確保所有商品被完全加載的關鍵。
- **實現方式**：
  - 使用 `setInterval()` 讓頁面每隔 100 毫秒自動向下滾動 100 像素，直到滾動到頁面底部為止。
  - 當頁面滾動到底部時，程式會停止滾動並進入下一步操作（擷取資料或翻頁）。
  - 具體程式碼在 `autoScroll()` 函數中實現，該函數利用 Promise 來確保滾動過程是非同步執行，並且完成滾動後才繼續執行後續操作。
```javascript
async function autoScroll() {
    await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            // 停止條件：滾動到頁面底部
            if (totalHeight >= scrollHeight - window.innerHeight) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
    });
}
```

### 2. 爬取資料
- **功能概述**：在每次滾動到頁面底部之後，程式會從當前頁面中擷取所有顯示的商品資訊，包括商品名稱、價格、圖片連結和商品的詳細頁面連結。這些資料會被累積儲存起來，直到最後一頁為止。
- **實現方式**：
  - 程式使用 `document.querySelectorAll()` 來選取頁面上的所有商品元素，然後從每個元素中提取出所需的資料。
  - 程式會對每個商品的標題、價格、圖片和連結進行處理，並將這些資料以物件形式儲存到全局的 `window.allProducts` 陣列中。
  - 具體程式碼在 `scrapeProducts()` 函數中實現，該函數負責擷取當前頁面的商品資料，並在失敗時返回 `false` 來中止程式。
```javascript
function scrapeProducts() {
        try {
            // 使用更新後的選取器
            const productElements = document.querySelectorAll('.shopee-search-item-result__item');

            const productsOnPage = [];

            productElements.forEach((product) => {
                // 僅以商品標題為例
                const productTitleElement = product.querySelector('.whitespace-normal');
                const productTitle = productTitleElement ? productTitleElement.innerText.trim() : '名稱未找到';

                productsOnPage.push({
                    title: productTitle
                });
            });

        } catch (error) {
            console.error('擷取商品資料時發生錯誤:', error);
            return false;  // 返回 false 表示擷取失敗
        }
    }
```
### 3. 翻頁、頁數計算與流程控制

- **功能概述**：程式會在每次擷取完一頁的商品資料後，檢查當前頁面是否有「下一頁」按鈕。如果存在，程式會模擬點擊按鈕進行翻頁，並等待新頁面完全加載後繼續擷取資料。這一過程會持續進行，直到達到最後一頁或擷取失敗。`while` 迴圈控制整個流程，重複滾動頁面、擷取資料、翻頁的操作，直到遇到停止條件（例如沒有下一頁按鈕或擷取失敗），並且會自動計算處理的頁數。

- **實現方式**：
   - 檢查下一頁按鈕：使用 `hasNextPage()` 函數檢查是否存在「下一頁」按鈕，並確認按鈕是否未被禁用。如果按鈕存在且可用，程式會進行翻頁。
   - 模擬點擊翻頁按鈕：通過 `goToNextPage()` 函數模擬點擊「下一頁」按鈕，程式會翻到下一頁。
   - 流程控制：`while (true)` 迴圈控制爬取流程，程式會不斷重複頁面滾動、擷取資料、翻頁操作，直到無法擷取商品或達到最後一頁為止。
   - 等待頁面加載：翻頁後程式會等待 3 秒，確保新頁面完全加載，然後繼續擷取資料。
   - 頁數計算：每翻一頁，`pageCount` 計數器會遞增，並記錄已爬取的頁數，最終輸出處理的總頁數。
  
- **具體流程**：
  - **頁面滾動**：每次進入 `while` 迴圈後，程式會調用 `await autoScroll()` 將頁面自動滾動到底部，確保頁面中的所有商品內容都加載完成。
  - **資料擷取**：滾動完成後，使用 `scrapeProducts()` 函數擷取當前頁面商品資料。如果沒有擷取到商品，程式會跳出迴圈，停止爬取。
  - **翻頁與等待**：如果存在可用的「下一頁」按鈕，程式會模擬點擊按鈕翻頁，並等待 3 秒，以確保新頁面完全加載。
  - **迴圈結束條件**：如果沒有下一頁按鈕，或者擷取失敗，程式會跳出迴圈並結束爬取流程。
```javascript
//檢查下一頁按鈕
function hasNextPage() {
        const nextPageButton = document.querySelector('.shopee-icon-button.shopee-icon-button--right');
        if (nextPageButton && !nextPageButton.classList.contains('shopee-icon-button--disabled')) {
            return true;  // 有下一頁並且按鈕可用
        }
        return false;  // 沒有下一頁或者按鈕被禁用
    }

    // 點擊下一頁按鈕
function goToNextPage() {
        const nextPageButton = document.querySelector('.shopee-icon-button.shopee-icon-button--right');
        if (nextPageButton && !nextPageButton.classList.contains('shopee-icon-button--disabled')) {
            nextPageButton.click();  // 模擬點擊下一頁按鈕
            return true;
        }
        return false;
    }

async function main() {
        console.log(`正在擷取資料...`);

        // 持續滾動並擷取資料，直到無法找到下一頁為止
        let pageCount = 0;
        while (true) {
            console.log(`正在擷取第 ${pageCount + 1} 頁資料...`);

            // 自動滾動頁面到底部
            await autoScroll();

            // 擷取當前頁面商品資料，當沒有擷取到商品時，停止程序
            const hasProducts = scrapeProducts();
            if (!hasProducts) {
                console.log("擷取失敗或無商品，停止爬取並輸出資料。");
                break;
            }

            // 檢查是否還有下一頁，如果沒有則跳出循環
            if (hasNextPage()) {
                console.log("翻到下一頁...");
                goToNextPage();
                // 等待新頁面載入
                await new Promise(resolve => setTimeout(resolve, 3000));  // 等待3秒讓新頁面完全載入
                pageCount++;
            } else {
                console.log("已無下一頁，停止擷取。");
                break;
            }
        }

        // 完成擷取，輸出資料
        console.log(`擷取完成，共 ${window.allProducts.length} 筆資料。`);
        console.log(JSON.stringify(window.allProducts, null, 2));
    }

    // 開始主流程
    main();
```
## 可優化內容

1. **CAPTCHA 驗證問題**：偶爾會遇到 CAPTCHA 驗證，這會中斷整個爬取流程。但在手動完成驗證後即可正常執行。

2. **整體抓取時間過長**：由於每次翻頁皆會停留3秒且每次捲動僅100px，導致整體爬取速度過慢，也許可以對於速度方面進行優化。
## 學習心得

在這個專案中，我學到了如何有效利用 JavaScript 的異步操作處理瀏覽器中的非同步流程，例如頁面滾動、資料擷取和翻頁的過程。使用 `async/await` 來控制流程的順序，使得程式可以在正確的時間點完成每一步，這大大提升了程式的穩定性。

此外，我也深刻體會到在進行網頁爬取時，需要理解網頁的 DOM 結構以及 JavaScript 如何與瀏覽器的非同步事件（如頁面載入和滾動）交互。這次專案讓我更加熟悉如何動態處理網頁上的資料、模擬用戶行為（如滾動和點擊）來自動化資料收集。這對於未來進行更大規模的數據爬取和分析提供了重要的經驗。


