import getActions from './actions'
import getMutations from './mutations'
import get from 'lodash/get'

export default function ({ Vue, LocalStorage, name, errorHandler, newMessagesInterseptor }) {
  const lsNamespace = get(name, 'lsNamespace', undefined)
  name = get(name, 'name', name)
  const actions = getActions({ Vue, LocalStorage, errorHandler }),
    mutations = getMutations({ Vue, LocalStorage, newMessagesInterseptor })

  const state = {
    name,
    lsNamespace,
    isLoading: false,
    active: 0,
    activeDevice: 0,
    messages: {},
    filter: '',
    sysFilter: '',
    begin: Date.now() - 86400000,
    end: Date.now(),
    limit: 1000,
    reverse: false,
    cols: undefined,
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
