import getActions from './actions'
import getMutations from './mutations'
import get from 'lodash/get'

export default function ({ Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor }) {
  const lsNamespace = get(name, 'lsNamespace', undefined)
  name = get(name, 'name', name)
  const actions = getActions({ Vue, LocalStorage, errorHandler }),
    mutations = getMutations({ Vue, LocalStorage, filterHandler, newMessagesInterseptor })

  const state = {
    name,
    lsNamespace,
    isLoading: false,
    origin: '',
    messages: [],
    pages: [],
    filter: '',
    realtimeEnabled: false,
    from: 0,
    to: 0,
    cid: null,
    limit: 1000,
    reverse: false,
    cols: [],
    offline: false,
    selected: [],
    isItemDeleted: false,
    hasNewMessages: null
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
