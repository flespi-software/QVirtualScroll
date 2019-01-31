import getActions from './actions'
import getMutations from './mutations'

export default function ({Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor}) {
  let actions = getActions({Vue, LocalStorage, errorHandler}),
    mutations = getMutations({Vue, LocalStorage, filterHandler, newMessagesInterseptor})

  const state = {
    name: name,
    isLoading: false,
    active: 0,
    messages: [],
    filter: '',
    sysFilter: '',
    settings: {},
    mode: null,
    from: 0,
    to: 0,
    limit: 1000,
    reverse: false,
    cols: [],
    newMessagesCount: 0,
    offline: false,
    selected: [],
    sortBy: null
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
