class Config {
    showGroupManual = false
    currentGroupIndex = 0
    eanbleInternalFeature = false
    eanbleUselessEffect = false
}

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

    replace(regexGroup) {
        if (regexGroup.regexList) {
            this.regexList = regexGroup.regexList
        }
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

    constructor(line, indexOfContainer, lineIndex) {
        this.line = line // BaseLine
        this.indexOfContainer = indexOfContainer // int
        this.lineIndex = lineIndex // int
    }
}

class ContentLine {
    select = false
    key = false
    focus = false

    constructor(line) {
        this.line = line // BaseLine
    }
}

class BaseLine {
    contentStartIndex = 0
    isError = false

    constructor(content) {
        this.content = content // string
    }
}

export { Config, Regex, RegexGroup, SortedRegex, SortedLine, ContentLine, BaseLine }