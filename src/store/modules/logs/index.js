import getActions from './actions'
import getMutations from './mutations'

export default function (Store, Vue, LocalStorage, name) {
    let actions = getActions(Vue),
        mutations = getMutations(Vue, LocalStorage)

    const state = {
        name: name,
        timerId: 0,
        origin: '',
        messages: [],
        filter: '',
        delay: 2000,
        sysFilter: '',
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
