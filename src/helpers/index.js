import { getProp } from 'path-to-prop'

const MORE_PAGES = '...'

function debounce(func, wait, immediate) {
  let timeout
  return function () {
    const context = this
    const args = arguments
    clearTimeout(timeout)
    if (immediate && !timeout) {
      func.apply(context, args)
    }
    timeout = setTimeout(function () {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }, wait)
  }
}

// https://jsperf.com/object-empty-ch/1
function isEmptyObject(obj) {
  // eslint-disable-next-line no-unreachable-loop
  for (const key in obj) {
    return false
  }
  return true
}

function createPagingRange(nrOfPages, currentPage) {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let length

  range.push(1)

  if (nrOfPages <= 1) {
    return range
  }

  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i < nrOfPages && i > 1) {
      range.push(i)
    }
  }
  range.push(nrOfPages)

  for (let i = 0; i < range.length; i++) {
    if (length) {
      if (range[i] - length === 2) {
        rangeWithDots.push(length + 1)
      } else if (range[i] - length !== 1) {
        rangeWithDots.push(MORE_PAGES)
      }
    }
    rangeWithDots.push(range[i])
    length = range[i]
  }
  return rangeWithDots
}

/**
 * @param {string[]} dsSortby
 * @param {{ [id in string]: (cellValue: any, rowData: Record<string, any>) => any }} dsSortAs
 * @returns {(a: any, b: any) => number} must return a function that can be plugged into `.sort()`
 */
function fieldSorter(dsSortby, dsSortAs = {}) {
  const dir = []
  let i
  const length = dsSortby.length
  dsSortby = dsSortby.map(function (colId, i) {
    if (colId[0] === '-') {
      dir[i] = -1
      colId = colId.substring(1)
    } else {
      dir[i] = 1
    }
    return colId
  })

  /**
   * @param {{ rowIndex: number, rowData: Record<string, any>, rowDataFlat: Record<string, any> }} rowA
   * @param {{ rowIndex: number, rowData: Record<string, any>, rowDataFlat: Record<string, any> }} rowB
   */
  return function (rowA, rowB) {
    const rowDataA = rowA.rowData
    const rowDataB = rowB.rowData

    for (i = 0; i < length; i++) {
      const colId = dsSortby[i]
      const valueA = getProp(rowDataA, colId)
      const valueB = getProp(rowDataB, colId)
      const sortAsFn = dsSortAs[colId]
      const aVal = sortAsFn ? sortAsFn(valueA, rowDataA) : valueA
      const bVal = sortAsFn ? sortAsFn(valueB, rowDataB) : valueB
      if (aVal > bVal) {
        return dir[i]
      }
      if (aVal < bVal) {
        return -dir[i]
      }
    }
    return 0
  }
}

/**
 * @param {{ rowIndex: number, rowData: Record<string, any>, rowDataFlat: Record<string, any> }} row
 * @param {{ [colId in string]: (cellValue: any, rowData: Record<string, any>) => boolean | any }} dsFilterFields
 * @returns {boolean}
 */
export function filterRow(row, dsFilterFields) {
  const { rowData } = row

  const filterResults = Object.entries(dsFilterFields).map(([filterKey, filterValueOrFn]) => {
    // get the (nested) value
    const cellValue = getProp(rowData, filterKey)

    if (typeof filterValueOrFn === 'function') {
      return filterValueOrFn(cellValue, rowData)
    }
    return cellValue === filterValueOrFn
  })

  // the filters currently are chained with `AND`, so check with `.every`
  return filterResults.every((r) => r === true)
}

/**
 * Search method that also takes into account transformations needed
 * @param {string[]} dsSearchIn
 * @param {{ [id in string]: (cellValue: any, searchString: string, rowData: Record<string, any>) => boolean }} dsSearchAs
 * @param {{ rowIndex: number, rowData: Record<string, any>, rowDataFlat: Record<string, any> }} row
 * @param {string} str
 * @returns {boolean}
 */
export function findAny(dsSearchIn, dsSearchAs, row, str) {
  const { rowData, rowDataFlat } = row
  // Convert the search string to lower case
  str = String(str).toLowerCase()

  const rowDataEntries = Object.entries({ ...rowDataFlat, ...rowData })

  for (const [key, value] of rowDataEntries) {
    // check which keys to skip
    const notASearchableKey = dsSearchIn.length && !dsSearchIn.includes(key)
    if (notASearchableKey) continue

    const searchAsFn = dsSearchAs[key]
    // Check if `searchAsFn` is a function (passed from the template)
    if (typeof searchAsFn === 'function') {
      // We have a `searchAsFn` so we pass the value and the search string to a search function
      // that returns true/false and we return that if true.
      const res = searchAsFn(value, str, rowData)
      if (res === true) {
        return true
      }
    }
    const valueAsStr = String(value).toLowerCase()
    // If it doesn't return from above we perform a simple search
    if (valueAsStr.indexOf(str) >= 0) {
      return true
    }
  }
  return false
}

export { MORE_PAGES, debounce, isEmptyObject, createPagingRange, fieldSorter }
