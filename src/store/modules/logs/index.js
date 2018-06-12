import getActions from './actions'
import getMutations from './mutations'

export default function ({Vue, LocalStorage, name, errorHandler}) {
  let actions = getActions({Vue, errorHandler}),
    mutations = getMutations({Vue, LocalStorage})

  const state = {
    name: name,
    origin: '',
    messages: [],
    filter: '',
    sysFilter: '',
    mode: null,
    from: 0,
    to: 0,
    limit: 1000,
    reverse: false,
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
