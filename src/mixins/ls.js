import _get from 'lodash/get'
import _set from 'lodash/set'

export const useLS = (storeName) => {

  const splitSchemas = (cols) => {
    const customColsSchema = {
      ...cols.schemas,
      _default: undefined,
      _protocol: undefined,
      _unsaved: undefined
    }
    const defaultColsSchema = {
      activeSchema: cols.activeSchema,
      schemas: {
        _default: cols.schemas._default,
        _protocol: cols.schemas._protocol,
        _unsaved: cols.schemas._unsaved
      }
    }
    return { customColsSchema, defaultColsSchema }
  }

  const getColsFromStore = (store) => {
    let colsFromStorage = {}
    let data = store.getItem(storeName)
    colsFromStorage = _get(data, "cols.messages", colsFromStorage)

    return colsFromStorage
  }

  const setColsToStore = (store, deviceTypeID, cols) =>  {
    const colsFromStorage = getColsFromStore(store) || {}
    const { customColsSchema, defaultColsSchema } = splitSchemas(cols)
    colsFromStorage[deviceTypeID] = defaultColsSchema
    colsFromStorage['custom-cols-schemas'] = { ...customColsSchema }
    let data = store.getItem(storeName)
    if (!data) { data = {} }
    _set(data, "cols.messages", colsFromStorage)
    store.set(storeName, data)
  }

  return { getColsFromStore, setColsToStore }
}