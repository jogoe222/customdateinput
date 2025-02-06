class SimpleDateMask {
    el;
    placeholder;
    separator;
 
    constructor(el, placeholder = '_', separator = '.', delimiters = './-'){
        this.el = el
        this.placeholder = placeholder
        this.separator = separator
        this.delimiters = delimiters
        this.pattern = this.placeholder.repeat(2) + this.separator + this.placeholder.repeat(2) + this.separator + this.placeholder.repeat(4)
        this.validInputRegex = new RegExp('^((((_{2}|_0|[0-9]_|[0_]?[1-9]|1[0-9]|2[0-8])[.](_{2}|_0|[0-9]_|[0_]?[1-9]|1[0-2]))|((29|30|31)[.]([0_]_|[13578]_|[0_]?[13578]|1[02]))|((29|30)[.]([0_]_|[469]_|[0_]?[469]|11)))[.]([0-9_]{2,4}))|(29[.](2_|_2|[0_]?2)[.](([0-9_]{2})(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96|[0-9]_|_[0-9_])))$')
 
        //Disable the input's autocomplete
        this.el.setAttribute('autocomplete', 'off')
        this.el.value = this.pattern
        this.el.simpleDateMask = this
        
        // Add all event listeners
        this.el.addEventListener('focus',  (event) => {this.focusListener(event, this)})
        this.el.addEventListener('blur',  (event) => {this.blurListener(event, this)})
        this.el.addEventListener('beforeinput',  (event) => {this.beforeInputListener(event, this)})
        this.el.addEventListener('keydown',  (event) => {this.keyDownListener(event, this)})
        this.el.addEventListener('keyup',  (event) => {this.keyUpListener(event, this)})
        this.el.addEventListener('paste',  (event) => {this.pasteListener(event, this)})
    }
    
    isComplete() {
        return this.validInputRegex.test(this.el.value.replaceAll(this.placeholder, ''))
    }
    
    #_validateAndFormat(day, month, year) {
        const dayAsNumber = parseInt(day)
        const monthAsNumber = parseInt(month)
        const yearAsNumber = parseInt(year)
        if (isNaN(dayAsNumber) || isNaN(monthAsNumber) || isNaN(yearAsNumber)) {
            return undefined
        }
        const formattedDay = day.padStart(2, '0')
        const formattedMonth = month.padStart(2, '0')
        const formattedYear = year.padStart(4, '0')
        const formattedValue = formattedDay + this.separator + formattedMonth + this.separator + formattedYear
        const isValid = this.validInputRegex.test(formattedValue)
        return isValid ? formattedValue : undefined
    }
    
    setValue(value) {
        const splitValue = value.replaceAll(this.placeholder, '').split(new RegExp('[' + this.delimiters + ']'))
        if (splitValue.length <= 3) {
            const formattedValue = this.#_validateAndFormat(...splitValue)
            if (formattedValue) this.el.value = formattedValue
        }
    }
    
    pasteListener(event, _this) {
        event.preventDefault()
        const pastedContent = event.clipboardData.getData('text')
        _this.setValue(pastedContent)
    }
    
    #_setCursor(_this, position) {
        _this.el.setSelectionRange(position, position)
    }
    
    focusListener(event, _this) {
        const target = _this.el
        const value = target.value
        _this.#_setCursor(_this, Math.max(0, value.indexOf(_this.placeholder)))
    }
    
    blurListener(event, _this) {
        const target = _this.el
        const value = target.value
        if (value && _this.pattern !== value)
            _this.setValue(target.value)
        else
            _this.el.value = _this.pattern
    }
    
    beforeInputListener(event, _this) {
        const target = _this.el
        const action = event.inputType
        const data = event.data
        const selectionStart = target.selectionStart
        const value = target.value
        console.log(action, data, event)
        switch(action) {
            case 'insertText':
                if (value.charAt(selectionStart) === '') {
                    event.preventDefault()
                }
                else if (data !== _this.separator) {
                    const selectionEnd = target.selectionEnd
                    const previewValue = value.slice(0, selectionStart) + (data ?? '') + value.slice(selectionStart + 1)
                    if (!_this.validInputRegex.test(previewValue)) event.preventDefault()
                    else target.setRangeText('', selectionStart, selectionStart + 1, 'start')
                }
                else {
                    event.preventDefault()
                    const nextDotPosition = value.indexOf(_this.separator, selectionStart)
                     _this.#_setCursor(_this, nextDotPosition + 1)
                }
                break
            case 'deleteContentBackward':
                const selectionEnd = target.selectionEnd
                event.preventDefault()
                if (selectionStart !== selectionEnd) {
                    const partToDelete = value.slice(selectionStart, selectionEnd)
                    let replacements = []
                    partToDelete.split(_this.separator).forEach(
                        (part) => {
                            replacements.push(_this.placeholder.repeat(part.length))
                        }
                    )
                    target.setRangeText(
                        replacements.join(_this.separator),
                        selectionStart,
                        selectionEnd,
                        'start'
                    )
                    return
                }
                let start = selectionStart - 1
                if (start < 0) return
                if (value.charAt(start) === _this.separator)  start -= 1
                target.setRangeText(_this.placeholder, start, start + 1, 'start')
                 _this.#_setCursor(_this, start)
                break
            default:
                break
        }
    }

    keyDownListener(event, _this) {
        const target = _this.el
        const selectionStart = target.selectionStart
        const value = target.value
        if (event.key.startsWith('Arrow')) return
        if (value.charAt(selectionStart) === _this.separator) {
             _this.#_setCursor(_this, selectionStart + 1)
        }
    }

    keyUpListener(event, _this) {
        const target = _this.el
        const selectionStart = target.selectionStart
        const value = target.value
        if (event.key.startsWith('Arrow')) return
        if (selectionStart < 3) {
            const day = value.slice(0, 2)
            const replacedDay = day.replaceAll(_this.placeholder, '')
            if (replacedDay) {
                const dayAsNumber = parseInt(replacedDay)
                let dayAsString = day
                let newCursorPosition = 1
                if ((dayAsNumber > 3) || (dayAsNumber > 0 && day.startsWith(_this.placeholder))) {
                    dayAsString = dayAsNumber.toString().padStart(2, '0')
                    newCursorPosition = 3
                }
                target.setRangeText(dayAsString, 0, 2, 'start')
                 _this.#_setCursor(_this, newCursorPosition)
            }
        }
        else if (selectionStart < 6) {
            const month = value.slice(3, 5)
            const replacedMonth = month.replaceAll(_this.placeholder, '')
            if (replacedMonth) {
                const monthAsNumber = parseInt(replacedMonth)
                let monthAsString = month
                let newCursorPosition = 4
                if ((monthAsNumber > 1) || (monthAsNumber > 0 && month.startsWith(_this.placeholder))) {
                    monthAsString = monthAsNumber.toString().padStart(2, '0')
                    newCursorPosition = 6
                }
                target.setRangeText(monthAsString, 3, 5, 'start')
                 _this.#_setCursor(_this, newCursorPosition)
            }
        }
        if (value.charAt(selectionStart - 1) === _this.separator) {
            // _this.#_setCursor(_this, selectionStart)
            console.log('down', value.slice(0, selectionStart))
            //target.setRangeText()
        }
        else if (value.charAt(selectionStart) === _this.separator) {
             _this.#_setCursor(_this, selectionStart + 1)
        }
    }
}