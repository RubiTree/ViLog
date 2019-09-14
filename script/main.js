import { Config, Regex, RegexGroup, SortedRegex, SortedLine, ContentLine, BaseLine } from './model.js';
import './utils.js';

let regexGroupsStorage = {
    KEY: 'RegexGroups',
    fetch: function () {
        let result = []
        let storageJson = localStorage.getItem(this.KEY)
        if (storageJson != null) {
            let gourpsData = JSON.parse(storageJson)
            // json parse出来的对象没有方法，只能取里面的数据，对象要新建
            gourpsData.forEach((groupData) => {
                let group = new RegexGroup(groupData.name)
                group.replace(groupData)
                result.push(group)
            })
        }

        if (result.length == 0) {
            result.push(new RegexGroup("默认"))
        }

        return result
    },
    save: function (regexGroup) {
        localStorage.setItem(this.KEY, JSON.stringify(regexGroup))
    }
}

let configStorage = {
    KEY: 'Config',
    fetch: function () {
        let storageJson = localStorage.getItem(this.KEY)
        if (storageJson != null) {
            return JSON.parse(storageJson)
        } else {
            return new Config()
        }
    },
    save: function (config) {
        localStorage.setItem(this.KEY, JSON.stringify(config))
    }
}

let app = new Vue({
    data: {
        regexGroups: regexGroupsStorage.fetch(),
        config: configStorage.fetch(),

        isLoading: false,

        command: "",

        sortedRegexList: [],
        sortedResultList: [],
        allContentList: [],

        newGroupName: "",
        newRegex: "",
        importRegexGroup: "",

        globalFocusItem: null,
        currentFocusRegex: null,
        currentFocusFilterLog: null,
        currentFocusLog: null,
    },
    mounted: function () {
        // 更正 config 中的 currentGroup
        this.config.currentGroupIndex = this.config.currentGroupIndex.between(0, this.regexGroups.length - 1)

        this._initSortedRegexList()
    },
    computed: {
        currentGroup: function () {
            return this.regexGroups[this.config.currentGroupIndex]
        },
        groupManualStateTips: function () {
            return this.config.showGroupManual ? "∨" : "∧"
        }
    },
    watch: {
        currentFocusFilterLog: function (newFilterLog, oldFilterLog) {
            if (this.currentFocusRegex != null && newFilterLog != null) {
                this.currentFocusRegex.currentFocusIndex = this.currentFocusRegex.resultLines.findFirstLittleIndexInOrderList(newFilterLog.indexOfContainer)
            }
        }
    },
    methods: {
        onSelectGroup: function (e) {
            this._onlyChangeCurrentGroupIndex(e.target.options.selectedIndex)
            this._clearLastRegex()
            this._onChangeRegex()
        },
        // not change regex
        _onlyChangeCurrentGroupIndex(newIndex) {
            this.config.currentGroupIndex = newIndex
            this._saveConfig()
        },
        _saveConfig() {
            setTimeout(() => configStorage.save(this.config), 0);
        },
        onSelectRegex: function (sortedRegex) {
            if (sortedRegex.resultLines.length == 0) return

            this._clearLastRegex()
            this._focusItem(sortedRegex)

            sortedRegex.resultLines.forEach((index) => {
                this.sortedResultList[index].select = true
                this.allContentList[this.sortedResultList[index].lineIndex].select = true
            })

            let from = _getFilterLogContainerCenterItemIndex()
            let to = sortedRegex.resultLines.findNearestValueInOrderList(from) // 需要放视觉中心的
            this._switchFocusFilteredLog(to)

            this.globalFocusItem = this.currentFocusFilterLog // 选择了regex后，直接把全局焦点放到对应的regex结果上，更符合操作习惯
        },

        switchGroupManualShowState: function () {
            this.config.showGroupManual = !this.config.showGroupManual
            setTimeout(() => configStorage.save(this.config), 0);
        },

        _switchFocusFilteredLog(index) {
            this._focusItem(this.sortedResultList[index])
            this._focusItem(this.allContentList[this.sortedResultList[index].lineIndex])

            _scrollIndexToCenterInFilterLogContainer(index)
            _scrollIndexToCenterInLogContainer(this.sortedResultList[index].lineIndex)
        },

        _clearLastRegex: function () {
            // 清理 select
            if (this.currentFocusRegex != null && this.currentFocusRegex.resultLines != null) {
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

        // 作用不大，只是好看
        onMouseEnterRegex: function (sortedRegex) {
            if (!this.config.eanbleUselessEffect) return
            if (sortedRegex.resultLines.length == 0) return

            sortedRegex.hover = true
            sortedRegex.resultLines.forEach((index) => this.sortedResultList[index].hover = true)
        },
        onMouseLeaveRegex: function (sortedRegex) {
            if (!this.config.eanbleUselessEffect) return
            if (sortedRegex.resultLines.length == 0) return

            sortedRegex.hover = false
            sortedRegex.resultLines.forEach((index) => this.sortedResultList[index].hover = false)
        },

        addRegex: function () {
            this.newRegex = this.newRegex.replace(/\n$/g, '');
            if (isStringEmpty(this.newRegex)) return

            this.currentGroup.addRegex(new Regex(this.newRegex))
            this.newRegex = ""

            this._onChangeRegex()
        },

        importRegex: function () {
            if (confirm(`导入的Regex组会直接添加到现有组中，可能会出现重复，可以提前处理好要导入的Json或者导入后使用删除当前组进行删除，确定要导入吗？`)) {
                let importRegexGroupsData = JSON.parse(this.importRegexGroup)
                this.importRegexGroup = ""
                if (importRegexGroupsData == null) {
                    toast("请把正确的regex贴到输入框")
                    return
                }

                let importGroupNames = []
                let importRegexCount = 0

                importRegexGroupsData.forEach((groupData) => {
                    let group = new RegexGroup(groupData.name)
                    group.replace(groupData)
                    this.regexGroups.push(group)

                    importGroupNames.push(group.name)
                    importRegexCount += group.regexList.length
                })

                setTimeout(() => regexGroupsStorage.save(this.regexGroups), 0);

                toast(`恭喜已经成功导入 ${importGroupNames.length} 组共 ${importRegexCount} 条规则`)
            }
        },

        addGroupAndSwitch: function () {
            this.newGroupName = this.newGroupName.trim();
            if (isStringEmpty(this.newGroupName)) return

            this.regexGroups.push(new RegexGroup(this.newGroupName))
            this.newGroupName = ""

            this._clearLastRegex()
            this._onlyChangeCurrentGroupIndex(this.regexGroups.length - 1)
            this._onChangeRegex()
        },

        removeCurrentGroup: function () {
            if (confirm(`删除的组不可恢复，请及时做好备份，确定要删除「${this.currentGroup.name}」组吗？`)) {
                this._clearLastRegex()
                this.regexGroups.removeObject(this.currentGroup)

                if (this.regexGroups.length == 0) {
                    this.regexGroups.push(new RegexGroup("默认"))
                }

                this._onlyChangeCurrentGroupIndex(Math.max(0, this.config.currentGroupIndex - 1))
                this._onChangeRegex()
            }
        },

        removeAllGroups: function () {
            if (confirm(`删除的组不可恢复，请及时做好备份，确定要删除全部 ${this.regexGroups.length} 组吗？`)) {
                this._clearLastRegex()
                this.regexGroups.clear()
                this.regexGroups.push(new RegexGroup("默认"))
                this._onlyChangeCurrentGroupIndex(0)
                this._onChangeRegex()
            }
        },

        exportCurrentGroup: function () {
            exportContentToClipboard(JSON.stringify([this.currentGroup]))
        },

        exportAllGroups: function () {
            exportContentToClipboard(JSON.stringify(this.regexGroups))
        },

        simpleCopyRegex: function () {
            exportContentToClipboard(this.currentGroup.regexList.map((regex) => regex.regexText).join("|"))
        },

        exportFilterResult: function () {
            // 这里有时候需要加<br>，有时候不需要...
            exportContentToClipboard(this.sortedResultList.map((sortedLine) => {
                let result = sortedLine.line.content
                if (this.config.eanbleLogTips && sortedLine.line.enableTips && !isStringEmpty(sortedLine.line.tips)) {
                    result = `【Tips: ${sortedLine.line.tips}】\n${result}`
                }
                return result
            }).join("\n"))
        },

        removeRegex: function (sortedRegex) {
            if (confirm(`删除的规则不可恢复，确定要删除这条规则「${sortedRegex.regex.regexText}」吗？`)) {
                if (this.currentFocusRegex === sortedRegex) {
                    this._clearLastRegex()
                }
                this.currentGroup.removeRegex(sortedRegex.regex)
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

            setTimeout(() => regexGroupsStorage.save(this.regexGroups), 0);
        },

        // todo 这里可以优化成只搜索新增regex
        _reRenderContentAfterNewRegex: function () {
            this.isLoading = true

            // 不这样会没有效果，因为vue会在下一个事件循环中进行渲染
            setTimeout(() => {
                this._initSortedRegexList()
                this.sortedResultList = []

                let sortedRegexList = this.sortedRegexList;
                let sortedResultList = this.sortedResultList;

                this.allContentList.forEach((logLine, index) => {
                    let isThisLineAdded = false;

                    for (let i = 0; i < sortedRegexList.length; i++) {
                        if (sortedRegexList[i].regex.dismiss) continue

                        if (logLine.line.content.search(new RegExp(sortedRegexList[i].regex.regexText, 'i')) > -1) {
                            if (!isThisLineAdded) {
                                // 给搜索结果列表加上这行，不能重复加
                                sortedResultList.push(new SortedLine(logLine.line, sortedResultList.length, index))
                                isThisLineAdded = true
                            }

                            // 给regex的结果序号里加上它在搜索结果里的序号，可以重复加
                            sortedRegexList[i].addLine(sortedResultList.length - 1);
                        }
                    }
                })

                this.isLoading = false
            }, 0)
        },

        _initSortedRegexList: function () {
            this.sortedRegexList = this.regexGroups[this.config.currentGroupIndex].initSortedRegexList()
        },

        onRegexConatinerKeyEnterAndDown() {

        },

        onFilteredLogContainerKeyEnter(isShift) {
            if (this.currentFocusRegex != null) {
                this._clearLogFocus()

                let next = 0
                if (isShift) {
                    next = this.currentFocusRegex.resultLines.findLastValueInOrderList(this.currentFocusFilterLog.indexOfContainer)
                } else {
                    next = this.currentFocusRegex.resultLines.findNextValueInOrderList(this.currentFocusFilterLog.indexOfContainer)
                }
                this._switchFocusFilteredLog(next)
            }
        },

        _clearLogFocus() {
            if (this.currentFocusFilterLog != null) this.currentFocusFilterLog.focus = false
            if (this.currentFocusLog != null) this.currentFocusLog.focus = false
        },

        onFilteredLogContainerKeyUpDown(isUp) {
            this._clearLogFocus()

            let next = this.currentFocusFilterLog.indexOfContainer
            if (isUp) {
                next--
            } else {
                next++
            }
            this._switchFocusFilteredLog(next.between(0, this.sortedResultList.length - 1))
        },

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

        enterCommand: function () {
            this.command = this.command.trim();
            if (isStringEmpty(this.command)) return

            // 下一次生效
            if (this.command == 'i') {
                this.config.eanbleInternalFeature = !this.config.eanbleInternalFeature
                this._toastModeStatus(this.config.eanbleInternalFeature, "内部特性")
            } else if (this.command == 'useless') {
                this.config.eanbleUselessEffect = !this.config.eanbleUselessEffect
                this._toastModeStatus(this.config.eanbleUselessEffect, "无用特性")
            } else if (this.command == 'tips') {
                this.config.eanbleLogTips = !this.config.eanbleLogTips
                this._toastModeStatus(this.config.eanbleLogTips, "Tips")
            }
            this.command = ""

            this._saveConfig()
        },
        _toastModeStatus(isOpen, modeName) {
            let state = isOpen ? "启用" : "关闭"
            toast(`已${state}「${modeName}」模式`)
        },
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
            } else if (key == "ArrowUp" || key == "ArrowDown") {
                if (_this.globalFocusItem instanceof SortedLine) {
                    _this.onFilteredLogContainerKeyUpDown(key == "ArrowUp")
                }
            }
        };
    },
});
app.$mount('#app');

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

        app.isLoading = true;

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
    app._reRenderContentAfterNewRegex()
    clearContent()

    let logLines = logText.split('\n');
    let sortedRegexList = app.sortedRegexList;
    let sortedResultList = app.sortedResultList;
    let allContentList = app.allContentList;

    logLines.forEach((logLine, index) => {
        let isThisLineAdded = false;

        let baseLine = new BaseLine(logLine)
        if (app.config.eanbleInternalFeature) {
            processBaseLineByInternel(baseLine)
        }

        for (let i = 0; i < sortedRegexList.length; i++) {
            if (sortedRegexList[i].regex.dismiss) continue

            if (logLine.search(sortedRegexList[i].regex.regexText) > -1) {
                if (!isThisLineAdded) {
                    // 给搜索结果列表加上这行，不能重复加
                    sortedResultList.push(new SortedLine(baseLine, sortedResultList.length, index))
                    isThisLineAdded = true
                }

                // 给regex的结果序号里加上它在搜索结果里的序号，可以重复加
                sortedRegexList[i].addLine(sortedResultList.length - 1);
            }
        }

        allContentList.push(new ContentLine(baseLine))
    })
}

function processBaseLineByInternel(baseLine) {
    baseLine.content = baseLine.content.replace(new RegExp(/GMT\+08:00/, 'g'), "+8")
    baseLine.content = baseLine.content.replace(new RegExp(/2019\-/, 'g'), "")
    baseLine.content = baseLine.content.replace(new RegExp(/\[, , \]/, 'g'), "")

    if (baseLine.content.search(/\[E\]/) > -1) {
        baseLine.isError = true
    }

    let contentIndex = baseLine.content.search(/(?<=(\[.*\]){4,7}).*/)
    if (contentIndex > -1) {
        baseLine.contentStartIndex = contentIndex
    }
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
    let windowHeight = window.innerHeight
    filteredLogContainer.scrollTop = filteredLogContainer.childNodes[0].childNodes[index].offsetTop - windowHeight / 3
}

// 把to滚动到视觉中心
function _scrollIndexToCenterInLogContainer(index) {
    let windowHeight = window.innerHeight
    let windowWidth = window.innerWidth
    if (windowHeight > windowWidth) {
        allLogContainer.scrollTop = allLogContainer.childNodes[0].childNodes[index].offsetTop - 5 * windowHeight / 6
    } else {
        allLogContainer.scrollTop = allLogContainer.childNodes[0].childNodes[index].offsetTop - windowHeight / 3
    }
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