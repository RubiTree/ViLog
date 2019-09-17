import './utils.js';

var app = new Vue({
    data: {
        newReplacerName: "",
        newReplacerFrom: "",
        newReplacerTo: "",

        importRegexGroup: "",

        replaceSrc: "",
        replaceResult: "",
    },
    watch: {
        replaceSrc: function () {
            this._updateReplace()
        }
    },
    methods: {
        exportReplaceResult: function () {
            exportContentToClipboard(this.replaceResult)
        },

        _updateReplace: function () {
            let resultMap = new Map()
            this.replaceSrc.split('\n').map((srcLine) => {
                let key = srcLine.trim()
                if(resultMap.has(key)){
                    resultMap.set(key, resultMap.get(key)+1)
                }else{
                    resultMap.set(key, 1)
                }
            })

            let fomartResult = [...resultMap.keys()]
                .sort((a,b) => a.localeCompare(b))
                .map((key) => `${resultMap.get(key)} | ${key}`)

            this.replaceResult = fomartResult.join("\n")
        },
    },
});
app.$mount('#app');


(function forbidBack() {
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
})();

function exportContentToClipboard(content) {
    let transfer = document.createElement('textarea');
    // 不这么设置屏幕会跳，具体哪儿有问题还没确定
    transfer.style.cssText = "width:30%;padding:2%;min-width: 100px;opacity: 0.5;color: rgb(255, 255, 255);line-height: 18px;text-align: center;border-radius: 5px;position: fixed;top: 50%;left: 30%;z-index: 999999;background: rgb(0, 0, 0);font-size: 15px;";
    document.body.appendChild(transfer);
    transfer.value = content;  // 这里表示想要复制的内容
    transfer.focus();
    transfer.select();
    if (document.execCommand('copy')) {
        document.execCommand('copy');
    }
    transfer.blur();
    document.body.removeChild(transfer);
    toast('已经复制到剪贴板啦');
}

// 浮层
function toast(msg, duration) {
    duration = isNaN(duration) ? 2000 : duration;
    var m = document.createElement('div');
    m.innerHTML = "<span style='padding:20%'>" + msg + "</span>";
    m.style.cssText = "width:30%;padding:2%;min-width: 100px;opacity: 0.5;color: rgb(255, 255, 255);line-height: 18px;text-align: center;border-radius: 5px;position: fixed;top: 50%;left: 30%;z-index: 999999;background: rgb(0, 0, 0);font-size: 15px;";
    document.body.appendChild(m);
    setTimeout(function () {
        var d = 0.5;
        m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
        m.style.opacity = '0';
        setTimeout(function () { document.body.removeChild(m) }, d * 1000);
    }, duration);
}

function isStringEmpty(obj) {
    if (typeof obj == "undefined" || obj == null || obj == "") {
        return true;
    } else {
        return false;
    }
}

new Valine({
    el: '#vcomments',
    appId: 'fnTU2upQ0TyY3nweOUj5G2Ht-gzGzoHsz',
    appKey: 'UcOPNcgGvlpqvrGosTlH4jSY',
    visitor: true
})