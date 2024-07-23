import _get from 'lodash/get'
import _set from 'lodash/set'

function splitSchemas (cols) {
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
function getColsLS (LocalStorage, lsNamespace, name) {
  let colsFromStorage = {}
  if (lsNamespace) {
    const lsPath = lsNamespace.split('.'),
      lsItemName = lsPath.shift(),
      lsRouteToItem = `${lsPath.join('.')}.${name}`,
      appStorage = LocalStorage.getItem(lsItemName)
    colsFromStorage = _get(appStorage, lsRouteToItem, colsFromStorage)
  } else {
    colsFromStorage = LocalStorage.getItem(name) || colsFromStorage
  }
  return colsFromStorage
}

function setColsLS (LocalStorage, lsNamespace, name, active, cols) {
  const colsFromStorage = getColsLS(LocalStorage, lsNamespace, name) || {}
  const { customColsSchema, defaultColsSchema } = splitSchemas(cols)
  colsFromStorage[active] = defaultColsSchema
  colsFromStorage['custom-cols-schemas'] = { ...customColsSchema }
  if (lsNamespace) {
    const lsPath = lsNamespace.split('.'),
      lsItemName = lsPath.shift(),
      lsRouteToItem = `${lsPath.join('.')}.${name}`,
      appStorage = LocalStorage.getItem(lsItemName) || {}
    _set(appStorage, lsRouteToItem, colsFromStorage)
    LocalStorage.set(lsItemName, appStorage)
  } else {
    LocalStorage.set(name, colsFromStorage)
  }
}

export {
  getColsLS,
  setColsLS
}
