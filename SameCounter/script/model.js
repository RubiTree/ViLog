// rename to replacer
class Regex {
    dismiss = false
    isInner = false

    constructor(name, from, to) {
        this.from = from
        this.to = to
        this.name = name
    }

    replace(src) {
        return src
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
        this.regexList = regexGroup.regexList
    }

    initSortedRegexList() {
        return this.regexList.map((value) => new SortedRegex(value))
    }

    getNoInner(){
        let result = new RegexGroup(this.name)
        result.regexList = this.regexList.filter((value) => !value.isInner)
        return result
    }
}

export { Regex, RegexGroup}