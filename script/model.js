
class Regex {
    dismiss = false

    constructor(regexText) {
        this.regexText = regexText
    }

    toString() {
        return `${this.regexText}-${this.name}`
    }
}

class RegexGroup {
    regexList = []

    constructor(name) {
        this.name = name
    }

    addRegex(regex) {
        this.regexList.push(regex)
    }

    removeRegex(regex) {
        this.regexList.removeObject(regex)
    }

    // 居然没找到直接添加数组的方法，先这么写了
    merge(regexGroup) {
        this.regexList = this.regexList.concat(regexGroup.regexList)
    }

    replace(regexGroup) {
        this.regexList = regexGroup.regexList
    }

    initSortedRegexList() {
        return this.regexList.map((value) => new SortedRegex(value))
    }
}

class SortedRegex {
    resultLines = [] // number[]
    focus = false
    hover = false
    currentFocusIndex = -1

    // regex: Regex
    constructor(regex) {
        this.regex = regex
    }

    addLine(line) {
        this.resultLines.push(line)
    }

    getFocusProgress() {
        if (this.currentFocusIndex == -1) {
            return this.resultLines.length
        } else {
            return `${this.currentFocusIndex + 1}/${this.resultLines.length}`
        }
    }
}

// rename FiltedLine
class SortedLine {
    select = false
    key = false
    hover = false
    focus = false

    constructor(content, indexOfContainer, lineIndex) {
        this.content = content // string
        this.indexOfContainer = indexOfContainer // int
        this.lineIndex = lineIndex // int
    }
}

class ContentLine {
    select = false
    key = false
    focus = false

    constructor(content) {
        this.content = content // string
    }
}

export { Regex, RegexGroup, SortedRegex, SortedLine, ContentLine }