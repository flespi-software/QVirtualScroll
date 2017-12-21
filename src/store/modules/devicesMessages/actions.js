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
        //uncomment after release get cols by protocol
        // if (state.cols.length) {
        //     params.fields = state.cols.filter(col => {
        //         if (col.name === 'timestamp') { return true }
        //         return col.display
        //     }).reduce((acc, col, index, arr) => {
        //         return `${acc}${col.name}${index !== arr.length - 1 ? ',' : ''}`
        //     }, '')
        // }
        if (state.from && (!state.reverse || state.mode === 1)) {
            if (!state.reverse) {
                params.from = Math.floor(state.from / 1000)
            }
        }
        if (state.to) {
            if (state.mode === 1) {
                state.to = Date.now() - 4000
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
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let deviceResp = await Vue.http.get(`${rootState.server}/registry/devices/${state.active}`, {
                    params: {fields: 'telemetry,channel_id'}
                })
                let deviceData = await deviceResp.json()
                let cols = []
                // if (deviceData.result && deviceData.result[0] && deviceData.result[0].channel_id) {
                //     let protocolIdResp = await Vue.http.get(`${rootState.server}/gw/channels/${deviceData.result[0].channel_id}`, {
                //         params: {fields: 'protocol_id'}
                //     })
                //     let protocolIdData = await protocolIdResp.json()
                //     if (protocolIdData.result && protocolIdData.result[0].protocol_id) {
                //         let colsResp = await Vue.http.get(`${rootState.server}/gw/protocols/${protocolIdData.result[0].protocol_id}`, {
                //             params: {fields: 'message_parameters'}
                //         })
                //         let colsData = await colsResp.json()
                //         colsData.result[0].message_parameters.forEach(col => {
                //             cols.push({
                //                 name: col.name,
                //                 width: 150,
                //                 display: true,
                //                 description: col.info
                //             })
                //         })
                //     }
                // }
                // else {
                    let colNames = deviceData.result && deviceData.result[0] && deviceData.result[0].telemetry ? Object.keys(deviceData.result[0].telemetry) : []
                    if (colNames.length) {
                        cols = colNames.reduce((acc, col) => {
                            if (col === 'timestamp') { // todo remove after get configure for cols
                                acc.unshift({
                                    name: col,
                                    width: 190,
                                    display: true
                                })
                                return acc
                            }
                            acc.push({
                                name: col,
                                width: 150,
                                display: true
                            })
                            return acc
                        }, [])
                    }
                // }
                cols.length ? commit('setCols', cols) :  commit('setCols', [])
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
        }
    }

    async function initTime({ state, commit, rootState }) {
        if (rootState.token && state.active) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
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
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
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
                if (typeof rootState.isLoading !== 'undefined' && !state.timerId) {
                    rootState.isLoading = true
                }
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
                if (typeof rootState.isLoading !== 'undefined' && !state.timerId) {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined' && !state.timerId) {
                    rootState.isLoading = false
                }
            }
        }
    }

    async function getHistory({ state, commit, rootState }, count) {
        let limit = state.limit
        commit('setReverse', true)
        commit('setLimit', count)
        await get({ state, commit, rootState })
        commit('setReverse', false)
        commit('setLimit', limit)
    }

    async function pollingGet ({ state, commit, rootState }) {
        if (state.timerId) {
            commit('clearTimer')
        }
        await getHistory({ state, commit, rootState }, 200)
        await get({ state, commit, rootState })
        state.timerId = setInterval(() => { get({ state, commit, rootState }) }, state.delay)
    }

    return {
        get,
        pollingGet,
        getCols,
        initTime
    }

}