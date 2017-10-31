export default function (Vue) {
    function getFromTo (val) {
        let now = val || Date.now(),
            from = now - (now % 86400000),
            to = from + 86400000
        return {from, to}
    }

    function setMessages (state, data) {
        if (data && data.length) {
            if (state.reverse) {
                data.reverse()
            }
            let messages = [...state.messages, ...data]
            if (state.limit && state.mode === 1 && messages.length >= state.limit) { // rt limiting
                messages = messages.slice((messages.length -1) - (state.limit - 1))
            }
            Vue.set(state, 'messages', messages)
        }
    }

    function clearMessages (state) {
        Vue.set(state, 'messages', [])
    }

    function setLimit (state, count) {
        Vue.set(state, 'limit', count)
    }

    function setFilter (state, value) {
        if (state.filter !== value) {
            Vue.set(state, 'filter', value)
        }
    }

    function setMode (state, mode) {
        switch (mode) {
            case 0: {
                if (state.timerId) {
                    clearInterval(state.timerId)
                    state.timerId = 0
                }
                let timeObj = state.from ? getFromTo(state.from) : getFromTo()
                state.from = timeObj.from
                state.to = timeObj.to
                state.messages = []
                state.limit = 1000
                break
            }
            case 1: {
                let now = Date.now()
                state.from = now - 4000 - 1000
                state.to = now - 4000
                state.limit = 1000
                state.messages = []
                break
            }
        }
        Vue.set(state, 'mode', mode)
    }

    function setFrom (state, from) {
        Vue.set(state, 'from', from)
    }

    function setTo (state, to) {
        Vue.set(state, 'to', to)
    }

    function reqStart () {
        if (DEV) {
            console.log('Start Request Channels Logs')
        }
    }

    function clearTimer (state) {
        clearInterval(state.timerId)
        state.timerId = 0
    }

    function setReverse (state, val) {
        Vue.set(state, 'reverse', val)
    }

    function setDate (state, date) {
        let timeObj = getFromTo(date)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function dateNext (state) {
        let timeObj = getFromTo(state.from + 86400000)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function datePrev (state) {
        let timeObj = getFromTo(state.from - 86400000)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function paginationPrev (state, firstTimestamp) {
        state.reverse = true
        state.sysFilter += `time>=${state.from / 1000}`
        if (firstTimestamp) {
            state.from = getFromTo(firstTimestamp).from
            state.to = firstTimestamp - 1000
        }
    }

    function paginationNext (state, lastTimestamp) {
        state.sysFilter += `time<=${state.to / 1000}`
        if (lastTimestamp) {
            state.to = getFromTo(lastTimestamp).to
            state.from = lastTimestamp + 1000
        }
    }

    function postaction (state) {
        let timeObj = getFromTo(state.from)
        setFrom(state, timeObj.from)
        setTo(state, timeObj.to)
        if (state.reverse) { setReverse(state, false) }
        state.sysFilter = ''
    }

    function clear (state) {
        if (state.timerId) {
            clearInterval(state.timerId)
            state.timerId = 0
        }
        clearMessages(state)
        state.filter = ''
        state.mode = null
        state.from = 0
        state.to = 0
        state.limit = 1000
        state.reverse = false
    }

    function setActive (state, id) {
        Vue.set(state, 'active', id)
    }

    function setCols (state, cols) {
        if (cols) {
            Vue.set(state, 'cols', cols)
        }
        else {
            let defaultCols = [
                {
                    name: 'channel_id',
                    width: 85,
                    display: true,
                    description: 'Log refferes to a given chanel'
                },
                {
                    name: 'duration',
                    width: 85,
                    display: true,
                    description: 'Connection duration in seconds'
                },
                {
                    name: 'event',
                    width: 400,
                    display: true,
                    description: 'Log event code and description'
                },
                {
                    name: 'ident',
                    width: 150,
                    display: true,
                    description: 'Connected device\'s identification string'
                },
                {
                    name: 'msgs',
                    width: 85,
                    display: true,
                    description: 'Number of messages received'
                },
                {
                    name: 'recv',
                    width: 85,
                    display: true,
                    description: 'Number of bytes received'
                },
                {
                    name: 'send',
                    width: 85,
                    display: true,
                    description: 'Number of bytes sent'
                },
                {
                    name: 'transport',
                    width: 85,
                    display: true,
                    description: 'Connected device\'s transport: tcp, udp, http etc'
                },
                {
                    name: 'source',
                    width: 150,
                    display: true,
                    description: 'Connected device\'s address'
                },
                {
                    name: 'time',
                    width: 150,
                    display: true,
                    description: 'Log event time'
                }
            ]
            Vue.set(state, 'cols', defaultCols)
        }
    }

    return {
        setMessages,
        clearMessages,
        setLimit,
        setFilter,
        setMode,
        setFrom,
        setTo,
        reqStart,
        clearTimer,
        setReverse,
        dateNext,
        datePrev,
        paginationPrev,
        paginationNext,
        setDate,
        postaction,
        clear,
        setActive,
        setCols
    }
}