import getActions from './actions'
import getMutations from './mutations'

export default function (Store, Vue, LocalStorage, name) {
  let actions = getActions(Vue),
    mutations = getMutations(Vue, LocalStorage)

  const state = {
    name: name,
    active: 0,
    messages: [],
    filter: '',
    mode: null,
    from: 0,
    limit: 1000,
    cols: [],
    newMessagesCount: 0,
    offline: false,
    selected: null
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
