import getActions from './actions'
import getMutations from './mutations'
import get from 'lodash/get'
import Vue from 'vue'
import { Logger } from '../../../infrastructure/logger'

export default function ({ Vue, LocalStorage, name, errorHandler, newMessagesInterseptor }) {
  const lsNamespace = get(name, 'lsNamespace', undefined)
  name = get(name, 'name', name)
  const logger = Vue.$logger ? Vue.$logger.extendName(name) : new Logger(name)
  const actions = getActions({ Vue, LocalStorage, errorHandler, logger }),
    mutations = getMutations({ Vue, LocalStorage, newMessagesInterseptor, logger })

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
    itemtype: null,
    cols: undefined,
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
