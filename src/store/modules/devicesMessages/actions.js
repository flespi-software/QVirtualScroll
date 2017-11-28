export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.count = state.limit }
        if (state.filter && state.sysFilter) {
            if (state.mode === 1) {
                params.filter = `${state.sysFilter}`
            }
            else {
                params.filter = `${state.sysFilter},${state.filter}`
            }
        }
        else if (state.sysFilter && !state.filter) { params.filter = `${state.sysFilter}`}
        else if (!state.sysFilter && state.filter) {
            if (state.mode === 0) {
                params.filter = `${state.filter}`
            }
        }
        if (state.cols.length) {
            params.fields = state.cols.filter(col => {
                if (col.name === 'timestamp') { return true }
                return col.display
            }).reduce((acc, col, index, arr) => {
                return `${acc}${col.name}${index !== arr.length - 1 ? ',' : ''}`
            }, '')
        }
        else if (state.sysFilter && !state.filter) { params.filter = `${state.sysFilter}` }
        else if (!state.sysFilter && state.filter) { params.filter = `${state.filter}` }
        if (state.from && !state.reverse) {
            if (state.mode) {
                state.from += state.delay
            }
            params.from = Math.floor(state.from / 1000)
        }
        if (state.to) {
            if (state.mode) {
                state.to += state.delay
            }
            params.to = Math.floor(state.to / 1000)
        }
        if (state.reverse) { params.reverse = state.reverse }
        return params
    }

    async function getCols ({ state, commit, rootState }) {
        commit('reqStart')
        if (rootState.token && state.active) {
            try {
                let telemetryResp = await Vue.http.get(`${rootState.server}/registry/devices/${state.active}`, {
                    params: {fields: 'telemetry'}
                })
                let telemetryData = await telemetryResp.json()
                let colNames = telemetryData.result && telemetryData.result[0] ? Object.keys(telemetryData.result[0].telemetry) : []
                if (colNames.length) {
                    let cols = colNames.reduce((acc, col) => {
                        acc.push({
                            name: col,
                            width: 150,
                            display: true
                        })
                        return acc
                    }, [])
                    cols.push({ // remove after fix with telemetry and timestamp
                        name: 'timestamp',
                        width: 150,
                        display: true
                    })
                    commit('setCols', cols)
                }
                else {
                    commit('setCols', [])
                }
            }
            catch (e) { console.log(e) }
        }
    }

    async function initTime({ state, commit, rootState }) {
        if (rootState.token && state.active) {
            try {
                let params = {
                    reverse: true,
                    count: 1,
                    fields: 'timestamp'
                }
                let resp = await Vue.http.get(`${rootState.server}/registry/devices/${state.active}/messages`, {
                    params: {data: JSON.stringify(params)}
                })
                let data = await resp.json()
                if (data.result.length) {
                    commit('setDate', Math.round(data.result[0].timestamp * 1000))
                }
                else {
                    commit('setDate', Date.now())
                }
            }
            catch (e) { console.log(e) }
        }
    }

    async function get ({ state, commit, rootState }, preaction) {
        commit('reqStart')
        if (preaction) {
            let { name: preactionName, payload: preactionPayload } = preaction
            commit('clearMessages')
            commit(preactionName, preactionPayload)
        }
        if (rootState.token && state.active) {
            try {
                let resp = await Vue.http.get(`${rootState.server}/registry/devices/${state.active}/messages`, {
                    params: {data: JSON.stringify(getParams(state))}
                })
                let data = await resp.json()
                if (preaction) {
                    if (data.result.length) {
                        commit('setMessages', data.result)
                        commit('postaction')
                    }
                    else {
                        commit('postaction')
                        switch (preaction.name) { // logic for empty response after pagination scroll
                            case 'paginationPrev': {
                                commit('datePrev')
                                commit('paginationPrev')
                                await get({ state, commit, rootState })
                                commit('postaction')
                                break
                            }
                            case 'paginationNext': {
                                get({ state, commit, rootState }, { name: 'dateNext' })
                                commit('postaction')
                                break
                            }
                            default: {
                                commit('setMessages', data.result)
                                commit('postaction')
                            }
                        }
                    }
                }
                else {
                    commit('setMessages', data.result)
                }
            }
            catch (e) { console.log(e) }
        }
    }

    function pollingGet ({ state, commit, rootState }) {
        if (state.timerId) {
            commit('clearTimer')
        }
        get({ state, commit, rootState })
        state.timerId = setInterval(() => { get({ state, commit, rootState }) }, state.delay)
    }

    return {
        get,
        pollingGet,
        getCols,
        initTime
    }

}