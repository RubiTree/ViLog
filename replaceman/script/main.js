import { Regex, RegexGroup } from './model.js';
import './utils.js';

// localStorage persistence
var STORAGE_KEY = 'ReplaceMan'
var todoStorage = {
    fetch: function () {
        let result = new RegexGroup("默认")
        let storageJson = localStorage.getItem(STORAGE_KEY)
        if (storageJson == null) return result

        result.replace(JSON.parse(storageJson))
        this._addInner(result)
        return result
    },
    save: function (regexGroup) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(regexGroup.getNoInner()))
    },
    _addInner(regexGroup) {
        regexGroup.addRegex(this._getTimeStampReplacer())
    },
    _getTimeStampReplacer() {
        let result = new Regex("ms时间戳转换", "", "")
        result.isInner = true
        result.replace = function (src) {
            let reg = /\d{13}/g
            let result = []
            let order = 0
            while (true) {
                let temp = reg.exec(src)
                if (temp) {
                    result.push({
                        text: timetrans(parseInt(temp[0])), index: temp.index - order * 12
                    })
                    order++
                } else {
                    break
                }
            }

            let srcArray = src.split('')
            result.forEach((matchResult) => {
                srcArray.splice(matchResult.index, 13, matchResult.text)
            })
            return srcArray.join('');
        }
        return result
    },
}

function timetrans(timeMs) {
    let date = new Date(timeMs);//如果date为13位不需要乘1000
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
    let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    let s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + ':';

    let msString = ""
    let ms = date.getMilliseconds()
    if (ms < 10) {
        msString = '00' + ms
    } else if (ms < 100) {
        msString = '0' + ms
    } else {
        msString = ms
    }

    return "[" + Y + M + D + h + m + s + msString + "]";
}

var app = new Vue({
    data: {
        regexGroup: todoStorage.fetch(),

        newReplacerName: "",
        newReplacerFrom: "",
        newReplacerTo: "",

        importRegexGroup: "",

        replaceSrc: "",
        replaceResult: "",
    },
    watch: {
        replaceSrc: function (newFilterLog, oldFilterLog) {
            this._updateReplace()
        }
    },
    methods: {
        addReplacer: function () {
            if (isStringEmpty(this.newReplacerName)) {
                toast("请输入 name")
                return
            }
            if (isStringEmpty(this.newReplacerFrom)) {
                toast("请输入 replace from")
                return
            }

            this.regexGroup.addRegex(new Regex(this.newReplacerName, this.newReplacerFrom, this.newReplacerTo))
            this.newReplacerName = ""
            this.newReplacerFrom = ""
            this.newReplacerTo = ""

            this._onChangeRegex()
        },

        importRegex: function () {
            if (confirm(`导入会清空已有规则，确保已经导出备份了已有规则，确定要导入吗？`)) {
                let newRegexGroup = JSON.parse(this.importRegexGroup)
                this.importRegexGroup = ""
                if (newRegexGroup == null) {
                    toast("请把正确的regex贴到输入框")
                    return
                }

                this.regexGroup.replace(newRegexGroup)
                todoStorage._addInner(this.regexGroup)
                this._onChangeRegex()
            }
        },

        exportRegex: function () {
            exportContentToClipboard(JSON.stringify(this.regexGroup.getNoInner()))
        },

        exportReplaceResult: function () {
            exportContentToClipboard(this.replaceResult)
        },

        removeRegex: function (regex) {
            if (regex.isInner) return
            if (confirm(`确定要删除这条规则「${regex.name}」吗？`)) {
                this.regexGroup.removeRegex(regex)
                this._onChangeRegex()
            }
        },

        switchDismissRegex: function (regex) {
            regex.dismiss = !regex.dismiss
            this._onChangeRegex()
        },

        _onChangeRegex: function () {
            this._updateReplace()

            // save 放下一个事件循环流里
            setTimeout(() => todoStorage.save(this.regexGroup), 0);
        },

        _updateReplace: function () {
            let srcLines = this.replaceSrc.split('\n')
            let resultLines = srcLines.map((srcLine) => {
                let resultLine = srcLine
                this.regexGroup.regexList.forEach((regex) => {
                    if (!regex.dismiss) {
                        if (regex.isInner) {
                            resultLine = regex.replace(resultLine)
                        } else {
                            resultLine = resultLine.replace(new RegExp(regex.from, 'g'), regex.to)
                        }
                    }
                })
                return resultLine
            }).filter((value) => !isStringEmpty(value))

            // 让替换的\n生效
            for (let i = 0; i < resultLines.length; i++) {
                resultLines[i] = resultLines[i].split("\\n")
            }

            resultLines = resultLines.flat(Infinity)
            this.replaceResult = resultLines.join("\n")
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
    document.body.appendChild(transfer);
    transfer.value = content;  // 这里表示想要复制的内容
    transfer.focus();
    transfer.select();
    if (document.execCommand('copy')) {
        document.execCommand('copy');
    }
    transfer.blur();
    toast('已经复制到剪贴板啦');
    document.body.removeChild(transfer);
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