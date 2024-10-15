(async () => {
    // 儲存所有商品資料的陣列
    window.allProducts = [];

    // 自動滾動頁面以觸發懶加載
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

    // 擷取當前頁面的商品資料
    function scrapeProducts() {
        try {
            // 使用更新後的選取器
            const productElements = document.querySelectorAll('.shopee-search-item-result__item');

            // 檢查選取是否成功
            console.log(`找到 ${productElements.length} 個商品元素`);  // 調試用，檢查是否選到元素

            const productsOnPage = [];

            productElements.forEach((product) => {
                // 1. 擷取商品名稱
                const productTitleElement = product.querySelector('.whitespace-normal');
                const productTitle = productTitleElement ? productTitleElement.innerText.trim() : '名稱未找到';

                // 2. 擷取商品價格
                const productPriceElement = product.querySelector('span[class*="text-base/5"]');
                const productPrice = productPriceElement ? productPriceElement.innerText.trim() : '價格未找到';

                // 3. 擷取商品圖片連結
                const productImageElement = product.querySelector('img');
                const productImageURL = productImageElement ? (productImageElement.getAttribute('src')) : '圖片連結未找到';

                // 4. 擷取商品頁面連結
                const productLinkElement = product.querySelector('a.contents');
                const productLink = productLinkElement ? `https://shopee.tw${productLinkElement.getAttribute('href')}` : '商品連結未找到';

                productsOnPage.push({
                    title: productTitle,
                    img: productImageURL,
                    price: productPrice,
                    link: productLink,
                });
            });

            // 檢查擷取到的商品數量
            if (productsOnPage.length === 0) {
                console.log("未擷取到任何商品，停止執行。");
                return false;  // 返回 false 表示沒有商品
            }

            // 確認抓到多少商品
            console.log(`成功擷取到 ${productsOnPage.length} 個商品資料`);
            window.allProducts.push(...productsOnPage);
            return true;  // 返回 true 表示擷取成功

        } catch (error) {
            console.error('擷取商品資料時發生錯誤:', error);
            return false;  // 返回 false 表示擷取失敗
        }
    }

    // 檢查是否有下一頁的按鈕並且按鈕未被禁用
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

    // 主流程
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
})();
