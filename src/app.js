const SIZE_PX = { P: 28, M: 40, G: 56 }
const MIN_RADIUS = 14
const MAX_RADIUS = 100
const RESIZE_STEP = 3

const BASE_MIN_RADIUS = 16
const BASE_MAX_RADIUS = 80
const BASE_DEFAULT_RADIUS = 34
const BASE_RESIZE_STEP = 3

const BASE_COLORS = {
  vermelho: "#c82828",
  verde: "#28a03c",
  azul: "#2846c8",
  amarelo: "#e6c828",
  laranja: "#e68228",
  rosa: "#e63c96",
  preto: "#191919",
  branco: "#f0f0f0",
}

const PIECE_SHAPES_SIZES = [
  ["cubo", "P"], ["cubo", "M"], ["cubo", "G"],
  ["cilindro", "P"], ["cilindro", "M"], ["cilindro", "G"],
  ["prisma", "P"], ["prisma", "M"], ["prisma", "G"],
]

const CONNECTION_CLICK_WIDTH = 9

/* ── Estado (módulo) ── */
let nextId = 0
const pieces = new Map()
const bases = new Map()
const connections = new Map()

let draggingObj = null
let draggingNewItem = null
let connectSourceId = null
let selectedConnectionId = null
let editingPieceId = null

/* ── Refs de DOM — atribuídas em initApp() ── */
let stageWrapper, itemsLayer, connectionsLayer, colPieces, colBases
let trashEl, stageBg, zoomSlider, zoomLabel, labelEditor, labelInput

/* ── Utilitários ── */
function newId() { return ++nextId }

function stagePointFromEvent(evt) {
  const rect = stageWrapper.getBoundingClientRect()
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

/* ── Paleta ── */
function buildShapeFallback(shape) {
  const wrap = document.createElement("div")
  wrap.className = "shape-fallback " + shape
  if (shape === "prisma") {
    wrap.style.width = "55%"
    wrap.style.height = "100%"
    wrap.style.margin = "0 auto"
  }
  return wrap
}

function makePieceVisual(shape) {
  const holder = document.createElement("div")
  holder.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center"
  const img = document.createElement("img")
  img.src = `assets/pieces/${shape}.png`
  img.draggable = false
  img.onerror = () => { holder.innerHTML = ""; holder.appendChild(buildShapeFallback(shape)) }
  holder.appendChild(img)
  return holder
}

function buildPalette() {
  for (const [shape, size] of PIECE_SHAPES_SIZES) {
    const item = document.createElement("div")
    item.className = "palette-item"
    item.dataset.kind = "piece"
    item.dataset.shape = shape
    item.dataset.size = size
    const visual = document.createElement("div")
    const px = SIZE_PX[size] * 1.4
    visual.style.width = px + "px"
    visual.style.height = px + "px"
    visual.appendChild(makePieceVisual(shape))
    item.appendChild(visual)
    const label = document.createElement("span")
    label.className = "label"
    label.textContent = `${shape.slice(0, 3)} ${size}`
    item.appendChild(label)
    item.addEventListener("pointerdown", (evt) => startPaletteDrag(evt, item))
    colPieces.appendChild(item)
  }

  for (const colorName of Object.keys(BASE_COLORS)) {
    const item = document.createElement("div")
    item.className = "palette-item"
    item.dataset.kind = "base"
    item.dataset.color = colorName
    const visual = document.createElement("div")
    visual.className = "base-fallback"
    visual.style.width = "36px"
    visual.style.height = "22px"
    visual.style.background = BASE_COLORS[colorName]
    item.appendChild(visual)
    item.addEventListener("pointerdown", (evt) => startPaletteDrag(evt, item))
    colBases.appendChild(item)
  }
}

function startPaletteDrag(evt, item) {
  evt.preventDefault()
  const kind = item.dataset.kind
  const ghost = item.cloneNode(true)
  ghost.style.cssText = `position:fixed;pointer-events:none;opacity:0.85;left:${evt.clientX}px;top:${evt.clientY}px;transform:translate(-50%,-50%);z-index:100`
  document.body.appendChild(ghost)
  draggingNewItem = { kind, shape: item.dataset.shape, size: item.dataset.size, color: item.dataset.color, ghostEl: ghost }

  const move = (e) => { ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px" }
  const up = (e) => {
    document.removeEventListener("pointermove", move)
    document.removeEventListener("pointerup", up)
    ghost.remove()
    const rect = stageWrapper.getBoundingClientRect()
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const point = stagePointFromEvent(e)
      if (draggingNewItem.kind === "piece") createPiece(draggingNewItem.shape, draggingNewItem.size, point.x, point.y)
      else createBase(draggingNewItem.color, point.x, point.y)
    }
    draggingNewItem = null
  }
  document.addEventListener("pointermove", move)
  document.addEventListener("pointerup", up)
}

/* ── Peças ── */
function createPiece(shape, size, x, y, options = {}) {
  const id = options.id ?? newId()
  const radius = options.radius ?? SIZE_PX[size]
  const piece = { id, shape, size, x, y, radius, label: options.label ?? "" }
  const el = document.createElement("div")
  el.className = "piece"
  el.dataset.id = id
  el.appendChild(makePieceVisual(shape))
  const labelEl = document.createElement("div")
  labelEl.className = "label-text"
  el.appendChild(labelEl)
  itemsLayer.appendChild(el)
  piece.el = el
  piece.labelEl = labelEl
  attachPieceHandlers(el, id)
  pieces.set(id, piece)
  updatePieceVisual(piece)
  return piece
}

function updatePieceVisual(piece) {
  const size = piece.radius * 2
  piece.el.style.width = size + "px"
  piece.el.style.height = size + "px"
  piece.el.style.left = piece.x + "px"
  piece.el.style.top = piece.y + "px"
  piece.labelEl.textContent = piece.label
  piece.el.classList.toggle("connect-source", connectSourceId === piece.id)
  refreshConnectionsForPiece(piece.id)
}

function removePiece(id) {
  const piece = pieces.get(id)
  if (!piece) return
  piece.el.remove()
  pieces.delete(id)
  for (const [connId, conn] of [...connections.entries()]) {
    if (conn.aId === id || conn.bId === id) { conn.el.remove(); connections.delete(connId) }
  }
  if (connectSourceId === id) connectSourceId = null
  if (editingPieceId === id) hideLabelEditor()
}

function attachPieceHandlers(el, id) {
  el.addEventListener("pointerdown", (evt) => {
    if (evt.button !== 0) return
    evt.preventDefault(); evt.stopPropagation()
    selectedConnectionId = null; renderConnectionsStyle()
    draggingObj = { kind: "piece", id }
    el.setPointerCapture(evt.pointerId)
  })
  el.addEventListener("pointermove", (evt) => {
    if (!draggingObj || draggingObj.id !== id) return
    const point = stagePointFromEvent(evt)
    const piece = pieces.get(id)
    piece.x = point.x; piece.y = point.y
    updatePieceVisual(piece); updateTrashHighlight(evt)
  })
  el.addEventListener("pointerup", (evt) => {
    if (!draggingObj || draggingObj.id !== id) return
    finishDrag(evt)
  })
  el.addEventListener("contextmenu", (evt) => {
    evt.preventDefault()
    if (connectSourceId === null) connectSourceId = id
    else if (connectSourceId === id) connectSourceId = null
    else { createConnection(connectSourceId, id); connectSourceId = null }
    const piece = pieces.get(id)
    if (piece) updatePieceVisual(piece)
    for (const p of pieces.values()) updatePieceVisual(p)
  })
  el.addEventListener("wheel", (evt) => {
    evt.preventDefault()
    const piece = pieces.get(id)
    const delta = evt.deltaY < 0 ? RESIZE_STEP : -RESIZE_STEP
    piece.radius = clamp(piece.radius + delta, MIN_RADIUS, MAX_RADIUS)
    updatePieceVisual(piece)
  }, { passive: false })
  el.addEventListener("dblclick", (evt) => { evt.preventDefault(); showLabelEditor(id) })
}

/* ── Bases ── */
function createBase(colorName, x, y, options = {}) {
  const id = options.id ?? newId()
  const radius = options.radius ?? BASE_DEFAULT_RADIUS
  const base = { id, color: colorName, x, y, radius }
  const el = document.createElement("div")
  el.className = "base"; el.dataset.id = id
  const visual = document.createElement("div")
  visual.className = "base-fallback"
  visual.style.background = BASE_COLORS[colorName] || "#999"
  el.appendChild(visual)
  itemsLayer.appendChild(el)
  base.el = el
  attachBaseHandlers(el, id)
  bases.set(id, base)
  updateBaseVisual(base)
  return base
}

function updateBaseVisual(base) {
  base.el.style.width = base.radius * 2 + "px"
  base.el.style.height = base.radius + "px"
  base.el.style.left = base.x + "px"
  base.el.style.top = base.y + "px"
}

function removeBase(id) {
  const base = bases.get(id)
  if (!base) return
  base.el.remove(); bases.delete(id)
}

function attachBaseHandlers(el, id) {
  el.addEventListener("pointerdown", (evt) => {
    if (evt.button !== 0) return
    evt.preventDefault(); evt.stopPropagation()
    selectedConnectionId = null; renderConnectionsStyle()
    draggingObj = { kind: "base", id }
    el.setPointerCapture(evt.pointerId)
  })
  el.addEventListener("pointermove", (evt) => {
    if (!draggingObj || draggingObj.id !== id) return
    const point = stagePointFromEvent(evt)
    const base = bases.get(id)
    base.x = point.x; base.y = point.y
    updateBaseVisual(base); updateTrashHighlight(evt)
  })
  el.addEventListener("pointerup", (evt) => {
    if (!draggingObj || draggingObj.id !== id) return
    finishDrag(evt)
  })
  el.addEventListener("contextmenu", (evt) => { evt.preventDefault(); removeBase(id) })
  el.addEventListener("wheel", (evt) => {
    evt.preventDefault()
    const base = bases.get(id)
    const delta = evt.deltaY < 0 ? BASE_RESIZE_STEP : -BASE_RESIZE_STEP
    base.radius = clamp(base.radius + delta, BASE_MIN_RADIUS, BASE_MAX_RADIUS)
    updateBaseVisual(base)
  }, { passive: false })
}

/* ── Drag / Lixeira ── */
function trashRectContains(evt) {
  const rect = trashEl.getBoundingClientRect()
  return evt.clientX >= rect.left && evt.clientX <= rect.right && evt.clientY >= rect.top && evt.clientY <= rect.bottom
}

function updateTrashHighlight(evt) {
  trashEl.classList.toggle("highlight", !!(draggingObj && trashRectContains(evt)))
}

function finishDrag(evt) {
  if (draggingObj && trashRectContains(evt)) {
    if (draggingObj.kind === "piece") removePiece(draggingObj.id)
    else removeBase(draggingObj.id)
  }
  trashEl.classList.remove("highlight")
  draggingObj = null
}

/* ── Conexões ── */
function createConnection(aId, bId, options = {}) {
  if (aId === bId) return null
  const id = options.id ?? newId()
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  line.dataset.id = id
  line.setAttribute("stroke", "#f0f0f0")
  line.setAttribute("stroke-width", String(CONNECTION_CLICK_WIDTH - 4))
  connectionsLayer.appendChild(line)
  line.addEventListener("pointerdown", (evt) => {
    evt.stopPropagation()
    selectedConnectionId = id; renderConnectionsStyle()
  })
  const conn = { id, aId, bId, el: line }
  connections.set(id, conn)
  refreshConnectionLine(conn)
  return conn
}

function refreshConnectionLine(conn) {
  const a = pieces.get(conn.aId); const b = pieces.get(conn.bId)
  if (!a || !b) return
  conn.el.setAttribute("x1", a.x); conn.el.setAttribute("y1", a.y)
  conn.el.setAttribute("x2", b.x); conn.el.setAttribute("y2", b.y)
}

function refreshConnectionsForPiece(pieceId) {
  for (const conn of connections.values()) {
    if (conn.aId === pieceId || conn.bId === pieceId) refreshConnectionLine(conn)
  }
}

function renderConnectionsStyle() {
  for (const conn of connections.values()) {
    const selected = conn.id === selectedConnectionId
    conn.el.setAttribute("stroke", selected ? "#ffdc3c" : "#f0f0f0")
    conn.el.setAttribute("stroke-width", String(selected ? CONNECTION_CLICK_WIDTH - 2 : CONNECTION_CLICK_WIDTH - 4))
  }
}

function removeConnection(id) {
  const conn = connections.get(id)
  if (!conn) return
  conn.el.remove(); connections.delete(id)
  if (selectedConnectionId === id) selectedConnectionId = null
}

/* ── Rótulo ── */
function showLabelEditor(pieceId) {
  const piece = pieces.get(pieceId)
  if (!piece) return
  editingPieceId = pieceId
  labelInput.value = piece.label
  labelEditor.classList.remove("hidden")
  const rect = piece.el.getBoundingClientRect()
  labelEditor.style.left = rect.left + rect.width / 2 - 60 + "px"
  labelEditor.style.top = rect.top - 30 + "px"
  labelInput.focus(); labelInput.select()
}

function hideLabelEditor() {
  labelEditor.classList.add("hidden"); editingPieceId = null
}

function commitLabelEditor() {
  if (editingPieceId === null) return
  const piece = pieces.get(editingPieceId)
  if (piece) { piece.label = labelInput.value; updatePieceVisual(piece) }
  hideLabelEditor()
}

/* ── Salvar / Carregar ── */
function serializeSession() {
  return {
    pieces: [...pieces.values()].map((p) => ({ id: p.id, shape: p.shape, size: p.size, x: p.x, y: p.y, label: p.label, radius: p.radius })),
    bases:  [...bases.values()].map((b) => ({ id: b.id, color: b.color, x: b.x, y: b.y, radius: b.radius })),
    connections: [...connections.values()].map((c) => ({ a: c.aId, b: c.bId })),
  }
}

function clearSession() {
  for (const id of [...pieces.keys()]) removePiece(id)
  for (const id of [...bases.keys()]) removeBase(id)
  for (const id of [...connections.keys()]) removeConnection(id)
  nextId = 0
}

function loadSessionData(data) {
  clearSession()
  let maxId = 0
  for (const pd of data.pieces || []) {
    createPiece(pd.shape, pd.size, pd.x, pd.y, { id: pd.id, radius: pd.radius, label: pd.label || "" })
    maxId = Math.max(maxId, pd.id)
  }
  for (const bd of data.bases || []) {
    createBase(bd.color, bd.x, bd.y, { id: bd.id, radius: bd.radius })
    maxId = Math.max(maxId, bd.id)
  }
  for (const cd of data.connections || []) createConnection(cd.a, cd.b)
  nextId = maxId
}

function applyZoom(value) {
  stageBg.style.transform = `scale(${value / 100})`
  zoomLabel.textContent = `Zoom palco: ${value}%`
  zoomSlider.value = value
}

/* ── initApp — chamado por auth.js após injetar o HTML ── */
export function initApp() {
  stageWrapper     = document.getElementById("stage-wrapper")
  itemsLayer       = document.getElementById("items-layer")
  connectionsLayer = document.getElementById("connections-layer")
  colPieces        = document.getElementById("col-pieces")
  colBases         = document.getElementById("col-bases")
  trashEl          = document.getElementById("trash")
  stageBg          = document.getElementById("stage-bg")
  zoomSlider       = document.getElementById("zoom-slider")
  zoomLabel        = document.getElementById("zoom-label")
  labelEditor      = document.getElementById("label-editor")
  labelInput       = document.getElementById("label-input")

  labelInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") commitLabelEditor()
    else if (evt.key === "Escape") hideLabelEditor()
  })
  labelInput.addEventListener("blur", () => commitLabelEditor())

  let lastPointerPos = { x: -1, y: -1 }
  stageWrapper.addEventListener("pointermove", (evt) => { lastPointerPos = stagePointFromEvent(evt) })

  document.addEventListener("keydown", (evt) => {
    if (document.activeElement === labelInput) return
    if (evt.key === "Delete" || evt.key === "Backspace") {
      if (selectedConnectionId !== null) { removeConnection(selectedConnectionId); return }
      const piece = findPieceAt(lastPointerPos)
      if (piece) { removePiece(piece.id); return }
      const base = findBaseAt(lastPointerPos)
      if (base) removeBase(base.id)
    } else if (evt.key === "Escape") {
      connectSourceId = null
      for (const p of pieces.values()) updatePieceVisual(p)
    }
  })

  stageWrapper.addEventListener("pointerdown", (evt) => {
    if (evt.target === stageWrapper || evt.target === itemsLayer || evt.target.id === "stage-bg-container") {
      selectedConnectionId = null; renderConnectionsStyle()
    }
  })

  zoomSlider.addEventListener("input", () => applyZoom(Number(zoomSlider.value)))
  document.getElementById("zoom-minus").addEventListener("click", () => {
    applyZoom(clamp(Number(zoomSlider.value) - 10, 50, 250))
  })
  document.getElementById("zoom-plus").addEventListener("click", () => {
    applyZoom(clamp(Number(zoomSlider.value) + 10, 50, 250))
  })

  document.getElementById("btn-save").addEventListener("click", () => {
    const data = serializeSession()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "sessao.json"
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  })

  document.getElementById("load-input").addEventListener("change", (evt) => {
    const file = evt.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { loadSessionData(JSON.parse(reader.result)) }
      catch { alert("Arquivo de sessao invalido.") }
    }
    reader.readAsText(file)
    evt.target.value = ""
  })

  buildPalette()
  applyZoom(100)
  requestAnimationFrame(() => requestAnimationFrame(loadDefaultLayout))
}

function loadDefaultLayout() {
  const w = stageWrapper.clientWidth
  const h = stageWrapper.clientHeight
  const cx = w / 2
  const cy = h / 2

  // Arco esquerdo: prismas (topo), cubos (meio), cilindros (base)
  // Arco direito: espelho do esquerdo
  const defaults = [
    // --- Lado esquerdo ---
    // Prismas (topo-esquerdo)
    { shape: 'prisma',   size: 'P', dx: -0.20, dy: -0.38 },
    { shape: 'prisma',   size: 'M', dx: -0.30, dy: -0.28 },
    { shape: 'prisma',   size: 'G', dx: -0.38, dy: -0.17 },
    // Cubos (meio-esquerdo)
    { shape: 'cubo',     size: 'P', dx: -0.41, dy: -0.04 },
    { shape: 'cubo',     size: 'M', dx: -0.41, dy:  0.09 },
    { shape: 'cubo',     size: 'G', dx: -0.37, dy:  0.21 },
    // Cilindros (base-esquerdo)
    { shape: 'cilindro', size: 'P', dx: -0.28, dy:  0.31 },
    { shape: 'cilindro', size: 'M', dx: -0.18, dy:  0.37 },
    { shape: 'cilindro', size: 'G', dx: -0.07, dy:  0.40 },

    // --- Lado direito (espelho) ---
    // Prismas (topo-direito)
    { shape: 'prisma',   size: 'P', dx:  0.20, dy: -0.38 },
    { shape: 'prisma',   size: 'M', dx:  0.30, dy: -0.28 },
    { shape: 'prisma',   size: 'G', dx:  0.38, dy: -0.17 },
    // Cubos (meio-direito)
    { shape: 'cubo',     size: 'P', dx:  0.41, dy: -0.04 },
    { shape: 'cubo',     size: 'M', dx:  0.41, dy:  0.09 },
    { shape: 'cubo',     size: 'G', dx:  0.37, dy:  0.21 },
    // Cilindros (base-direito)
    { shape: 'cilindro', size: 'P', dx:  0.28, dy:  0.31 },
    { shape: 'cilindro', size: 'M', dx:  0.18, dy:  0.37 },
    { shape: 'cilindro', size: 'G', dx:  0.07, dy:  0.40 },
  ]

  for (const p of defaults) {
    createPiece(p.shape, p.size, cx + p.dx * w, cy + p.dy * h)
  }
}

function findPieceAt(point) {
  for (const piece of pieces.values()) {
    if (Math.hypot(point.x - piece.x, point.y - piece.y) <= piece.radius) return piece
  }
  return null
}

function findBaseAt(point) {
  for (const base of bases.values()) {
    const dx = point.x - base.x
    const dy = (point.y - base.y) * 2
    if (Math.hypot(dx, dy) <= base.radius) return base
  }
  return null
}
