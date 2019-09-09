import { Regex, RegexGroup, SortedRegex, SortedLine, ContentLine } from './model.js';
import './utils.js';

// localStorage persistence
var STORAGE_KEY = 'ViLog'
var todoStorage = {
    fetch: function () {
        let result = new RegexGroup("默认")
        let storageJson = localStorage.getItem(STORAGE_KEY)
        if (storageJson == null) return result

        // 大坑，json parse出来的对象没有方法，只能取里面的数据，对象要新建
        result.merge(JSON.parse(storageJson))
        return result
    },
    save: function (regexGroup) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(regexGroup))
    }
}

var app = new Vue({
    data: {
        regexGroup: todoStorage.fetch(),
        sortedRegexList: [],
        sortedResultList: [],
        allContentList: [],

        newRegex: "",
        importRegexGroup: "",

        globalFocusItem: null,
        currentFocusRegex: null,
        currentFocusFilterLog: null,
        currentFocusLog: null,
    },
    mounted: function () {
        this.sortedRegexList = this.regexGroup.initSortedRegexList()
    },
    watch: {
        currentFocusFilterLog: function (newFilterLog, oldFilterLog) {
            if (this.currentFocusRegex != null && newFilterLog != null) {
                this.currentFocusRegex.currentFocusIndex = this.currentFocusRegex.resultLines.findFirstLittleIndexInOrderList(newFilterLog.indexOfContainer)
            }
        }
    },
    methods: {
        onSelectRegex: function (sortedRegex) {
            if (sortedRegex.resultLines.length == 0) return

            this._clearLastRegex()

            this._focusItem(sortedRegex)
            this.globalFocusItem = sortedRegex

            sortedRegex.resultLines.forEach((index) => {
                this.sortedResultList[index].select = true
                this.allContentList[this.sortedResultList[index].lineIndex].select = true
            })

            let from = _getFilterLogContainerCenterItemIndex()
            let to = sortedRegex.resultLines.findNearestValueInOrderList(from) // 需要放视觉中心的
            this._switchFocusFilteredLog(to)
        },

        _switchFocusFilteredLog(index) {
            this._focusItem(this.sortedResultList[index])
            this._focusItem(this.allContentList[this.sortedResultList[index].lineIndex])

            _scrollIndexToCenterInFilterLogContainer(index)
            _scrollIndexToCenterInLogContainer(this.sortedResultList[index].lineIndex)
        },

        _clearLastRegex: function () {
            // 清理 select
            if (this.currentFocusRegex != null) {
                this.currentFocusRegex.resultLines.forEach((index) => {
                    this.sortedResultList[index].select = false
                    this.allContentList[this.sortedResultList[index].lineIndex].select = false
                })
            }

            // 清理 focus
            if (this.currentFocusRegex != null) {
                this.currentFocusRegex.focus = false
                this.currentFocusRegex.currentFocusIndex = -1
                this.currentFocusRegex = null
            }
            if (this.currentFocusFilterLog != null) {
                this.currentFocusFilterLog.focus = false
                this.currentFocusFilterLog = null
            }
            if (this.currentFocusLog != null) {
                this.currentFocusLog.focus = false
                this.currentFocusLog = null
            }
        },

        onSelectFilterLine: function (sortedLine) {
            // 只需要清理两个focus
            if (this.currentFocusFilterLog != null) this.currentFocusFilterLog.focus = false
            if (this.currentFocusLog != null) this.currentFocusLog.focus = false

            this._focusItem(sortedLine)
            this.globalFocusItem = sortedLine

            this._focusItem(this.allContentList[sortedLine.lineIndex])
            _scrollIndexToCenterInLogContainer(sortedLine.lineIndex)
        },

        onSelectLog: function (contentLine) {
            // 只需要清理1个focus
            if (this.currentFocusLog != null) this.currentFocusLog.focus = false

            this._focusItem(contentLine)
            this.globalFocusItem = contentLine
        },

        _focusItem: function (anyItem) {
            anyItem.focus = true
            if (anyItem instanceof SortedRegex) {
                this.currentFocusRegex = anyItem
            } else if (anyItem instanceof SortedLine) {
                this.currentFocusFilterLog = anyItem
            } else if (anyItem instanceof ContentLine) {
                this.currentFocusLog = anyItem
            } else {
                console.log("error focus item")
            }
        },

        // 作用不大
        onMouseEnterRegex: function (sortedRegex) {
            if (sortedRegex.resultLines.length == 0) return
            sortedRegex.hover = true
            sortedRegex.resultLines.forEach((index) => this.sortedResultList[index].hover = true)
        },
        // 作用不大
        onMouseLeaveRegex: function (sortedRegex) {
            if (sortedRegex.resultLines.length == 0) return

            sortedRegex.hover = false
            sortedRegex.resultLines.forEach((index) => this.sortedResultList[index].hover = false)
        },

        addRegex: function () {
            this.newRegex = this.newRegex.trim()
            if (isStringEmpty(this.newRegex)) return

            this.regexGroup.addRegex(new Regex(this.newRegex))
            this.newRegex = ""

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
                this._onChangeRegex()
            }
        },

        exportRegex: function () {
            exportContentToClipboard(JSON.stringify(this.regexGroup))
        },

        simpleCopyRegex: function () {
            exportContentToClipboard(this.regexGroup.regexList.map((regex) => regex.regexText).join("|"))
        },

        exportFilterResult: function () {
            exportContentToClipboard(this.sortedResultList.map((sortedLine) => sortedLine.content).join("<br/>\n"))
        },

        removeRegex: function (sortedRegex) {
            if (confirm(`确定要删除这条规则「${sortedRegex.regex.regexText}」吗？`)) {
                if (this.currentFocusRegex === sortedRegex) {
                    this._clearLastRegex()
                }
                this.regexGroup.removeRegex(sortedRegex.regex)
                this._onChangeRegex()
            }
        },

        switchDismissRegex: function (sortedRegex) {
            if (this.currentFocusRegex === sortedRegex && !sortedRegex.dismiss) {
                this._clearLastRegex()
            }
            sortedRegex.regex.dismiss = !sortedRegex.regex.dismiss
            this._onChangeRegex()
        },

        _onChangeRegex: function () {

            this._reRenderContentAfterNewRegex()
            // save 放下一个事件循环流里

            setTimeout(() => todoStorage.save(this.regexGroup), 0);
        },

        // todo 这里可以优化成只搜索新增regex
        _reRenderContentAfterNewRegex: function () {
            app.sortedRegexList = app.regexGroup.initSortedRegexList()
            app.sortedResultList = []

            let sortedRegexList = app.sortedRegexList;
            let sortedResultList = app.sortedResultList;

            app.allContentList.forEach((logLine, index) => {
                let isThisLineAdded = false;

                for (let i = 0; i < sortedRegexList.length; i++) {
                    if (sortedRegexList[i].regex.dismiss) continue

                    if (logLine.content.search(sortedRegexList[i].regex.regexText) > -1) {
                        if (!isThisLineAdded) {
                            // 给搜索结果列表加上这行，不能重复加
                            sortedResultList.push(new SortedLine(logLine.content, sortedResultList.length, index))
                            isThisLineAdded = true
                        }

                        // 给regex的结果序号里加上它在搜索结果里的序号，可以重复加
                        sortedRegexList[i].addLine(sortedResultList.length - 1);
                    }
                }
            })
        },

        onRegexConatinerKeyEnterAndDown() {

        },

        onFilteredLogContainerKeyEnter(isShift) {
            if (this.currentFocusRegex != null) {
                if (this.currentFocusFilterLog != null) this.currentFocusFilterLog.focus = false
                if (this.currentFocusLog != null) this.currentFocusLog.focus = false

                let next = 0
                if (isShift) {
                    next = this.currentFocusRegex.resultLines.findLastValueInOrderList(this.currentFocusFilterLog.indexOfContainer)
                } else {
                    next = this.currentFocusRegex.resultLines.findNextValueInOrderList(this.currentFocusFilterLog.indexOfContainer)
                }
                this._switchFocusFilteredLog(next)
            }
        },
        // onFilteredLogContainerKeyDown() {
        //     toast("onFilteredLogContainerKeyDown")
        // },

        onAllLogContainerKeyEnter(isShift) {
            if (this.currentFocusFilterLog != null) {
                if (this.currentFocusLog != null) this.currentFocusLog.focus = false

                let next = 0
                if (isShift) {
                    let next = this.currentFocusFilterLog.indexOfContainer - 1
                    if (next < 0) return
                } else {
                    let next = this.currentFocusFilterLog.indexOfContainer + 1
                    if (next >= this.sortedResultList.length) return
                }

                this.onSelectFilterLine(this.sortedResultList[next])
            }
        },
        // onAllLogContainerKeyDown() {

        // },
    },

    created: function () {
        // 不能单独监听，需要有焦点，否则就全局监听，手动分发
        // 可以有个通用的注册方法，key+callback
        var _this = this;
        document.onkeydown = function (e) {
            if (_this.globalFocusItem == null) return

            let key = window.event.code;
            console.log(key)
            if (key == "Enter") {
                if (_this.globalFocusItem instanceof SortedRegex) {
                    _this.onRegexConatinerKeyEnterAndDown()
                } else if (_this.globalFocusItem instanceof SortedLine) {
                    _this.onFilteredLogContainerKeyEnter(window.event.shiftKey)
                } else if (_this.globalFocusItem instanceof ContentLine) {
                    _this.onAllLogContainerKeyEnter(window.event.shiftKey)
                }
            }
            // else if (key == 40) {
            //     if (_this.globalFocusItem instanceof SortedRegex) {
            //         _this.onRegexConatinerKeyEnterAndDown()
            //     } else if (_this.globalFocusItem instanceof SortedLine) {
            //         _this.onFilteredLogContainerKeyDown()
            //     } else if (_this.globalFocusItem instanceof ContentLine) {
            //         _this.onAllLogContainerKeyDown()
            //     }
            // }
        };
    },
});
app.$mount('#app');

// 是不是可以放到vue组件的生命周期里
// (function createTestData() {
//     let regexGroup = app.regexGroup
//     regexGroup.addRegex(new Regex("当前页面：VideoPublishActivity"))
//     regexGroup.addRegex(new Regex("ConcurrentUploadByFile"))
//     regexGroup.addRegex(new Regex("TTUploader"))
//     regexGroup.addRegex(new Regex("ShortVideoPublishService"))

//     app.sortedRegexList = regexGroup.initSortedRegexList()
// })();

(function forbidBack() {
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
})();

(function handleFileDrag() {
    let drag = document.getElementById('app');
    drag.addEventListener('drop', dropHandler, false);
    drag.addEventListener('dragover', dragOverHandler, false);

    function dragOverHandler(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dragEffect = 'copy';
    }

    function dropHandler(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer.files;
        var file = files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            renderNewContent(this.result);
        }

        //读取文件内容
        reader.readAsText(file);
    }
})();

function renderNewContent(logText) {
    clearContent()

    let logLines = logText.split('\n');
    let sortedRegexList = app.sortedRegexList;
    let sortedResultList = app.sortedResultList;
    let allContentList = app.allContentList;

    logLines.forEach((logLine, index) => {
        let isThisLineAdded = false;

        for (let i = 0; i < sortedRegexList.length; i++) {
            if (sortedRegexList[i].regex.dismiss) continue

            if (logLine.search(sortedRegexList[i].regex.regexText) > -1) {
                if (!isThisLineAdded) {
                    // 给搜索结果列表加上这行，不能重复加
                    sortedResultList.push(new SortedLine(logLine, sortedResultList.length, index))
                    isThisLineAdded = true
                }

                // 给regex的结果序号里加上它在搜索结果里的序号，可以重复加
                sortedRegexList[i].addLine(sortedResultList.length - 1);
            }
        }

        allContentList.push(new ContentLine(logLine))
    })
}

function clearContent() {
    app.allContentList = []
    app.sortedResultList = []
    app.sortedRegexList.forEach((value) => value.resultLines = [])
}

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

let filteredLogContainer = document.getElementById('filtered-log-container');
let allLogContainer = document.getElementById('all-log-container');

// 获取当前视觉中心index（不是第一个）
function _getFilterLogContainerCenterItemIndex() {
    let containerScrollTop = filteredLogContainer.scrollTop
    let targetIndex = 0;
    let childSize = filteredLogContainer.childNodes[0].childNodes.length

    for (let i = 0; i < childSize; i++) {
        let childNode = filteredLogContainer.childNodes[0].childNodes[i];
        if (childNode.offsetTop + childNode.clientHeight >= containerScrollTop) {
            targetIndex = i - 1;
            if (targetIndex < 0) targetIndex = 0;
            break;
        }
    }

    return Math.min(targetIndex + 5, childSize - 1)
}

// 把to滚动到视觉中心
function _scrollIndexToCenterInFilterLogContainer(index) {
    filteredLogContainer.scrollTop = filteredLogContainer.childNodes[0].childNodes[index].offsetTop - 200
}

// 把to滚动到视觉中心
function _scrollIndexToCenterInLogContainer(index) {
    let windowHeight = window.innerHeight
    let windowWidth = window.innerWidth
    if (windowHeight > windowWidth) {
        allLogContainer.scrollTop = allLogContainer.childNodes[0].childNodes[index].offsetTop - 200 - windowHeight / 2
    } else {
        allLogContainer.scrollTop = allLogContainer.childNodes[0].childNodes[index].offsetTop - 200
    }
}


function isStringEmpty(obj) {
    if (typeof obj == "undefined" || obj == null || obj == "") {
        return true;
    } else {
        return false;
    }
}