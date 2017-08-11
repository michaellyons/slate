
import Normalize from '../utils/normalize'
import SCHEMA from '../schemas/core'

/**
 * Transforms.
 *
 * @type {Object}
 */

const Transforms = {}

/**
 * Add mark to text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mixed} mark
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.addMarkByKey = (transform, key, offset, length, mark, options = {}) => {
  mark = Normalize.mark(mark)
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'add_mark',
    path,
    offset,
    length,
    mark,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Insert a `node` at `index` in a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} index
 * @param {Node} node
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.insertNodeByKey = (transform, key, index, node, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'insert_node',
    path: [...path, index],
    node,
  })

  if (normalize) {
    transform.normalizeNodeByKey(key, SCHEMA)
  }
}

/**
 * Insert `text` at `offset` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {String} text
 * @param {Set<Mark>} marks (optional)
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.insertTextByKey = (transform, key, offset, text, marks, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'insert_text',
    path,
    offset,
    text,
    marks,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Join a node by `key` with the previous node.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.joinNodeByKey = (transform, key, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)
  const previous = document.getPreviousSibling(key)

  if (!previous) {
    throw new Error(`Unable to join node with key "${key}", no previous key.`)
  }

  const position = previous.kind == 'text' ? previous.length : previous.nodes.size

  transform.applyOperation({
    type: 'join_node',
    path,
    position,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Move a node by `key` to a new parent by `newKey` and `index`.
 * `newKey` is the key of the container (it can be the document itself)
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {String} newKey
 * @param {Number} index
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.moveNodeByKey = (transform, key, newKey, newIndex, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)
  const newPath = document.getPath(newKey)

  transform.applyOperation({
    type: 'move_node',
    path,
    newPath: [...newPath, newIndex],
  })

  if (normalize) {
    const parent = document.getCommonAncestor(key, newKey)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Remove mark from text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mark} mark
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.removeMarkByKey = (transform, key, offset, length, mark, options = {}) => {
  mark = Normalize.mark(mark)
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'remove_mark',
    path,
    offset,
    length,
    mark,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Remove a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.removeNodeByKey = (transform, key, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)
  const node = document.getNode(key)

  transform.applyOperation({
    type: 'remove_node',
    path,
    node,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Remove text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.removeTextByKey = (transform, key, offset, length, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)
  const node = document.getNode(key)
  const ranges = node.getRanges()
  const { text } = node

  const removals = []
  const bx = offset
  const by = offset + length
  let o = 0

  ranges.forEach((range) => {
    const { marks } = range
    const ax = o
    const ay = ax + range.text.length

    o += range.text.length

    // If the range doesn't overlap with the removal, continue on.
    if (ay < bx || by < ax) return

    // Otherwise, determine which offset and characters overlap.
    const start = Math.max(ax, bx)
    const end = Math.min(ay, by)
    const string = text.slice(start, end)

    removals.push({
      type: 'remove_text',
      path,
      offset: start,
      text: string,
      marks,
    })
  })

  // Apply the removals in reverse order, so that subsequent removals aren't
  // impacted by previous ones.
  removals.reverse().forEach((op) => {
    transform.applyOperation(op)
  })

  if (normalize) {
    const block = document.getClosestBlock(key)
    transform.normalizeNodeByKey(block.key, SCHEMA)
  }
}

/**
 * Set `properties` on mark on text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mark} mark
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.setMarkByKey = (transform, key, offset, length, mark, properties, options = {}) => {
  mark = Normalize.mark(mark)
  properties = Normalize.markProperties(properties)
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'set_mark',
    path,
    offset,
    length,
    mark,
    properties,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Set `properties` on a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object|String} properties
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.setNodeByKey = (transform, key, properties, options = {}) => {
  properties = Normalize.nodeProperties(properties)
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)
  const node = document.getNode(key)

  transform.applyOperation({
    type: 'set_node',
    path,
    node,
    properties,
  })

  if (normalize) {
    transform.normalizeNodeByKey(node.key, SCHEMA)
  }
}

/**
 * Split a node by `key` at `position`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} position
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.splitNodeByKey = (transform, key, position, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const path = document.getPath(key)

  transform.applyOperation({
    type: 'split_node',
    path,
    position,
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Split a node deeply down the tree by `key`, `textKey` and `textOffset`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} position
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.splitDescendantsByKey = (transform, key, textKey, textOffset, options = {}) => {
  if (key == textKey) {
    transform.splitNodeByKey(textKey, textOffset, options)
    return
  }

  const { normalize = true } = options
  const { state } = transform
  const { document } = state

  const text = document.getNode(textKey)
  const ancestors = document.getAncestors(textKey)
  const nodes = ancestors.skipUntil(a => a.key == key).reverse().unshift(text)
  let previous

  nodes.forEach((node) => {
    const index = previous ? node.nodes.indexOf(previous) + 1 : textOffset
    previous = node
    transform.splitNodeByKey(node.key, index, { normalize: false })
  })

  if (normalize) {
    const parent = document.getParent(key)
    transform.normalizeNodeByKey(parent.key, SCHEMA)
  }
}

/**
 * Unwrap content from an inline parent with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object|String} properties
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.unwrapInlineByKey = (transform, key, properties, options) => {
  const { state } = transform
  const { document, selection } = state
  const node = document.assertDescendant(key)
  const first = node.getFirstText()
  const last = node.getLastText()
  const range = selection.moveToRangeOf(first, last)
  transform.unwrapInlineAtRange(range, properties, options)
}

/**
 * Unwrap content from a block parent with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object|String} properties
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.unwrapBlockByKey = (transform, key, properties, options) => {
  const { state } = transform
  const { document, selection } = state
  const node = document.assertDescendant(key)
  const first = node.getFirstText()
  const last = node.getLastText()
  const range = selection.moveToRangeOf(first, last)
  transform.unwrapBlockAtRange(range, properties, options)
}

/**
 * Unwrap a single node from its parent.
 *
 * If the node is surrounded with siblings, its parent will be
 * split. If the node is the only child, the parent is removed, and
 * simply replaced by the node itself.  Cannot unwrap a root node.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.unwrapNodeByKey = (transform, key, options = {}) => {
  const { normalize = true } = options
  const { state } = transform
  const { document } = state
  const parent = document.getParent(key)
  const node = parent.getChild(key)

  const index = parent.nodes.indexOf(node)
  const isFirst = index === 0
  const isLast = index === parent.nodes.size - 1

  const parentParent = document.getParent(parent.key)
  const parentIndex = parentParent.nodes.indexOf(parent)

  if (parent.nodes.size === 1) {
    transform.moveNodeByKey(key, parentParent.key, parentIndex, { normalize: false })
    transform.removeNodeByKey(parent.key, options)
  }

  else if (isFirst) {
    // Just move the node before its parent.
    transform.moveNodeByKey(key, parentParent.key, parentIndex, options)
  }

  else if (isLast) {
    // Just move the node after its parent.
    transform.moveNodeByKey(key, parentParent.key, parentIndex + 1, options)
  }

  else {
    // Split the parent.
    transform.splitNodeByKey(parent.key, index, { normalize: false })

    // Extract the node in between the splitted parent.
    transform.moveNodeByKey(key, parentParent.key, parentIndex + 1, { normalize: false })

    if (normalize) {
      transform.normalizeNodeByKey(parentParent.key, SCHEMA)
    }
  }
}

/**
 * Wrap a node in an inline with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key The node to wrap
 * @param {Block|Object|String} inline The wrapping inline (its children are discarded)
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.wrapInlineByKey = (transform, key, inline, options) => {
  inline = Normalize.inline(inline)
  inline = inline.set('nodes', inline.nodes.clear())

  const { document } = transform.state
  const node = document.assertDescendant(key)
  const parent = document.getParent(node.key)
  const index = parent.nodes.indexOf(node)

  transform.insertNodeByKey(parent.key, index, inline, { normalize: false })
  transform.moveNodeByKey(node.key, inline.key, 0, options)
}

/**
 * Wrap a node in a block with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key The node to wrap
 * @param {Block|Object|String} block The wrapping block (its children are discarded)
 * @param {Object} options
 *   @property {Boolean} normalize
 */

Transforms.wrapBlockByKey = (transform, key, block, options) => {
  block = Normalize.block(block)
  block = block.set('nodes', block.nodes.clear())

  const { document } = transform.state
  const node = document.assertDescendant(key)
  const parent = document.getParent(node.key)
  const index = parent.nodes.indexOf(node)

  transform.insertNodeByKey(parent.key, index, block, { normalize: false })
  transform.moveNodeByKey(node.key, block.key, 0, options)
}

/**
 * Export.
 *
 * @type {Object}
 */

export default Transforms
