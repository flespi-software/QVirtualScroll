import getActions from './actions'
import getMutations from './mutations'

export default function (Store, Vue) {
    let actions = getActions(Vue),
        mutations = getMutations(Vue)

    const state = {
        timerId: 0,
        active: 0,
        messages: [],
        filter: '',
        sysFilter: '',
        delay: 2000,
        mode: null,
        from: 0,
        to: 0,
        limit: 1000,
        reverse: false,
        cols: []
    }

    return {
        namespaced: true,
        state,
        actions,
        mutations
    }
}
