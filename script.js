/* ---------- Lista COMPLETA de teclas del teclado ---------- */
const KEY_LIST = [
  {g:'Especiales',k:['Space','Enter','Shift','Control','Alt','Tab','Escape','Backspace','Delete','Insert','Home','End','PageUp','PageDown','CapsLock']},
  {g:'Flechas',k:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']},
  {g:'Letras',k:'abcdefghijklmnopqrstuvwxyz'.split('')},
  {g:'Mayúsculas',k:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')},
  {g:'Números',k:'0123456789'.split('')},
  {g:'Símbolos',k:['-','=','[',']','\\',';',"'",',','.','/','`','!','@','#','$','%','^','&','*','(',')','_','+','{','}','|',':','"','<','>','?','~']},
  {g:'Numpad',k:['Numpad0','Numpad1','Numpad2','Numpad3','Numpad4','Numpad5','Numpad6','Numpad7','Numpad8','Numpad9','NumpadAdd','NumpadSubtract','NumpadMultiply','NumpadDivide','NumpadEnter','NumpadDecimal']},
  {g:'Función',k:Array.from({length:12},(_,i)=>'F'+(i+1))},
];
function buildKeySelect(sel){
  sel.innerHTML='';
  KEY_LIST.forEach(grp=>{
    const og=document.createElement('optgroup');og.label=grp.g;
    grp.k.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k===' '?'(Espacio)':k;og.appendChild(o)});
    sel.appendChild(og);
  });
}
buildKeySelect(document.getElementById('keySelect'));
buildKeySelect(document.getElementById('keySelect2'));

/* ---------- Config + persistencia ---------- */
const STORE='swfPlayerCfg_v5';
const defaults = {
  positions:{},                          // legacy/compat (último modo guardado)
  positionsFS:{},                        // posiciones por id en modo PANTALLA COMPLETA
  positionsWin:{},                       // posiciones por id en modo VENTANA / VERTICAL
  sizes:{},                              // tamaño individual por id (1.0 = 100%)
  pad:[
    {key:'Space',label:'A'},{key:'z',label:'B'},{key:'x',label:'X'},
    {key:'c',label:'Y'},{key:'Enter',label:'⏎'},{key:'Shift',label:'⇧'}
  ],
  // botones extra añadidos por el usuario
  extraPad:[],
  arrows:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'},
  arrowLabels:{up:'▲',down:'▼',left:'◀',right:'▶',upLeft:'↖',upRight:'↗',downLeft:'↙',downRight:'↘'},
  // Diagonales: cada una dispara DOS teclas a la vez (combo).
  // Por defecto, las diagonales combinan las flechas cardinales correspondientes.
  arrowsDiag:{
    upLeft:   {key1:'ArrowUp',   key2:'ArrowLeft'},
    upRight:  {key1:'ArrowUp',   key2:'ArrowRight'},
    downLeft: {key1:'ArrowDown', key2:'ArrowLeft'},
    downRight:{key1:'ArrowDown', key2:'ArrowRight'}
  },
  cal:{sens:1,dz:15,diag:35,opacity:100,size:100},
  ctrlMode:'joy', hold:true, touchOn:true,
  theme:'dark',
  headerCollapsed:false,
  stretch:{on:false, w:100, h:60, zoom:100, scale:100, border:0, sideCrop:0},   // % del contenedor + zoom + escala + borde negro interno (%) + recorte lateral en fullscreen (%)
  quality:100   // Calidad gráfica del juego (0=pixeleado, 100=mejor calidad)
};
function cloneCfg(v){return JSON.parse(JSON.stringify(v))}
let cfg = load();
// 📐 Estirar pantalla: forzar SIEMPRE desactivado al refrescar la página.
// El usuario debe activarlo manualmente cada sesión; nunca debe quedar marcado
// tras un reload aunque se haya guardado en localStorage en una sesión previa.
if(cfg && cfg.stretch){ cfg.stretch.on = false; try{ save(); }catch{} }
function load(){
  try{const raw=localStorage.getItem(STORE);if(!raw)return cloneCfg(defaults);
    const merged=Object.assign(cloneCfg(defaults),JSON.parse(raw));
    if(!merged.arrowLabels)merged.arrowLabels=structuredClone(defaults.arrowLabels);
    // Asegurar etiquetas de diagonales si vienen de configs antiguas
    ['upLeft','upRight','downLeft','downRight'].forEach(d=>{
      if(!merged.arrowLabels[d]) merged.arrowLabels[d]=defaults.arrowLabels[d];
    });
    if(!merged.arrowsDiag||typeof merged.arrowsDiag!=='object'){
      merged.arrowsDiag=structuredClone(defaults.arrowsDiag);
    }else{
      ['upLeft','upRight','downLeft','downRight'].forEach(d=>{
        if(!merged.arrowsDiag[d]) merged.arrowsDiag[d]=structuredClone(defaults.arrowsDiag[d]);
      });
    }
    if(!merged.extraPad)merged.extraPad=[];
    if(!merged.sizes||typeof merged.sizes!=='object')merged.sizes={};
    if(typeof merged.cal.opacity!=='number')merged.cal.opacity=100;
    if(typeof merged.cal.size!=='number')merged.cal.size=100;
    if(!merged.theme)merged.theme='dark';
    if(typeof merged.headerCollapsed!=='boolean')merged.headerCollapsed=false;
    if(!merged.stretch||typeof merged.stretch!=='object')merged.stretch={on:false,w:100,h:60,zoom:100,scale:100,border:1};
    if(typeof merged.stretch.on!=='boolean')merged.stretch.on=false;
    if(typeof merged.stretch.w!=='number')merged.stretch.w=100;
    if(typeof merged.stretch.h!=='number')merged.stretch.h=60;
    if(typeof merged.stretch.zoom!=='number')merged.stretch.zoom=100;
    if(typeof merged.stretch.scale!=='number')merged.stretch.scale=100;
    if(typeof merged.stretch.border!=='number')merged.stretch.border=0;
    if(typeof merged.stretch.sideCrop!=='number')merged.stretch.sideCrop=0;
    if(typeof merged.quality!=='number')merged.quality=100;
    // Posiciones por modo (compat con configs antiguas que sólo tenían "positions")
    if(!merged.positionsFS||typeof merged.positionsFS!=='object') merged.positionsFS={};
    if(!merged.positionsWin||typeof merged.positionsWin!=='object') merged.positionsWin={};
    // Migración: si hay legacy "positions" pero no por-modo, copiarlas a "win"
    if(merged.positions && Object.keys(merged.positions).length){
      if(!Object.keys(merged.positionsWin).length){
        merged.positionsWin = JSON.parse(JSON.stringify(merged.positions));
      }
    }
    return merged;
  }catch{return cloneCfg(defaults)}
}
function save(){localStorage.setItem(STORE,JSON.stringify(cfg))}

/* ===== Helpers de posiciones por modo (Pantalla completa vs Ventana/Vertical) =====
   - El modo se decide por la clase 'fs-active' del body (la setea fullscreenchange).
   - Cada vez que se mueve, crea o reposiciona un botón táctil, guardamos su
     posición tanto en cfg.positions{FS|Win} (modo actual) como en cfg.positions
     (compat) para que el refresh restaure exactamente donde quedó. */
function _currentMode(){ return document.body.classList.contains('fs-active') ? 'fs' : 'win'; }
function _posStore(mode){
  if(!cfg.positionsFS) cfg.positionsFS={};
  if(!cfg.positionsWin) cfg.positionsWin={};
  return mode==='fs' ? cfg.positionsFS : cfg.positionsWin;
}
function _savePos(id,leftStr,topStr){
  if(!id) return;
  const m=_currentMode();
  _posStore(m)[id]={left:leftStr, top:topStr};
  if(!cfg.positions) cfg.positions={};
  cfg.positions[id]={left:leftStr, top:topStr};
}
function _delPos(id){
  if(!id) return;
  if(cfg.positions) delete cfg.positions[id];
  if(cfg.positionsFS) delete cfg.positionsFS[id];
  if(cfg.positionsWin) delete cfg.positionsWin[id];
}
/* Aplica al DOM las posiciones guardadas para el modo dado, proyectando
   "lado" (izquierda/derecha) para los botones que sólo existen en el modo opuesto.
   Esto permite que un botón creado en vertical aparezca al cambiar a fullscreen
   en el MISMO lado de la pantalla (izq/der), respetando la fracción Y. */
function _applyPositionsForMode(mode){
  const layer=document.getElementById('touchLayer'); if(!layer) return;
  const lr=layer.getBoundingClientRect();
  if(lr.width<=0||lr.height<=0) return;
  const target=_posStore(mode);
  const other =_posStore(mode==='fs'?'win':'fs');
  const els=Array.from(document.querySelectorAll('#touchLayer [data-id]'));
  els.forEach(el=>{
    if(el.id==='fsEditBtn') return;
    const id=el.dataset.id; if(!id) return;
    const w=el.offsetWidth||40, h=el.offsetHeight||40;
    const maxX=Math.max(0, lr.width-w);
    const maxY=Math.max(0, lr.height-h);
    let p=target[id];
    if(!p && other[id]){
      // Proyectar lado-aware desde el modo opuesto
      const lx=parseFloat(other[id].left)||0;
      const ly=parseFloat(other[id].top)||0;
      // Necesitamos las dimensiones que tenía el otro modo: usamos snapshot si existe
      const snap=_touchSnapshots[mode==='fs'?'win':'fs'];
      let oW=lr.width, oH=lr.height;
      if(snap && snap.__layer){ oW=snap.__layer.w||oW; oH=snap.__layer.h||oH; }
      const cx=lx + w/2;
      const fy=(ly+h/2)/Math.max(1,oH);
      const onRight = cx > oW/2;
      const nx = onRight ? maxX : 0;
      const ny = Math.min(Math.max(0, fy*lr.height - h/2), maxY);
      p={left:nx+'px', top:ny+'px'};
      target[id]=p; // memorizar la proyección
    }
    if(p){
      let x=parseFloat(p.left)||0, y=parseFloat(p.top)||0;
      x=Math.min(Math.max(0,x), maxX);
      y=Math.min(Math.max(0,y), maxY);
      el.style.left=x+'px';
      el.style.top =y+'px';
      el.style.right='auto';
      el.style.bottom='auto';
    }
  });
  try{ save(); }catch{}
}

/* ---------- Tema ---------- */
function applyTheme(){
  document.documentElement.setAttribute('data-theme',cfg.theme);
  document.getElementById('themeBtn').textContent = cfg.theme==='dark'?'🌙':'☀️';
}
document.getElementById('themeBtn').onclick=()=>{
  cfg.theme = cfg.theme==='dark'?'light':'dark';save();applyTheme();
};

/* ---------- Toggle ocultar/mostrar opciones del header ---------- */
function applyHeaderCollapsed(){
  document.querySelector('header').classList.toggle('collapsed',!!cfg.headerCollapsed);
  document.getElementById('toggleHeaderBtn').textContent = cfg.headerCollapsed?'👁️‍🗨️':'👁️';
  document.getElementById('toggleHeaderBtn').title = cfg.headerCollapsed?'Mostrar opciones':'Ocultar opciones';
}
document.getElementById('toggleHeaderBtn').onclick=()=>{
  cfg.headerCollapsed = !cfg.headerCollapsed;save();applyHeaderCollapsed();
};

/* ---------- Ruffle ---------- */
let ruffle, player, currentBlobUrl=null;
window.addEventListener('load',()=>{
  if(window.RufflePlayer){ruffle=window.RufflePlayer.newest()}
  applyTheme();
  applyConfig();
});
function mountPlayer(src){
  if(!ruffle){alert('Ruffle aún no carga, intenta de nuevo');return}
  const stage=document.getElementById('player');
  stage.innerHTML='';
  document.getElementById('emptyMsg').style.display='none';
  player=ruffle.createPlayer();
  player.style.width='100%';player.style.height='100%';
  stage.appendChild(player);
  player.load({url:src,autoplay:'on'});
  // Aplicar calidad gráfica configurada al nuevo player
  try{ if(typeof applyQuality==='function') setTimeout(applyQuality, 50); }catch{}
  // Resetear etiqueta del botón Detener
  const sb=document.getElementById('stopBtn');
  if(sb){ sb.textContent='⏹ Detener'; sb.dataset.state=''; }
  const fsStopBtn=document.querySelector('#fsEditMenu button[data-act="stop"]');
  if(fsStopBtn) fsStopBtn.textContent='⏹ Detener';
}
document.getElementById('fileInput').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  if(currentBlobUrl)URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl=URL.createObjectURL(f);mountPlayer(currentBlobUrl);
};
document.getElementById('loadUrlBtn').onclick=()=>{
  const u=document.getElementById('urlInput').value.trim();if(u)mountPlayer(u);
};
document.getElementById('pauseBtn').onclick=()=>{
  if(!player)return;
  const pb=document.getElementById('pauseBtn');
  try{
    if(player.isPlaying){
      player.pause();
      pb.textContent='▶ Reanudar';
    }else{
      player.play();
      pb.textContent='⏸ Pausa';
    }
  }catch{
    try{player.play?.(); pb.textContent='⏸ Pausa';}catch{}
  }
};
document.getElementById('stopBtn').onclick=()=>{
  const sb=document.getElementById('stopBtn');
  const fsStopBtn=document.querySelector('#fsEditMenu button[data-act="stop"]');
  if(!player)return;
  try{player.remove?.()}catch{}
  document.getElementById('player').innerHTML='';
  // No revocamos el blob aquí para permitir recargar con ⟳
  document.getElementById('emptyMsg').style.display='flex';
  player=null;
  document.getElementById('pauseBtn').textContent='⏸ Pausa';
  // El botón Detener mantiene SIEMPRE su etiqueta
  sb.textContent='⏹ Detener';
  sb.dataset.state='';
  if(fsStopBtn) fsStopBtn.textContent='⏹ Detener';
};
document.getElementById('reloadBtn').onclick=()=>{
  const u=currentBlobUrl||document.getElementById('urlInput').value.trim();
  if(u){ mountPlayer(u); document.getElementById('pauseBtn').textContent='⏸ Pausa'; }
};

/* ---------- Pantalla completa con landscape forzado ---------- */
document.getElementById('fsBtn').onclick=async()=>{
  const s=document.getElementById('stage');
  if(!document.fullscreenElement){
    try{await s.requestFullscreen?.()}catch{}
    try{await screen.orientation?.lock?.('landscape')}catch{}
  }else{
    try{await document.exitFullscreen?.()}catch{}
    try{screen.orientation?.unlock?.()}catch{}
  }
};
document.addEventListener('fullscreenchange',()=>{
  const fs=!!document.fullscreenElement;
  // Antes de cambiar de modo, guardamos un snapshot (en memoria) Y persistimos
  // las posiciones actuales del modo que estamos abandonando en cfg.positions{FS|Win}.
  const oldMode=document.body.classList.contains('fs-active')?'fs':'win';
  try{ saveTouchPositionsSnapshot(oldMode); }catch{}
  try{
    const store=_posStore(oldMode);
    _allTouchEls().forEach(el=>{
      const id=el.dataset.id; if(!id||el.id==='fsEditBtn') return;
      if(el.style.left && el.style.top){
        store[id]={left:el.style.left, top:el.style.top};
      }
    });
    save();
  }catch{}
  document.body.classList.toggle('fs-active',fs);
  // Detectar si necesitamos rotar manualmente (portrait)
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  document.body.classList.toggle('fs-rotated', fs && isPortrait);
  // Recalcular recorte lateral (depende de fullscreen y window.innerWidth)
  try{ applySideCrop(); }catch{}
  // Mover la barra de estiramiento dentro/fuera del stage para que sea visible en fullscreen
  const sb=document.getElementById('stretchBar');
  const stage=document.getElementById('stage');
  const fsEditB=document.getElementById('fsEditBtn');
  const tLayer=document.getElementById('touchLayer');
  if(sb && stage){
    if(fs){ stage.appendChild(sb); }
    else if(sb.parentElement===stage){ stage.parentElement.insertBefore(sb, stage.nextSibling); }
  }
  // Mover el botón flotante "Editar" dentro del stage en fullscreen para que
  // sea visible (los position:fixed fuera del elemento fullscreen no se ven).
  if(fsEditB && stage){
    if(fs){ stage.appendChild(fsEditB); }
    else if(fsEditB.parentElement===stage){ document.body.appendChild(fsEditB); }
  }
  // Mover también el menú desplegable del botón ✏️
  const fsEditM=document.getElementById('fsEditMenu');
  if(fsEditM && stage){
    if(fs){ stage.appendChild(fsEditM); }
    else {
      if(fsEditM.parentElement===stage) document.body.appendChild(fsEditM);
      fsEditM.classList.remove('on');
      fsEditM.setAttribute('aria-hidden','true');
    }
  }
  // Mover también la capa táctil dentro del stage en fullscreen para que los
  // botones táctiles sean visibles tanto en PC como en móvil.
  if(tLayer && stage){
    if(fs){ stage.appendChild(tLayer); }
    else if(tLayer.parentElement===stage){ document.body.appendChild(tLayer); }
  }
  // Mover modal de mapeo, calibración, volumen y popover de tamaño dentro del stage en fullscreen,
  // así Calibrar, Volumen y Editar (mover/redimensionar/mapear cada botón individualmente)
  // funcionan también desde pantalla completa.
  const mapM=document.getElementById('mapModal');
  const setM=document.getElementById('settingsModal');
  const volM=document.getElementById('volumeModal');
  const sizeP=document.getElementById('sizePop');
  const qualM=document.getElementById('qualityModal');
  [mapM,setM,volM,sizeP,qualM].forEach(node=>{
    if(!node||!stage) return;
    if(fs){ stage.appendChild(node); }
    else {
      // Al salir de fullscreen, SIEMPRE devolver al body y cerrar para
      // garantizar que ningún overlay invisible bloquee clicks en PC.
      if(node.parentElement!==document.body) document.body.appendChild(node);
      node.classList.remove('on');
    }
  });
  // Tras reubicar el #touchLayer dentro/fuera del stage, restauramos snapshot del
  // nuevo modo (si existe) y luego forzamos un clamp para asegurar que TODOS los
  // botones táctiles queden dentro de la pantalla visible. Damos varios intentos
  // porque el reflow de fullscreen + rotación puede tardar.
  const newMode = fs?'fs':'win';
  const _doFix=()=>{
    // 1) Restaurar snapshot en memoria (rápido)
    try{ restoreTouchPositionsSnapshot(newMode); }catch{}
    // 2) Aplicar posiciones persistidas para el modo nuevo, proyectando lado-aware
    //    los botones que sólo existían en el modo opuesto.
    try{ _applyPositionsForMode(newMode); }catch{}
    // 3) Reordenar flechas en cruz 3x3 SOLO si están activas y NINGUNA flecha
    //    tiene posición disponible (ni guardada para este modo, ni proyectada
    //    desde el modo opuesto). De lo contrario, respetamos la ubicación
    //    elegida por el usuario (p.ej. esquina inferior derecha en vertical
    //    debe mantenerse al pasar a pantalla completa).
    try{
      if(typeof relayoutArrows==='function' && (cfg.ctrlMode==='arrows'||cfg.ctrlMode==='arrows8')){
        const arrowIds=['arr-up','arr-down','arr-left','arr-right',
          'arr-upleft','arr-upright','arr-downleft','arr-downright'];
        const store=_posStore(newMode);
        const otherStore=_posStore(newMode==='fs'?'win':'fs');
        const isArrows8=cfg.ctrlMode==='arrows8';
        const activeIds = isArrows8 ? arrowIds : arrowIds.slice(0,4);
        const hasAny = activeIds.some(id=>store[id]||otherStore[id]);
        if(!hasAny){ relayoutArrows(isArrows8); }
      }
    }catch{}
    // 4) Clamp final por si algo quedó fuera de la pantalla visible
    try{ clampTouchControlsToViewport(); }catch{}
  };
  _doFix();
  setTimeout(_doFix, 80);
  setTimeout(_doFix, 250);
  setTimeout(_doFix, 600);
});

/* ===== Mantener botones táctiles dentro de la pantalla al cambiar de
   fullscreen <-> vertical / rotación / resize.
   - Guarda un snapshot por modo ('fs' fullscreen, 'win' ventana normal) para
     que al volver a fullscreen se recuperen las posiciones originales.
   - Si un botón quedaría fuera del área visible del #touchLayer, lo recorta
     (clamp) al borde más cercano sin tocar la posición original guardada en
     cfg.positions del modo opuesto. */
const _touchSnapshots = { fs:null, win:null };
function _allTouchEls(){
  return Array.from(document.querySelectorAll('#touchLayer .floating, #touchLayer .ab, #touchLayer .pbtn'));
}
function saveTouchPositionsSnapshot(mode){
  const snap={};
  _allTouchEls().forEach(el=>{
    const id=el.dataset.id||el.id; if(!id) return;
    snap[id]={ left:el.style.left||'', top:el.style.top||'', right:el.style.right||'', bottom:el.style.bottom||'' };
  });
  // Guardar también dimensiones del layer para proyección lado-aware
  const layer=document.getElementById('touchLayer');
  if(layer){
    const lr=layer.getBoundingClientRect();
    snap.__layer={ w:lr.width, h:lr.height };
  }
  _touchSnapshots[mode]=snap;
}
function restoreTouchPositionsSnapshot(mode){
  const snap=_touchSnapshots[mode]; if(!snap) return;
  _allTouchEls().forEach(el=>{
    const id=el.dataset.id||el.id; if(!id) return;
    const p=snap[id]; if(!p) return;
    el.style.left=p.left; el.style.top=p.top;
    el.style.right=p.right; el.style.bottom=p.bottom;
  });
}
/* Devuelve el rectángulo (relativo a #touchLayer) que ocupa el botón
   flotante ✏️ (#fsEditBtn) cuando es visible (sólo en pantalla completa).
   Usado para evitar que los botones táctiles se coloquen DEBAJO del ✏️. */
function _fsEditReservedRect(){
  const fb=document.getElementById('fsEditBtn');
  const layer=document.getElementById('touchLayer');
  if(!fb||!layer) return null;
  const cs=getComputedStyle(fb);
  if(cs.display==='none'||cs.visibility==='hidden') return null;
  const r=fb.getBoundingClientRect();
  if(r.width<=0||r.height<=0) return null;
  const lr=layer.getBoundingClientRect();
  const PAD=8;
  return {
    x: r.left - lr.left - PAD,
    y: r.top  - lr.top  - PAD,
    w: r.width  + PAD*2,
    h: r.height + PAD*2
  };
}
function _rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){
  return !(ax+aw<=bx || bx+bw<=ax || ay+ah<=by || by+bh<=ay);
}
function clampTouchControlsToViewport(){
  const layer=document.getElementById('touchLayer'); if(!layer) return;
  const lr=layer.getBoundingClientRect();
  if(lr.width<=0||lr.height<=0) return;
  const reserved=_fsEditReservedRect();
  let changed=false;
  _allTouchEls().forEach(el=>{
    if(el.id==='fsEditBtn') return; // nunca mover el propio botón flotante
    if(el.offsetParent===null && getComputedStyle(el).display==='none') return;
    const r=el.getBoundingClientRect();
    const w=r.width||el.offsetWidth||40;
    const h=r.height||el.offsetHeight||40;
    // posición relativa al layer
    let x=r.left-lr.left;
    let y=r.top-lr.top;
    const maxX=Math.max(0, lr.width  - w);
    const maxY=Math.max(0, lr.height - h);
    let nx=Math.min(Math.max(0,x), maxX);
    let ny=Math.min(Math.max(0,y), maxY);
    // Evitar la zona reservada del botón ✏️ en fullscreen
    if(reserved && _rectsOverlap(nx,ny,w,h,reserved.x,reserved.y,reserved.w,reserved.h)){
      // Empuja hacia abajo del ✏️ si cabe; si no, hacia la derecha
      const downY = reserved.y + reserved.h;
      const rightX = reserved.x + reserved.w;
      if(downY + h <= lr.height) ny = Math.min(downY, maxY);
      else if(rightX + w <= lr.width) nx = Math.min(rightX, maxX);
      else ny = Math.min(downY, maxY);
    }
    if(nx!==x || ny!==y){
      el.style.left=nx+'px';
      el.style.top =ny+'px';
      el.style.right='auto';
      el.style.bottom='auto';
      changed=true;
      // Persistir la posición corregida para que el próximo refresh
      // NO vuelva a producir el "salto" — se queda donde está ahora.
      const id=el.dataset.id;
      if(id){
        _savePos(id, el.style.left, el.style.top);
      }
    }
  });
  if(changed){ try{ save(); }catch{} }
}
// Reaccionar también a resize y rotación (no sólo a fullscreenchange)
window.addEventListener('resize',()=>{ clearTimeout(window._clampT); window._clampT=setTimeout(clampTouchControlsToViewport, 120); });
window.addEventListener('orientationchange',()=>{ setTimeout(clampTouchControlsToViewport, 250); setTimeout(clampTouchControlsToViewport, 600); });
// Clamp inicial tras la primera estabilización del layout para evitar el
// "salto" visible al refrescar la página: aplicamos las posiciones guardadas
// y, si alguna queda fuera del viewport actual, la recolocamos UNA vez y la
// guardamos, así la próxima recarga ya parte de una posición estable.
window.addEventListener('load',()=>{
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    try{ clampTouchControlsToViewport(); }catch{}
  }));
});


/* ---------- Envío de teclas ---------- */
/* Mapa robusto de key -> {code, keyCode}.
   Ruffle y muchos juegos Flash/HTML5 antiguos NO leen e.key sino e.code o e.keyCode.
   Por eso "Space" táctil no se reconocía: hay que enviar code:"Space" y keyCode:32. */
const KEYMAP = {
  ' ':       {code:'Space',     keyCode:32,  key:' '},
  'Space':   {code:'Space',     keyCode:32,  key:' '},
  'Enter':   {code:'Enter',     keyCode:13,  key:'Enter'},
  'Tab':     {code:'Tab',       keyCode:9,   key:'Tab'},
  'Escape':  {code:'Escape',    keyCode:27,  key:'Escape'},
  'Backspace':{code:'Backspace',keyCode:8,   key:'Backspace'},
  'Delete':  {code:'Delete',    keyCode:46,  key:'Delete'},
  'Insert':  {code:'Insert',    keyCode:45,  key:'Insert'},
  'Home':    {code:'Home',      keyCode:36,  key:'Home'},
  'End':     {code:'End',       keyCode:35,  key:'End'},
  'PageUp':  {code:'PageUp',    keyCode:33,  key:'PageUp'},
  'PageDown':{code:'PageDown',  keyCode:34,  key:'PageDown'},
  'CapsLock':{code:'CapsLock',  keyCode:20,  key:'CapsLock'},
  'Shift':   {code:'ShiftLeft', keyCode:16,  key:'Shift'},
  'Control': {code:'ControlLeft',keyCode:17, key:'Control'},
  'Alt':     {code:'AltLeft',   keyCode:18,  key:'Alt'},
  'ArrowUp':   {code:'ArrowUp',   keyCode:38, key:'ArrowUp'},
  'ArrowDown': {code:'ArrowDown', keyCode:40, key:'ArrowDown'},
  'ArrowLeft': {code:'ArrowLeft', keyCode:37, key:'ArrowLeft'},
  'ArrowRight':{code:'ArrowRight',keyCode:39, key:'ArrowRight'},
};
function resolveKey(k){
  if(!k) return null;
  if(KEYMAP[k]) return KEYMAP[k];
  // F1..F24
  const fm=/^F(\d{1,2})$/.exec(k);
  if(fm){const n=+fm[1]; return {code:'F'+n, keyCode:111+n, key:k}}
  // Numpad0..Numpad9 / NumpadEnter / NumpadAdd ...
  if(/^Numpad\d$/.test(k)){const d=+k.slice(6); return {code:k, keyCode:96+d, key:String(d)}}
  if(k==='NumpadEnter')   return {code:k, keyCode:13,  key:'Enter'};
  if(k==='NumpadAdd')     return {code:k, keyCode:107, key:'+'};
  if(k==='NumpadSubtract')return {code:k, keyCode:109, key:'-'};
  if(k==='NumpadMultiply')return {code:k, keyCode:106, key:'*'};
  if(k==='NumpadDivide')  return {code:k, keyCode:111, key:'/'};
  if(k==='NumpadDecimal') return {code:k, keyCode:110, key:'.'};
  // Letra única (a-z, A-Z)
  if(k.length===1){
    const ch=k;
    const upper=ch.toUpperCase();
    if(/[A-Z]/.test(upper)) return {code:'Key'+upper, keyCode:upper.charCodeAt(0), key:ch};
    if(/[0-9]/.test(ch))    return {code:'Digit'+ch,  keyCode:ch.charCodeAt(0),    key:ch};
    // Símbolos comunes
    const SYM={
      '-':{code:'Minus',keyCode:189},'=':{code:'Equal',keyCode:187},
      '[':{code:'BracketLeft',keyCode:219},']':{code:'BracketRight',keyCode:221},
      '\\':{code:'Backslash',keyCode:220},';':{code:'Semicolon',keyCode:186},
      "'":{code:'Quote',keyCode:222},',':{code:'Comma',keyCode:188},
      '.':{code:'Period',keyCode:190},'/':{code:'Slash',keyCode:191},
      '`':{code:'Backquote',keyCode:192}
    };
    if(SYM[ch]) return {code:SYM[ch].code, keyCode:SYM[ch].keyCode, key:ch};
    // Fallback: usar charCode
    return {code:'Key'+upper, keyCode:ch.charCodeAt(0), key:ch};
  }
  // Fallback genérico
  return {code:k, keyCode:0, key:k};
}
function sendKey(type,k){
  const info=resolveKey(k); if(!info) return;
  const init={
    key: info.key, code: info.code,
    keyCode: info.keyCode, which: info.keyCode, charCode: type==='keypress'?info.keyCode:0,
    bubbles:true, cancelable:true, composed:true,
    location:0, repeat:false,
    view: window
  };
  // Disparamos en MÚLTIPLES targets — Ruffle escucha en su propio elemento;
  // algunos juegos escuchan en window/document/body.
  const targets=[];
  if(player) targets.push(player);
  // Ruffle expone un shadowRoot con un <canvas>; intentamos también
  if(player&&player.shadowRoot){
    const c=player.shadowRoot.querySelector('canvas');
    if(c) targets.push(c);
  }
  targets.push(window, document, document.body);
  for(const t of targets){
    try{ t.dispatchEvent(new KeyboardEvent(type, init)); }catch{}
  }
}
const heldKeys=new Set();
function press(k){if(!k)return;if(heldKeys.has(k))return;heldKeys.add(k);sendKey('keydown',k)}
function release(k){if(!k)return;if(!heldKeys.has(k))return;heldKeys.delete(k);sendKey('keyup',k)}
function releaseAll(){[...heldKeys].forEach(release)}

/* ---------- Joystick ---------- */
const joy=document.getElementById('joy'),stick=document.getElementById('stick');
let joyActive=false,joyId=null,joyCenter={x:0,y:0},lastDirs=new Set();
function joyStart(e){
  if(document.body.classList.contains('editing'))return;
  joyActive=true;
  const t=e.touches?e.touches[0]:e;joyId=e.touches?t.identifier:null;
  const r=joy.getBoundingClientRect();joyCenter={x:r.left+r.width/2,y:r.top+r.height/2};
  joyMove(e);
}
function joyMove(e){
  if(!joyActive)return;
  let t;
  if(e.touches){t=[...e.touches].find(x=>x.identifier===joyId);if(!t)return}else t=e;
  let dx=t.clientX-joyCenter.x,dy=t.clientY-joyCenter.y;
  const max=50,d=Math.hypot(dx,dy);
  if(d>max){dx=dx/d*max;dy=dy/d*max}
  stick.style.transform=`translate(${dx}px,${dy}px)`;
  const dzPx=max*(cfg.cal.dz/100), diagPx=max*(cfg.cal.diag/100);
  const ax=Math.abs(dx)*cfg.cal.sens, ay=Math.abs(dy)*cfg.cal.sens;
  const newDirs=new Set();
  if(d>dzPx){
    if(ay>diagPx){newDirs.add(dy<0?'up':'down')}
    if(ax>diagPx){newDirs.add(dx<0?'left':'right')}
  }
  lastDirs.forEach(d=>{if(!newDirs.has(d))release(cfg.arrows[d])});
  newDirs.forEach(d=>{if(cfg.hold||!lastDirs.has(d))press(cfg.arrows[d])});
  if(!cfg.hold){setTimeout(()=>newDirs.forEach(d=>release(cfg.arrows[d])),50)}
  lastDirs=newDirs;
}
function joyEnd(){
  joyActive=false;joyId=null;
  stick.style.transform='translate(0,0)';
  lastDirs.forEach(d=>release(cfg.arrows[d]));lastDirs.clear();
}
joy.addEventListener('touchstart',joyStart,{passive:true});
joy.addEventListener('touchmove',joyMove,{passive:true});
joy.addEventListener('touchend',joyEnd);
joy.addEventListener('touchcancel',joyEnd);
joy.addEventListener('mousedown',e=>{joyStart(e);
  const mm=e=>joyMove(e),mu=()=>{joyEnd();window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',mu)};
  window.addEventListener('mousemove',mm);window.addEventListener('mouseup',mu);
});

/* ---------- En modo edición: clic en joystick abre popover de tamaño ---------- */
joy.addEventListener('click',e=>{
  if(!editChk.checked)return;
  if(joy._wasMoved&&joy._wasMoved())return;
  // Determinar dirección clickeada (para botón ⌨️ del popover)
  const r=joy.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const dx=e.clientX-cx, dy=e.clientY-cy;
  let dir;
  if(Math.abs(dx)>Math.abs(dy)) dir = dx<0?'left':'right';
  else dir = dy<0?'up':'down';
  openSizePop(joy,'joy',{kind:'arrow',dir,el:null,fromJoy:true});
});

/* ---------- Botones (pad + arrows) - presión ---------- */
function bindButton(el,getKey){
  let active=false;
  let heldKeys=[];
  const _resolve=()=>{
    const k=getKey();
    if(Array.isArray(k)) return k.filter(Boolean);
    return k?[k]:[];
  };
  const down=e=>{
    if(document.body.classList.contains('editing'))return;
    e.preventDefault();active=true;
    el.classList.add('is-pressed');
    heldKeys=_resolve();
    heldKeys.forEach(k=>press(k));
  };
  const up=e=>{
    if(!active)return;active=false;e.preventDefault?.();
    el.classList.remove('is-pressed');
    heldKeys.forEach(k=>release(k));
    heldKeys=[];
  };
  el.addEventListener('touchstart',down,{passive:false});
  el.addEventListener('touchend',up);el.addEventListener('touchcancel',up);
  el.addEventListener('mousedown',down);el.addEventListener('mouseup',up);el.addEventListener('mouseleave',up);
}

/* ---------- Renderizado dinámico del pad (incluye extras) ---------- */
function renderPad(){
  const pad=document.getElementById('pad');
  pad.innerHTML='';
  // Botones por defecto
  cfg.pad.forEach((b,i)=>{
    const el=document.createElement('div');
    el.className='pbtn';
    const id='pad-'+i;
    el.dataset.id=id;
    el.dataset.kind='pad';
    el.dataset.i=i;
    el.textContent=b.label;
    // Posición inicial por defecto si no hay guardada
    const defaults=[
      {right:'74px',bottom:'140px'},{right:'14px',bottom:'140px'},{right:'134px',bottom:'80px'},
      {right:'74px',bottom:'80px'},{right:'14px',bottom:'80px'},{right:'74px',bottom:'20px'}
    ];
    const dpos=defaults[i]||{right:'14px',bottom:'20px'};
    Object.assign(el.style,dpos);
    // Badge eliminar (también para botones por defecto). El joystick NO tiene badge.
    const x=document.createElement('div');
    x.className='delBadge';x.textContent='×';
    x.onclick=ev=>{
      ev.stopPropagation();
      if(!confirm('¿Eliminar este botón?'))return;
      cfg.pad.splice(i,1);
      _delPos(id);
      // Reindexar posiciones guardadas pad-N posteriores
      const newPos={};
      Object.entries(cfg.positions).forEach(([k,v])=>{
        const m=k.match(/^pad-(\d+)$/);
        if(m){const n=+m[1]; if(n>i) newPos['pad-'+(n-1)]=v; else newPos[k]=v;}
        else newPos[k]=v;
      });
      cfg.positions=newPos;
      save();renderPad();applyConfig();
    };
    el.appendChild(x);
    pad.appendChild(el);
  });
  // Botones extra
  cfg.extraPad.forEach((b,i)=>{
    const el=document.createElement('div');
    el.className='pbtn';
    const id='extra-'+b.id;
    el.dataset.id=id;
    el.dataset.kind='extra';
    el.dataset.extraId=b.id;
    el.textContent=b.label;
    el.style.right='14px';
    el.style.bottom=(20+i*60)+'px';
    // Badge eliminar
    const x=document.createElement('div');
    x.className='delBadge';x.textContent='×';
    x.onclick=ev=>{
      ev.stopPropagation();
      if(!confirm('¿Eliminar este botón?'))return;
      cfg.extraPad=cfg.extraPad.filter(p=>p.id!==b.id);
      _delPos(id);
      save();renderPad();applyConfig();
    };
    el.appendChild(x);
    pad.appendChild(el);
  });
  // Bindear
  pad.querySelectorAll('.pbtn').forEach(b=>{
    if(b.dataset.kind==='pad'){
      bindButton(b,()=>{
        const p=cfg.pad[+b.dataset.i];
        return p?.key2 ? [p.key, p.key2] : p?.key;
      });
      b.addEventListener('click',()=>{
        if(!editChk.checked)return;
        if(b._wasMoved&&b._wasMoved())return;
        openSizePop(b,b.dataset.id,{kind:'pad',i:+b.dataset.i,el:b});
      });
    }else{
      bindButton(b,()=>{
        const x=cfg.extraPad.find(p=>p.id===b.dataset.extraId);
        if(!x) return null;
        return x.key2 ? [x.key, x.key2] : x.key;
      });
      b.addEventListener('click',()=>{
        if(!editChk.checked)return;
        if(b._wasMoved&&b._wasMoved())return;
        openSizePop(b,b.dataset.id,{kind:'extra',extraId:b.dataset.extraId,el:b});
      });
    }
    makeDraggable(b);
  });
}

/* ---------- Modo edición + arrastre INDIVIDUAL ---------- */
const editChk=document.getElementById('editMode');
editChk.onchange=()=>document.body.classList.toggle('editing',editChk.checked);

function makeDraggable(el){
  let dragging=false,moved=false,sx=0,sy=0,ox=0,oy=0;
  // El contenedor posicional REAL siempre es #touchLayer (los .ab/.pbtn están
  // dentro de .arrows/.pad que NO tienen position, por lo que el position:
  // absolute resuelve contra #touchLayer). Usamos siempre éste para que el
  // botón se pueda mover por TODA la pantalla (vertical y fullscreen).
  const _container=()=>document.getElementById('touchLayer')||el.parentElement;
  const start=e=>{
    if(!editChk.checked)return;
    // No iniciar drag si se tocó el badge eliminar
    if(e.target.classList.contains('delBadge'))return;
    const t=e.touches?e.touches[0]:e;
    dragging=true;moved=false;sx=t.clientX;sy=t.clientY;
    const r=el.getBoundingClientRect();
    const pr=_container().getBoundingClientRect();
    ox=r.left-pr.left;oy=r.top-pr.top;
    el.style.left=ox+'px';el.style.top=oy+'px';el.style.bottom='auto';el.style.right='auto';
    e.preventDefault?.();e.stopPropagation?.();
  };
  const move=e=>{
    if(!dragging)return;
    const t=e.touches?e.touches[0]:e;
    const dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>3||Math.abs(dy)>3)moved=true;
    let nx=ox+dx, ny=oy+dy;
    // Clamp en vivo contra TODA la pantalla (touchLayer fullscreen): el botón
    // nunca puede salir de los bordes pero puede ir a CUALQUIER posición de
    // la pantalla, vertical, horizontal o fullscreen.
    const c=_container();
    if(c){
      const pr=c.getBoundingClientRect();
      const w=el.offsetWidth||40, h=el.offsetHeight||40;
      const maxX=Math.max(0, pr.width  - w);
      const maxY=Math.max(0, pr.height - h);
      if(nx<0)nx=0; else if(nx>maxX)nx=maxX;
      if(ny<0)ny=0; else if(ny>maxY)ny=maxY;
    }
    el.style.left=nx+'px';el.style.top=ny+'px';
  };
  const end=()=>{
    if(!dragging)return;dragging=false;
    if(moved){
      // Si el botón quedó sobre la zona reservada del ✏️ (fullscreen),
      // empujarlo fuera antes de guardar.
      const reserved=_fsEditReservedRect && _fsEditReservedRect();
      if(reserved){
        const c=_container();
        const pr=c.getBoundingClientRect();
        const w=el.offsetWidth||40, h=el.offsetHeight||40;
        let nx=parseFloat(el.style.left)||0, ny=parseFloat(el.style.top)||0;
        if(_rectsOverlap(nx,ny,w,h,reserved.x,reserved.y,reserved.w,reserved.h)){
          const downY=reserved.y+reserved.h, rightX=reserved.x+reserved.w;
          const maxY=Math.max(0, pr.height-h), maxX=Math.max(0, pr.width-w);
          if(downY+h<=pr.height) ny=Math.min(downY,maxY);
          else if(rightX+w<=pr.width) nx=Math.min(rightX,maxX);
          el.style.left=nx+'px'; el.style.top=ny+'px';
        }
      }
      _savePos(el.dataset.id, el.style.left, el.style.top); save();
    }
  };
  el.addEventListener('touchstart',start,{passive:false});
  el.addEventListener('touchmove',move,{passive:false});
  el.addEventListener('touchend',end);
  el.addEventListener('mousedown',start);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',end);
  el._wasMoved=()=>moved;
}
// Joystick + cada flecha = movibles
makeDraggable(joy);

/* Bind especial para flechas diagonales: pulsan DOS teclas a la vez (combo). */
const _heldDiag = new Map(); // dir -> [k1,k2] activos
function bindDiagButton(el){
  const dir = el.dataset.dir;
  let active=false;
  const down=e=>{
    if(document.body.classList.contains('editing'))return;
    e.preventDefault?.(); active=true;
    el.classList.add('is-pressed');
    const d = cfg.arrowsDiag?.[dir];
    if(!d) return;
    const keys=[d.key1,d.key2].filter(Boolean);
    _heldDiag.set(dir, keys);
    keys.forEach(k=>press(k));
  };
  const up=e=>{
    if(!active)return; active=false; e.preventDefault?.();
    el.classList.remove('is-pressed');
    const keys=_heldDiag.get(dir)||[];
    keys.forEach(k=>release(k));
    _heldDiag.delete(dir);
  };
  el.addEventListener('touchstart',down,{passive:false});
  el.addEventListener('touchend',up); el.addEventListener('touchcancel',up);
  el.addEventListener('mousedown',down);
  el.addEventListener('mouseup',up); el.addEventListener('mouseleave',up);
}
function releaseAllDiag(){
  _heldDiag.forEach((keys)=>keys.forEach(k=>release(k)));
  _heldDiag.clear();
  document.querySelectorAll('#arrows .ab.diag.is-pressed').forEach(b=>b.classList.remove('is-pressed'));
}

document.querySelectorAll('#arrows .ab').forEach(b=>{
  makeDraggable(b);
  b.addEventListener('click',()=>{
    if(!editChk.checked)return;
    if(b._wasMoved&&b._wasMoved())return;
    openSizePop(b,b.dataset.id,{kind:'arrow',dir:b.dataset.dir,el:b,isDiag:b.classList.contains('diag')});
  });
  if(b.classList.contains('diag')){
    bindDiagButton(b);
  }else{
    bindButton(b,()=>cfg.arrows[b.dataset.dir]);
  }
});

/* ---------- Mapeo modal ---------- */
let mapTarget=null;
function isDiagDir(d){return d==='upLeft'||d==='upRight'||d==='downLeft'||d==='downRight'}
function openMapModal(target){
  mapTarget=target;
  const m=document.getElementById('mapModal');
  let curKey='',curLabel='',curKey2='',curCombo=false;
  const isDiag = (target.kind==='arrow' && isDiagDir(target.dir));
  if(target.kind==='pad'){
    const p=cfg.pad[target.i];
    curKey=p.key;curLabel=p.label;curKey2=p.key2||'';curCombo=!!p.key2;
  }
  else if(target.kind==='extra'){
    const x=cfg.extraPad.find(p=>p.id===target.extraId);
    curKey=x?.key||'';curLabel=x?.label||'';curKey2=x?.key2||'';curCombo=!!(x&&x.key2);
  }
  else if(isDiag){
    const d=cfg.arrowsDiag?.[target.dir]||{};
    curKey=d.key1||''; curKey2=d.key2||'';
    curLabel=cfg.arrowLabels[target.dir]||target.dir;
  }
  else{curKey=cfg.arrows[target.dir];curLabel=cfg.arrowLabels[target.dir]||target.dir}
  document.getElementById('mapLabel').value=curLabel;
  document.getElementById('keySelect').value=curKey;
  document.getElementById('keyCapture').value='';
  document.getElementById('keySelect2').value=curKey2||'';
  document.getElementById('keyCapture2').value='';
  // Mostrar checkbox de combo solo para pad/extra (las diagonales son siempre combo)
  const allowComboToggle = (target.kind==='pad' || target.kind==='extra');
  const comboWrap=document.getElementById('comboToggleWrap');
  const comboChk=document.getElementById('comboToggle');
  comboWrap.style.display = allowComboToggle ? 'block' : 'none';
  comboChk.checked = allowComboToggle ? curCombo : false;
  // El segundo selector se muestra si es diagonal o si combo está activo
  const showSecond = isDiag || (allowComboToggle && curCombo);
  document.getElementById('keySelect2Wrap').style.display = showSecond ? 'block' : 'none';
  document.getElementById('keySelectLabel').textContent = (isDiag||(allowComboToggle&&curCombo))
    ? '🎯 Primera tecla del combo'
    : 'Selecciona del menú (todas las teclas disponibles)';
  setStatus('idle','Esperando captura...');
  setStatus2('idle','Esperando captura...');
  m.classList.add('on');
}
function setStatus2(cls,txt){
  const s=document.getElementById('captureStatus2');
  if(s){ s.className='status '+cls; s.textContent=txt; }
}
function setStatus(cls,txt){
  const s=document.getElementById('captureStatus');
  s.className='status '+cls;s.textContent=txt;
}

/* Captura física de tecla */
let capturing=false;
const keyCapInput=document.getElementById('keyCapture');
keyCapInput.addEventListener('focus',()=>{capturing=true;setStatus('detect','🎯 Presiona cualquier tecla del teclado (letras, números, símbolos, F1-F12, flechas, espacio, etc.)')});
// No desactivar capture en blur inmediato; algunos navegadores hacen blur en preventDefault
keyCapInput.addEventListener('click',()=>{capturing=true;setStatus('detect','🎯 Presiona cualquier tecla...')});
/* Soporte teclado VIRTUAL en móviles: muchos navegadores Android no disparan
   keydown con key real. Capturamos vía evento "input" leyendo el último carácter. */
keyCapInput.addEventListener('input',e=>{
  if(!capturing) return;
  const v=keyCapInput.value;
  if(!v) return;
  // Tomar el último carácter introducido
  const ch=[...v].pop();
  if(!ch) return;
  let k=ch;
  if(k===' ') k='Space';
  keyCapInput.value=k;
  const sel=document.getElementById('keySelect');
  let found=[...sel.options].some(o=>o.value===k);
  if(!found){
    let og=[...sel.querySelectorAll('optgroup')].find(g=>g.label==='Otras');
    if(!og){og=document.createElement('optgroup');og.label='Otras';sel.appendChild(og)}
    const o=document.createElement('option');o.value=k;o.textContent=k;og.appendChild(o);
  }
  sel.value=k;
  setStatus('saved','✅ Tecla detectada: "'+k+'" — pulsa Guardar');
  capturing=false;
  setTimeout(()=>keyCapInput.blur(),50);
});
// Capturamos en fase de captura (antes que cualquier otro listener) para que NINGUNA tecla se pierda
window.addEventListener('keydown',e=>{
  if(!capturing)return;
  // Ignorar teclas modificadoras solas como evento, pero permitir capturarlas
  e.preventDefault();
  e.stopPropagation();
  // Determinar nombre de la tecla — preferimos e.key (representa letra/símbolo real)
  let k=e.key;
  if(k===' ')k='Space';
  // Para teclas Numpad, e.key da el dígito; usamos e.code si es Numpad
  if(e.code&&e.code.startsWith('Numpad'))k=e.code;
  // Para teclas de función F1..F24
  // Para teclas muertas (Dead) intentamos usar e.code
  if(k==='Dead'||k==='Unidentified')k=e.code||k;
  keyCapInput.value=k;
  const sel=document.getElementById('keySelect');
  let found=[...sel.options].some(o=>o.value===k);
  if(!found){
    // Añadir a un grupo "Otras" si no existe
    let og=[...sel.querySelectorAll('optgroup')].find(g=>g.label==='Otras');
    if(!og){og=document.createElement('optgroup');og.label='Otras';sel.appendChild(og)}
    const o=document.createElement('option');o.value=k;o.textContent=k;og.appendChild(o);
  }
  sel.value=k;
  setStatus('saved','✅ Tecla detectada: "'+k+'" — pulsa Guardar');
  capturing=false;
  // Pequeño delay antes de blur para evitar reactivación
  setTimeout(()=>keyCapInput.blur(),50);
},true); // <-- capture phase

/* ---------- Captura para SEGUNDA tecla (sólo diagonales) ---------- */
let capturing2=false;
const keyCapInput2=document.getElementById('keyCapture2');
function _addToSelectIfMissing(sel,k){
  let found=[...sel.options].some(o=>o.value===k);
  if(!found){
    let og=[...sel.querySelectorAll('optgroup')].find(g=>g.label==='Otras');
    if(!og){og=document.createElement('optgroup');og.label='Otras';sel.appendChild(og)}
    const o=document.createElement('option');o.value=k;o.textContent=k;og.appendChild(o);
  }
}
keyCapInput2.addEventListener('focus',()=>{capturing2=true;setStatus2('detect','🎯 Pulsa la 2ª tecla del combo...')});
keyCapInput2.addEventListener('click',()=>{capturing2=true;setStatus2('detect','🎯 Pulsa la 2ª tecla del combo...')});
keyCapInput2.addEventListener('input',()=>{
  if(!capturing2) return;
  const v=keyCapInput2.value; if(!v) return;
  let k=[...v].pop(); if(k===' ') k='Space';
  keyCapInput2.value=k;
  const sel=document.getElementById('keySelect2');
  _addToSelectIfMissing(sel,k); sel.value=k;
  setStatus2('saved','✅ 2ª tecla: "'+k+'"');
  capturing2=false; setTimeout(()=>keyCapInput2.blur(),50);
});
window.addEventListener('keydown',e=>{
  if(!capturing2)return;
  e.preventDefault(); e.stopPropagation();
  let k=e.key; if(k===' ')k='Space';
  if(e.code&&e.code.startsWith('Numpad'))k=e.code;
  if(k==='Dead'||k==='Unidentified')k=e.code||k;
  keyCapInput2.value=k;
  const sel=document.getElementById('keySelect2');
  _addToSelectIfMissing(sel,k); sel.value=k;
  setStatus2('saved','✅ 2ª tecla: "'+k+'"');
  capturing2=false; setTimeout(()=>keyCapInput2.blur(),50);
},true);

document.getElementById('mapCancel').onclick=()=>document.getElementById('mapModal').classList.remove('on');
// Toggle dinámico del segundo selector cuando el usuario marca/desmarca "combo"
document.getElementById('comboToggle').addEventListener('change',e=>{
  const on=e.target.checked;
  document.getElementById('keySelect2Wrap').style.display = on ? 'block' : 'none';
  document.getElementById('keySelectLabel').textContent = on
    ? '🎯 Primera tecla del combo'
    : 'Selecciona del menú (todas las teclas disponibles)';
});
document.getElementById('mapSave').onclick=()=>{
  if(!mapTarget)return;
  const key=document.getElementById('keySelect').value;
  const key2=document.getElementById('keySelect2').value;
  const label=document.getElementById('mapLabel').value||key;
  const comboOn=document.getElementById('comboToggle').checked;
  if(mapTarget.kind==='pad'){
    const entry={key,label};
    if(comboOn && key2) entry.key2=key2;
    cfg.pad[mapTarget.i]=entry;
    if(mapTarget.el){
      const badge=mapTarget.el.querySelector('.delBadge');
      mapTarget.el.textContent=label;
      if(badge)mapTarget.el.appendChild(badge);
    }
  }else if(mapTarget.kind==='extra'){
    const x=cfg.extraPad.find(p=>p.id===mapTarget.extraId);
    if(x){
      x.key=key;x.label=label;
      if(comboOn && key2) x.key2=key2; else delete x.key2;
    }
    if(mapTarget.el){
      const badge=mapTarget.el.querySelector('.delBadge');
      mapTarget.el.textContent=label;
      if(badge)mapTarget.el.appendChild(badge);
    }
  }else if(isDiagDir(mapTarget.dir)){
    // Diagonal: guardar combo de 2 teclas
    if(!cfg.arrowsDiag) cfg.arrowsDiag={};
    cfg.arrowsDiag[mapTarget.dir]={key1:key,key2:key2};
    cfg.arrowLabels[mapTarget.dir]=label;
    document.querySelectorAll('#arrows .ab').forEach(b=>{
      if(b.dataset.dir===mapTarget.dir)b.textContent=label;
    });
  }else{
    cfg.arrows[mapTarget.dir]=key;
    cfg.arrowLabels[mapTarget.dir]=label;
    document.querySelectorAll('#arrows .ab').forEach(b=>{
      if(b.dataset.dir===mapTarget.dir)b.textContent=label;
    });
  }
  save();
  document.getElementById('mapModal').classList.remove('on');
};

/* ---------- Añadir botón ----------
   IMPORTANTE: para que los botones EXISTENTES no se muevan al añadir uno
   nuevo (en vertical, horizontal y fullscreen), NO reconstruimos #pad
   completo. Sólo creamos el nuevo .pbtn, calculamos un hueco libre
   dentro de #touchLayer (clamp a la pantalla visible) y lo insertamos.
   Así los demás botones se quedan EXACTAMENTE donde estaban. */
document.getElementById('addBtnBtn').onclick=()=>{
  const id='b'+Date.now().toString(36);
  const newDataId='extra-'+id;
  const layer=document.getElementById('touchLayer');
  const layerR=layer.getBoundingClientRect();
  const BTN=56; // tamaño aproximado del nuevo botón
  const PAD=10;
  // Recolectar rects ocupados por TODOS los botones táctiles actuales
  const occupied=[];
  layer.querySelectorAll('.pbtn,.ab,.fjoy,.fjbase,.floating').forEach(n=>{
    const r=n.getBoundingClientRect();
    if(r.width>0&&r.height>0) occupied.push(r);
  });
  // En fullscreen reservar también la zona del botón flotante ✏️
  const _resv=_fsEditReservedRect();
  if(_resv){
    occupied.push({
      left: layerR.left + _resv.x,
      top:  layerR.top  + _resv.y,
      right: layerR.left + _resv.x + _resv.w,
      bottom: layerR.top + _resv.y + _resv.h
    });
  }
  function overlaps(x,y){
    const r={left:layerR.left+x,top:layerR.top+y,right:layerR.left+x+BTN,bottom:layerR.top+y+BTN};
    return occupied.some(o=>!(r.right<o.left-PAD||r.left>o.right+PAD||r.bottom<o.top-PAD||r.top>o.bottom+PAD));
  }
  // Buscar hueco: barrido desde la esquina inf-derecha hacia arriba/izquierda
  let foundX=null, foundY=null;
  const maxX=Math.max(0, layerR.width-BTN-14);
  const maxY=Math.max(0, layerR.height-BTN-20);
  outer: for(let y=maxY; y>=0; y-=20){
    for(let x=maxX; x>=0; x-=20){
      if(!overlaps(x,y)){ foundX=x; foundY=y; break outer; }
    }
  }
  if(foundX===null){ foundX=maxX; foundY=Math.max(0,maxY-20); }
  // Clamp final a la pantalla visible (vertical/horizontal/fullscreen)
  foundX=Math.max(0,Math.min(foundX,maxX));
  foundY=Math.max(0,Math.min(foundY,maxY));

  // Persistir en config
  cfg.extraPad.push({id,key:'a',label:'A'});
  _savePos(newDataId, foundX+'px', foundY+'px');
  save();

  // ---- Crear el .pbtn nuevo SIN reconstruir el pad ----
  const pad=document.getElementById('pad');
  const el=document.createElement('div');
  el.className='pbtn';
  el.dataset.id=newDataId;
  el.dataset.kind='extra';
  el.dataset.extraId=id;
  el.textContent='A';
  // Posición absoluta directa (no usamos right/bottom para evitar reflow)
  el.style.left=foundX+'px';
  el.style.top=foundY+'px';
  el.style.right='auto';
  el.style.bottom='auto';
  // Badge eliminar (mismo comportamiento que en renderPad)
  const x=document.createElement('div');
  x.className='delBadge';x.textContent='×';
  x.onclick=ev=>{
    ev.stopPropagation();
    if(!confirm('¿Eliminar este botón?'))return;
    cfg.extraPad=cfg.extraPad.filter(p=>p.id!==id);
    _delPos(newDataId);
    save();
    el.remove(); // quitar sólo este, sin reconstruir
  };
  el.appendChild(x);
  pad.appendChild(el);
  // Bindeos: pulsación de tecla, edición y arrastre
  bindButton(el,()=>{
    const xx=cfg.extraPad.find(p=>p.id===id);
    if(!xx) return null;
    return xx.key2 ? [xx.key, xx.key2] : xx.key;
  });
  el.addEventListener('click',()=>{
    if(!editChk.checked)return;
    if(el._wasMoved&&el._wasMoved())return;
    openSizePop(el,newDataId,{kind:'extra',extraId:id,el});
  });
  makeDraggable(el);
  attachTouchTapEdit(el, ()=>{
    openSizePop(el,newDataId,{kind:'extra',extraId:id,el});
  });
  // Re-aplicar tamaños individuales por si aplica
  if(typeof applyAllIndividualSizes==='function') applyAllIndividualSizes();

  // abrir modal para configurarlo
  setTimeout(()=>{
    openMapModal({kind:'extra',extraId:id,el});
  },50);
};

/* ---------- Calibración ---------- */
const settingsModal=document.getElementById('settingsModal');
document.getElementById('settingsBtn').onclick=()=>{
  document.getElementById('sens').value=cfg.cal.sens;document.getElementById('sensVal').textContent=cfg.cal.sens;
  document.getElementById('dz').value=cfg.cal.dz;document.getElementById('dzVal').textContent=cfg.cal.dz;
  document.getElementById('diag').value=cfg.cal.diag;document.getElementById('diagVal').textContent=cfg.cal.diag;
  document.getElementById('op').value=cfg.cal.opacity;document.getElementById('opVal').textContent=cfg.cal.opacity;
  document.getElementById('sz').value=cfg.cal.size;document.getElementById('szVal').textContent=cfg.cal.size;
  settingsModal.classList.add('on');
};
document.getElementById('settingsClose').onclick=()=>settingsModal.classList.remove('on');
document.getElementById('settingsReset').onclick=()=>{
  if(!confirm('¿Restaurar la calibración (sensibilidad, zona muerta, diagonal, visibilidad y tamaño) a los valores iniciales?'))return;
  cfg.cal = JSON.parse(JSON.stringify(defaults.cal));
  save();
  // Refrescar UI del modal
  document.getElementById('sens').value=cfg.cal.sens;document.getElementById('sensVal').textContent=cfg.cal.sens;
  document.getElementById('dz').value=cfg.cal.dz;document.getElementById('dzVal').textContent=cfg.cal.dz;
  document.getElementById('diag').value=cfg.cal.diag;document.getElementById('diagVal').textContent=cfg.cal.diag;
  document.getElementById('op').value=cfg.cal.opacity;document.getElementById('opVal').textContent=cfg.cal.opacity;
  document.getElementById('sz').value=cfg.cal.size;document.getElementById('szVal').textContent=cfg.cal.size;
  // Aplicar variables CSS
  const op=(cfg.cal.opacity/100), sz=(cfg.cal.size/100);
  document.getElementById('touchLayer').style.setProperty('--ctrl-opacity',op);
  document.getElementById('fsEditBtn').style.setProperty('--ctrl-opacity',op);
  document.getElementById('touchLayer').style.setProperty('--btn-scale',sz);
  document.getElementById('fsEditBtn').style.setProperty('--btn-scale',sz);
  if(typeof applyAllIndividualSizes==='function') applyAllIndividualSizes();
};
['sens','dz','diag'].forEach(id=>{
  const el=document.getElementById(id);
  el.oninput=()=>{cfg.cal[id]=parseFloat(el.value);document.getElementById(id+'Val').textContent=el.value;save()};
});
document.getElementById('op').oninput=e=>{
  cfg.cal.opacity=parseInt(e.target.value);
  document.getElementById('opVal').textContent=cfg.cal.opacity;
  const v=(cfg.cal.opacity/100);
  document.getElementById('touchLayer').style.setProperty('--ctrl-opacity',v);
  document.getElementById('fsEditBtn').style.setProperty('--ctrl-opacity',v);
  save();
};
document.getElementById('sz').oninput=e=>{
  cfg.cal.size=parseInt(e.target.value);
  document.getElementById('szVal').textContent=cfg.cal.size;
  const v=(cfg.cal.size/100);
  document.getElementById('touchLayer').style.setProperty('--btn-scale',v);
  document.getElementById('fsEditBtn').style.setProperty('--btn-scale',v);
  save();
};

/* ---------- Toggles ---------- */
const touchToggle=document.getElementById('touchToggle');
function applyTouchEnabled(){
  const on = !!cfg.touchOn;
  document.getElementById('touchLayer').classList.toggle('hidden',!on);
  document.body.classList.toggle('touch-off',!on);
  // Inhabilitar/habilitar Editar (mover/mapear) y Añadir botón
  const editEl=document.getElementById('editMode');
  const addEl=document.getElementById('addBtnBtn');
  if(editEl){
    editEl.disabled=!on;
    const lab=editEl.closest('label'); if(lab) lab.style.opacity = on?'1':'0.45';
    if(lab) lab.style.pointerEvents = on?'':'none';
    if(!on && editEl.checked){
      editEl.checked=false;
      document.body.classList.remove('editing');
    }
  }
  if(addEl){
    addEl.disabled=!on;
    addEl.style.opacity = on?'':'0.45';
    addEl.style.cursor = on?'pointer':'not-allowed';
  }
}
touchToggle.onchange=()=>{cfg.touchOn=touchToggle.checked;save();applyTouchEnabled();};
const holdChk=document.getElementById('holdMode');
holdChk.onchange=()=>{cfg.hold=holdChk.checked;save();if(!cfg.hold)releaseAll()};
const ctrlMode=document.getElementById('ctrlMode');
ctrlMode.onchange=()=>{cfg.ctrlMode=ctrlMode.value;applyCtrlMode();save()};
function applyCtrlMode(){
  const mode=cfg.ctrlMode;
  const isJoy = mode==='joy';
  const isArrows8 = mode==='arrows8';
  const arrowsOn = mode==='arrows' || isArrows8;
  joy.style.display=isJoy?'flex':'none';
  const arrowsEl=document.getElementById('arrows');
  arrowsEl.classList.toggle('on', arrowsOn);
  arrowsEl.classList.toggle('eight', isArrows8);
  // Si cambiamos de modo, soltar cualquier tecla diagonal sostenida
  if(!isArrows8) releaseAllDiag();
  // Reorganizar las flechas para que NO se desordenen al cambiar entre
  // 4 y 8 botones. Diagonales se anclan alrededor de las cardinales.
  if(arrowsOn){ requestAnimationFrame(()=>relayoutArrows(isArrows8)); }
}

/* Reordena visualmente las flechas formando una cruz 3x3 sin sobreescribir
   posiciones que el usuario ya guardó manualmente en este modo.
   - Cardinales (▲▼◀▶): si no tienen posición guardada en el modo actual,
     se colocan en una cuadrícula compacta junto a su posición por defecto
     o anclados a la cardinal "▼" si existe.
   - Diagonales (↖↗↙↘): si no tienen posición guardada, se colocan en las
     esquinas del cuadro formado por las cardinales (cross layout). */
function relayoutArrows(includeDiag){
  const layer=document.getElementById('touchLayer'); if(!layer) return;
  const lr=layer.getBoundingClientRect();
  if(lr.width<=0||lr.height<=0) return;
  const store=_posStore(_currentMode());
  const ids={
    up:'arr-up', down:'arr-down', left:'arr-left', right:'arr-right',
    upLeft:'arr-upleft', upRight:'arr-upright',
    downLeft:'arr-downleft', downRight:'arr-downright'
  };
  const get=(id)=>document.querySelector(`[data-id="${id}"]`);
  const elU=get(ids.up), elD=get(ids.down), elL=get(ids.left), elR=get(ids.right);
  if(!elU||!elD||!elL||!elR) return;
  // Tamaño actual real de un botón flecha (incluye escalas)
  const w = elU.offsetWidth || 52;
  const h = elU.offsetHeight || 52;
  const gap = Math.max(4, Math.round(w*0.12));

  // Determinar centro de la cruz: usa la posición actual de "down" como
  // ancla (es la flecha más usada como referencia inferior). Si ninguna
  // cardinal tiene posición guardada, se ancla en la esquina inferior-izq.
  let anchorCX, anchorCY; // centro del botón "down"
  const haveAnyCardinal = [ids.up,ids.down,ids.left,ids.right].some(i=>store[i]);
  if(haveAnyCardinal){
    // Usar la cardinal con posición guardada de mayor prioridad: down>up>left>right
    const order=[ids.down,ids.up,ids.left,ids.right];
    let refId=null, refEl=null;
    for(const i of order){ if(store[i]){ refId=i; refEl=get(i); break; } }
    const p=store[refId];
    const rx=parseFloat(p.left)||0, ry=parseFloat(p.top)||0;
    const rcx=rx+w/2, rcy=ry+h/2;
    // Calcular dónde estaría el centro de "down" según el ref
    if(refId===ids.down){ anchorCX=rcx; anchorCY=rcy; }
    else if(refId===ids.up){ anchorCX=rcx; anchorCY=rcy + 2*(h+gap); }
    else if(refId===ids.left){ anchorCX=rcx + (w+gap); anchorCY=rcy + (h+gap); }
    else { anchorCX=rcx - (w+gap); anchorCY=rcy + (h+gap); }
  } else {
    // Por defecto, esquina inferior-izquierda
    anchorCX = (8 + w + gap) + w/2;       // columna central
    anchorCY = lr.height - 20 - h/2;       // fila inferior
  }

  // Centros (cx,cy) por dirección, formando cruz 3x3 alrededor del centro
  // (centerCX, centerCY) que es el centro entre up y down.
  const centerCX = anchorCX;
  const centerCY = anchorCY - (h+gap); // centro de la cruz: fila intermedia
  const colL = centerCX - (w+gap), colC = centerCX, colR = centerCX + (w+gap);
  const rowT = centerCY - (h+gap), rowM = centerCY, rowB = centerCY + (h+gap);

  const layout = {
    [ids.up]:        {cx:colC, cy:rowT},
    [ids.left]:      {cx:colL, cy:rowM},
    [ids.right]:     {cx:colR, cy:rowM},
    [ids.down]:      {cx:colC, cy:rowB},
    [ids.upLeft]:    {cx:colL, cy:rowT},
    [ids.upRight]:   {cx:colR, cy:rowT},
    [ids.downLeft]:  {cx:colL, cy:rowB},
    [ids.downRight]: {cx:colR, cy:rowB},
  };

  // Calcular desplazamiento global si la cruz se sale de la pantalla
  const allCx = Object.values(layout).map(p=>p.cx);
  const allCy = Object.values(layout).map(p=>p.cy);
  const minLeft = Math.min(...allCx) - w/2;
  const maxRight = Math.max(...allCx) + w/2;
  const minTop = Math.min(...allCy) - h/2;
  const maxBot = Math.max(...allCy) + h/2;
  let dx=0, dy=0;
  if(minLeft < 4) dx = 4 - minLeft;
  else if(maxRight > lr.width-4) dx = (lr.width-4) - maxRight;
  if(minTop < 4) dy = 4 - minTop;
  else if(maxBot > lr.height-4) dy = (lr.height-4) - maxBot;

  // Aplicar: cardinales sólo si no tienen pos guardada; diagonales sólo si
  // están visibles (includeDiag) y no tienen pos guardada.
  const apply = (id, isDiag)=>{
    if(isDiag && !includeDiag) return;
    if(store[id]) return; // respeta posición personalizada del usuario
    const el=get(id); if(!el) return;
    const c=layout[id];
    let x = c.cx + dx - w/2;
    let y = c.cy + dy - h/2;
    x = Math.min(Math.max(0,x), Math.max(0, lr.width-w));
    y = Math.min(Math.max(0,y), Math.max(0, lr.height-h));
    el.style.left=x+'px'; el.style.top=y+'px';
    el.style.right='auto'; el.style.bottom='auto';
    _savePos(id, el.style.left, el.style.top);
  };
  apply(ids.up,false); apply(ids.down,false);
  apply(ids.left,false); apply(ids.right,false);
  apply(ids.upLeft,true); apply(ids.upRight,true);
  apply(ids.downLeft,true); apply(ids.downRight,true);
  try{ save(); }catch{}
}

/* ---------- Restaurar / Borrar / Export / Import ---------- */
document.getElementById('resetBtn').onclick=()=>{
  if(!confirm('¿Restaurar controles, mapeos y posiciones a valores iniciales?'))return;
  cfg=cloneCfg(defaults);save();location.reload();
};
document.getElementById('clearBtn').onclick=()=>{
  if(!confirm('⚠️ Borrar TODA la configuración guardada en este navegador?'))return;
  localStorage.removeItem(STORE);location.reload();
};
document.getElementById('exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='swf-player-config.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{const data=JSON.parse(r.result);cfg=Object.assign(cloneCfg(defaults),data);save();renderPad();applyConfig();applyTheme();alert('✅ Configuración importada')}
    catch{alert('❌ Archivo JSON inválido')}
  };
  r.readAsText(f);
};

/* ---------- Tamaños individuales ---------- */
function applyIndividualSize(id){
  const el=document.querySelector(`[data-id="${id}"]`);
  if(!el)return;
  const s=cfg.sizes[id];
  if(s&&s!==1) el.style.setProperty('--ind-scale',s);
  else el.style.removeProperty('--ind-scale');
}
function applyAllIndividualSizes(){
  Object.keys(cfg.sizes||{}).forEach(applyIndividualSize);
}

/* ---------- Popover de tamaño individual ---------- */
const sizePop=document.getElementById('sizePop');
const sizePopRange=document.getElementById('sizePopRange');
const sizePopVal=document.getElementById('sizePopVal');
const sizePopMap=document.getElementById('sizePopMap');
const sizePopClose=document.getElementById('sizePopClose');
let sizePopTarget=null;     // { el, id, mapTarget }
function positionSizePop(el){
  const r=el.getBoundingClientRect();
  // Preferir arriba del botón; si no cabe, debajo
  const popH=52, popW=240;
  let top=r.top-popH-8;
  if(top<8) top=r.bottom+8;
  let left=r.left+r.width/2-popW/2;
  left=Math.max(8,Math.min(window.innerWidth-popW-8,left));
  sizePop.style.top=top+'px';
  sizePop.style.left=left+'px';
}
function openSizePop(el,id,mapTarget){
  // limpiar selección previa
  document.querySelectorAll('.is-selected').forEach(x=>x.classList.remove('is-selected'));
  el.classList.add('is-selected');
  sizePopTarget={el,id,mapTarget};
  const cur=cfg.sizes[id]||1;
  const pct=Math.round(cur*100);
  sizePopRange.value=pct;
  sizePopVal.textContent=pct+'%';
  positionSizePop(el);
  sizePop.classList.add('on');
}
function closeSizePop(){
  sizePop.classList.remove('on');
  document.querySelectorAll('.is-selected').forEach(x=>x.classList.remove('is-selected'));
  sizePopTarget=null;
}
sizePopRange.oninput=()=>{
  if(!sizePopTarget)return;
  const pct=parseInt(sizePopRange.value);
  sizePopVal.textContent=pct+'%';
  const s=pct/100;
  cfg.sizes[sizePopTarget.id]=s;
  applyIndividualSize(sizePopTarget.id);
  // reposicionar popover (el botón cambió de tamaño)
  positionSizePop(sizePopTarget.el);
  save();
};
sizePopMap.onclick=()=>{
  if(!sizePopTarget)return;
  const t=sizePopTarget.mapTarget;
  closeSizePop();
  openMapModal(t);
};
sizePopClose.onclick=closeSizePop;
// Cerrar popover al desactivar edición o tocar fuera
editChk.addEventListener('change',()=>{if(!editChk.checked)closeSizePop()});
document.addEventListener('mousedown',e=>{
  if(!sizePop.classList.contains('on'))return;
  if(sizePop.contains(e.target))return;
  if(sizePopTarget&&sizePopTarget.el.contains(e.target))return;
  closeSizePop();
});
document.addEventListener('touchstart',e=>{
  if(!sizePop.classList.contains('on'))return;
  if(sizePop.contains(e.target))return;
  if(sizePopTarget&&sizePopTarget.el.contains(e.target))return;
  closeSizePop();
},{passive:true});
window.addEventListener('resize',()=>{if(sizePopTarget)positionSizePop(sizePopTarget.el)});

/* ---------- Aplicar config a la UI ---------- */
function applyConfig(){
  // Render dinámico del pad si está vacío
  if(!document.querySelector('#pad .pbtn'))renderPad();
  // posiciones individuales guardadas (modo actual: vertical/normal o pantalla completa)
  // Fallback: si en este modo no hay nada para un id, usamos el legacy cfg.positions.
  const _curStore=_posStore(_currentMode());
  const _seen=new Set();
  Object.entries(_curStore).forEach(([id,p])=>{
    const el=document.querySelector(`[data-id="${id}"]`);
    if(el&&p&&p.left&&p.top){el.style.left=p.left;el.style.top=p.top;el.style.bottom='auto';el.style.right='auto';_seen.add(id);}
  });
  Object.entries(cfg.positions||{}).forEach(([id,p])=>{
    if(_seen.has(id)) return;
    const el=document.querySelector(`[data-id="${id}"]`);
    if(el&&p&&p.left&&p.top){el.style.left=p.left;el.style.top=p.top;el.style.bottom='auto';el.style.right='auto'}
  });
  // etiquetas flechas
  document.querySelectorAll('#arrows .ab').forEach(b=>{
    const lbl=cfg.arrowLabels?.[b.dataset.dir];if(lbl)b.textContent=lbl;
  });
  // toggles
  touchToggle.checked=cfg.touchOn;applyTouchEnabled();
  holdChk.checked=cfg.hold;
  ctrlMode.value=cfg.ctrlMode;applyCtrlMode();
  // opacidad y tamaño global
  document.getElementById('touchLayer').style.setProperty('--ctrl-opacity',(cfg.cal.opacity/100));
  document.getElementById('touchLayer').style.setProperty('--btn-scale',(cfg.cal.size/100));
  // Aplicar lo mismo al botón flotante ✏️ para que tenga el mismo aspecto y visibilidad
  document.getElementById('fsEditBtn').style.setProperty('--ctrl-opacity',(cfg.cal.opacity/100));
  document.getElementById('fsEditBtn').style.setProperty('--btn-scale',(cfg.cal.size/100));
  // tamaños individuales
  applyAllIndividualSizes();
  // header colapsado
  applyHeaderCollapsed();
}
renderPad();
applyConfig();

/* Liberar teclas si la pestaña pierde foco */
window.addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll()});

/* Bloquear zoom doble-tap en iOS sobre controles */
document.getElementById('touchLayer').addEventListener('dblclick',e=>e.preventDefault());

/* ---------- Estirar pantalla ---------- */
const stretchToggle=document.getElementById('stretchToggle');
const stretchBar=document.getElementById('stretchBar');
const stretchW=document.getElementById('stretchW');
const stretchH=document.getElementById('stretchH');
const stretchZoom=document.getElementById('stretchZoom');
const stretchScale=document.getElementById('stretchScale');
const stretchBorder=document.getElementById('stretchBorder');
const stretchBorderVal=document.getElementById('stretchBorderVal');
const stretchSideCrop=document.getElementById('stretchSideCrop');
const stretchSideCropVal=document.getElementById('stretchSideCropVal');
const stageEl=document.getElementById('stage');
const playerEl=document.getElementById('player');

/* Calcula límites min/max dinámicos del slider según el viewport real */
function computeStretchLimits(){
  const vw=window.innerWidth, vh=window.innerHeight;
  const minWpx=240, minHpx=160;
  const headerH=(document.querySelector('header')?.offsetHeight||0);
  const stretchBarH=(stretchBar?.offsetHeight||0);
  const reserved=headerH+stretchBarH+24;
  const maxHpx=Math.max(minHpx+40, vh-reserved);
  const minW=Math.min(95, Math.max(20, Math.ceil((minWpx/vw)*100)));
  const minH=Math.min(90, Math.max(15, Math.ceil((minHpx/vh)*100)));
  const maxW=100;
  const maxH=Math.min(98, Math.max(minH+10, Math.floor((maxHpx/vh)*100)));
  return {minW,maxW,minH,maxH};
}
function applyStretchLimits(){
  const {minW,maxW,minH,maxH}=computeStretchLimits();
  stretchW.min=minW; stretchW.max=maxW;
  stretchH.min=minH; stretchH.max=maxH;
  cfg.stretch.w=Math.min(maxW,Math.max(minW,cfg.stretch.w));
  cfg.stretch.h=Math.min(maxH,Math.max(minH,cfg.stretch.h));
}

function applyGameZoom(){
  const z=Math.max(0.3, Math.min(3, (cfg.stretch.zoom||100)/100));
  stageEl.style.setProperty('--game-zoom', z);
}
function applyStageScale(){
  let s=Math.max(0.3, Math.min(3, (cfg.stretch.scale||100)/100));
  // Calcular el ancho base actual del stage (antes del scale)
  const stretchOn=document.body.classList.contains('stretch-on');
  let baseW;
  if(stretchOn){
    baseW=(cfg.stretch.w/100)*window.innerWidth;
  }else{
    baseW=Math.min(960, window.innerWidth - 16);
  }
  // Único tope: 98% del viewport en ancho (evita scroll horizontal y desborde
  // del marco fuera de la caja). La altura NO se topa, así el stretchBar
  // (controles Ancho/Alto/Zoom/Tamaño ventana) queda siempre debajo del
  // reproductor sin sobreponerse: a más Tamaño ventana, más abajo aparece.
  const maxW=window.innerWidth*0.98;
  const maxScale=maxW/Math.max(1,baseW);
  if(s>maxScale) s=maxScale;
  // Limpiar el tope de altura por si quedó de versiones previas
  stageEl.style.removeProperty('--stage-max-h');
  stageEl.style.setProperty('--stage-scale', s);
}

function applyStageBorder(){
  // Borde negro INTERNO del reproductor: % del lado más corto del #stage.
  // 0% = sin borde negro (el juego llena todo el área del stage).
  const b=Math.max(0, Math.min(15, cfg.stretch.border|0));
  const r=stageEl.getBoundingClientRect();
  const ref=Math.max(1, Math.min(r.width||1, r.height||1));
  const px=Math.round((b/100)*ref);
  stageEl.style.setProperty('--stage-pad', px+'px');
  if(stretchBorder){ stretchBorder.value=b; }
  if(stretchBorderVal){ stretchBorderVal.textContent=b+'%'; }
}

/* Recorte lateral: elimina los bordes negros/blancos de los lados del juego.
   Funciona en ventana y en pantalla completa. Se aplica al #player mediante
   scaleX + clip-path (ver CSS). El valor es un % de 0 a 30 por lado. */
function applySideCrop(){
  const v=Math.max(0, Math.min(30, cfg.stretch.sideCrop|0));
  stageEl.style.setProperty('--side-crop-pct', String(v));
  if(stretchSideCrop){ stretchSideCrop.value=v; }
  if(stretchSideCropVal){ stretchSideCropVal.textContent=v+'%'; }
}

function applyStretch(){
  document.body.classList.toggle('stretch-on',!!cfg.stretch.on);
  applyStretchLimits();
  if(cfg.stretch.on){
    stageEl.style.setProperty('--stage-w', cfg.stretch.w+'vw');
    stageEl.style.setProperty('--stage-h', cfg.stretch.h+'vh');
  }else{
    stageEl.style.removeProperty('--stage-w');
    stageEl.style.removeProperty('--stage-h');
  }
  stretchW.value=cfg.stretch.w;
  stretchH.value=cfg.stretch.h;
  stretchZoom.value=cfg.stretch.zoom;
  stretchScale.value=cfg.stretch.scale;
  stretchToggle.checked=!!cfg.stretch.on;
  applyGameZoom();
  applyStageScale();
  applyStageBorder();
  applySideCrop();
}

stretchToggle.onchange=()=>{cfg.stretch.on=stretchToggle.checked;save();applyStretch()};
stretchW.oninput=()=>{
  cfg.stretch.w=parseInt(stretchW.value);
  stageEl.style.setProperty('--stage-w',cfg.stretch.w+'vw');
  applyStageScale();
  save();
};
stretchH.oninput=()=>{
  cfg.stretch.h=parseInt(stretchH.value);
  stageEl.style.setProperty('--stage-h',cfg.stretch.h+'vh');
  applyStageScale();
  save();
};
stretchZoom.oninput=()=>{
  cfg.stretch.zoom=parseInt(stretchZoom.value);
  applyGameZoom();
  save();
};
stretchScale.oninput=()=>{
  cfg.stretch.scale=parseInt(stretchScale.value);
  applyStageScale();
  save();
};
if(stretchBorder){
  stretchBorder.oninput=()=>{
    cfg.stretch.border=parseInt(stretchBorder.value)||0;
    applyStageBorder();
    save();
  };
}
if(stretchSideCrop){
  stretchSideCrop.oninput=()=>{
    cfg.stretch.sideCrop=parseInt(stretchSideCrop.value)||0;
    applySideCrop();
    save();
  };
}
document.getElementById('stretchReset').onclick=()=>{
  cfg.stretch.w=100;cfg.stretch.h=60;cfg.stretch.zoom=100;cfg.stretch.scale=100;cfg.stretch.border=0;cfg.stretch.sideCrop=0;save();applyStretch();
};
/* Botón ✅ OK: oculta el menú de estiramiento manteniendo los cambios.
   Para volver a abrirlo, des-marcar y volver a marcar "📐 Estirar pantalla". */
document.getElementById('stretchOk').onclick=()=>{
  document.body.classList.add('stretch-hidden');
  save();
};
/* Al activar/desactivar el toggle, siempre re-mostrar la barra */
const _origStretchToggle=stretchToggle.onchange;
stretchToggle.onchange=()=>{
  document.body.classList.remove('stretch-hidden');
  cfg.stretch.on=stretchToggle.checked;save();applyStretch();
};

/* Drag desde las esquinas (PC) */
document.querySelectorAll('.resize-handle').forEach(h=>{
  h.addEventListener('mousedown',e=>{
    if(!cfg.stretch.on)return;
    e.preventDefault();e.stopPropagation();
    const corner=h.dataset.corner;
    const startX=e.clientX, startY=e.clientY;
    const r=stageEl.getBoundingClientRect();
    const startW=r.width, startH=r.height;
    const vw=window.innerWidth;
    const vh=window.innerHeight;
    const lim=computeStretchLimits();
    const move=ev=>{
      let dx=ev.clientX-startX, dy=ev.clientY-startY;
      if(corner==='tl'||corner==='bl') dx=-dx;
      if(corner==='tl'||corner==='tr') dy=-dy;
      const wPctF=((startW+dx)/vw)*100;
      const hPctF=((startH+dy)/vh)*100;
      const wPct=Math.max(lim.minW, Math.min(lim.maxW, wPctF));
      const hPct=Math.max(lim.minH, Math.min(lim.maxH, hPctF));
      stageEl.style.setProperty('--stage-w', wPct.toFixed(2)+'vw');
      stageEl.style.setProperty('--stage-h', hPct.toFixed(2)+'vh');
      cfg.stretch.w=Math.round(wPct);
      cfg.stretch.h=Math.round(hPct);
      stretchW.value=cfg.stretch.w;
      stretchH.value=cfg.stretch.h;
    };
    const up=()=>{
      window.removeEventListener('mousemove',move);
      window.removeEventListener('mouseup',up);
      stageEl.style.setProperty('--stage-w', cfg.stretch.w+'vw');
      stageEl.style.setProperty('--stage-h', cfg.stretch.h+'vh');
      save();
    };
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  });
});

/* ---------- Persistencia del scroll horizontal del header ----------
   Al recargar o rotar, restauramos la posición de scroll de cada .row
   para que los botones que estabas viendo sigan visibles. */
const HEADER_SCROLL_KEY='swfplayer_header_scroll_v1';
const headerRows=document.querySelectorAll('header .row');
function saveHeaderScroll(){
  try{
    const data=Array.from(headerRows).map(r=>r.scrollLeft|0);
    sessionStorage.setItem(HEADER_SCROLL_KEY, JSON.stringify(data));
  }catch{}
}
function restoreHeaderScroll(){
  try{
    const raw=sessionStorage.getItem(HEADER_SCROLL_KEY);
    if(!raw) return;
    const data=JSON.parse(raw);
    headerRows.forEach((r,i)=>{ if(typeof data[i]==='number') r.scrollLeft=data[i]; });
  }catch{}
}
headerRows.forEach(r=>r.addEventListener('scroll',()=>{
  clearTimeout(r._sst); r._sst=setTimeout(saveHeaderScroll,120);
},{passive:true}));
window.addEventListener('beforeunload',saveHeaderScroll);
window.addEventListener('pagehide',saveHeaderScroll);

/* Reaccionar a cambios de tamaño / orientación */
let _resizeT;
function onViewportChange(){
  clearTimeout(_resizeT);
  _resizeT=setTimeout(()=>{
    applyStretchLimits();
    applyStageScale();
    if(cfg.stretch.on){
      stretchW.value=cfg.stretch.w; stretchH.value=cfg.stretch.h;
      stageEl.style.setProperty('--stage-w', cfg.stretch.w+'vw');
      stageEl.style.setProperty('--stage-h', cfg.stretch.h+'vh');
    }
    // Restaurar scroll del header tras el reflow por rotación
    restoreHeaderScroll();
  },80);
}
window.addEventListener('resize',onViewportChange);
window.addEventListener('orientationchange',()=>{
  // Pequeño delay extra: algunos navegadores reportan tamaños tras la rotación
  setTimeout(onViewportChange, 200);
});

/* ===== Compensación de zoom del navegador para los controles táctiles =====
   Cuando el usuario hace zoom (Ctrl +/-, pinch en móvil, o nivel de zoom del
   navegador), todo se escala — incluidos los controles táctiles que están en
   #touchLayer. Para que SIEMPRE mantengan el mismo tamaño visual, calculamos
   el nivel de zoom efectivo y aplicamos la inversa como --zoom-comp en el
   #touchLayer (que usa la propiedad CSS `zoom`). Mantiene el mismo diseño. */
(function(){
  const layer = document.getElementById('touchLayer');
  if(!layer) return;
  function getBrowserZoom(){
    // visualViewport.scale: pinch-zoom en móvil (1 = sin zoom)
    const pinch = (window.visualViewport && window.visualViewport.scale) || 1;
    // Zoom de página (Ctrl +/-): comparar window.outerWidth/innerWidth.
    // En móvil con barras de UI esto puede ser inexacto; lo limitamos a PC.
    let pageZoom = 1;
    try{
      if(window.outerWidth && window.innerWidth && !('ontouchstart' in window)){
        pageZoom = window.outerWidth / window.innerWidth;
        // Filtrar valores absurdos (DPI, etc.)
        if(pageZoom < 0.3 || pageZoom > 5) pageZoom = 1;
      }
    }catch(_){}
    return pinch * pageZoom;
  }
  function applyZoomComp(){
    const z = getBrowserZoom();
    // Inversa: si zoom = 1.5x, comp = 1/1.5 para mantener tamaño visual original.
    const comp = z > 0 ? (1 / z) : 1;
    layer.style.setProperty('--zoom-comp', comp.toFixed(4));
  }
  applyZoomComp();
  window.addEventListener('resize', applyZoomComp);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', applyZoomComp);
    window.visualViewport.addEventListener('scroll', applyZoomComp);
  }
})();
//

// Aplicar al cargar
applyStretch();
// Defensa contra bfcache / autofill del navegador: cuando la página se restaura
// desde caché, los estados de checkboxes pueden quedar marcados aunque el
// usuario tenga la opción desactivada. Re-sincronizamos con cfg en cada pageshow.
window.addEventListener('pageshow',()=>{
  try{
    if(typeof stretchToggle!=='undefined' && stretchToggle){
      stretchToggle.checked=!!cfg.stretch.on;
    }
    if(typeof holdChk!=='undefined' && holdChk){
      holdChk.checked=!!cfg.hold;
    }
    applyStretch();
  }catch{}
});
// Restaurar scroll del header después del primer paint
requestAnimationFrame(()=>requestAnimationFrame(restoreHeaderScroll));

/* ---------- Botón flotante "Editar" en pantalla completa ----------
   Permite activar/desactivar el modo edición (mover/mapear botones
   táctiles) directamente desde fullscreen, tanto en PC como en móvil. */
/* ---------- Botón flotante "✏️" en pantalla completa ----------
   Ahora abre un MENÚ DESPLEGABLE con las opciones más usadas para
   manejar el reproductor desde fullscreen, tanto en PC como en móvil. */
(function(){
  const fsEdit=document.getElementById('fsEditBtn');
  const menu=document.getElementById('fsEditMenu');
  const editChkEl=document.getElementById('editMode');
  if(!fsEdit||!menu) return;

  function syncFsBtn(){
    fsEdit.classList.toggle('active', !!(editChkEl && editChkEl.checked));
    // Reflejar también el estado de los toggles dentro del menú
    const stretchChk=document.getElementById('stretchToggle');
    const ctrlSel=document.getElementById('ctrlMode');
    const ruffleChk=document.getElementById('blockRuffleMenu');
    menu.querySelectorAll('button[data-act]').forEach(b=>{
      const a=b.dataset.act;
      if(a==='move')    b.classList.toggle('active', !!(editChkEl && editChkEl.checked));
      if(a==='stretch') b.classList.toggle('active', !!(stretchChk && stretchChk.checked));
      if(a==='ruffle')  b.classList.toggle('active', !!(ruffleChk && ruffleChk.checked));
      if(a==='ctrl' && ctrlSel){
        const v = ctrlSel.value;
        const next = v==='joy' ? '⬆️ Flechas (4)'
                   : v==='arrows' ? '⬆️ Flechas (8)'
                   : '🕹️ Joystick';
        b.textContent = '🎮 Cambiar a: '+next;
      }
      if(a==='pause'){
        // Reflejar estado real del botón principal de pausa
        const mainPause=document.getElementById('pauseBtn');
        if(mainPause) b.textContent = mainPause.textContent || '⏸ Pausa';
      }
    });
  }
  function openMenu(){ menu.classList.add('on'); menu.setAttribute('aria-hidden','false'); syncFsBtn(); }
  function closeMenu(){ menu.classList.remove('on'); menu.setAttribute('aria-hidden','true'); }
  function toggleMenu(){ menu.classList.contains('on') ? closeMenu() : openMenu(); }

  fsEdit.addEventListener('click', e=>{
    e.preventDefault(); e.stopPropagation();
    toggleMenu();
  });

  // Click fuera = cerrar
  document.addEventListener('click', e=>{
    if(!menu.classList.contains('on')) return;
    if(e.target===fsEdit || fsEdit.contains(e.target)) return;
    if(menu.contains(e.target)) return;
    closeMenu();
  });
  // ESC = cerrar
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

  // Acciones del menú: delegan en los controles existentes para no duplicar lógica.
  menu.addEventListener('click', e=>{
    const btn=e.target.closest('button[data-act]'); if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    const act=btn.dataset.act;
    const click=id=>{ const el=document.getElementById(id); if(el) el.click(); };
    const toggle=id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.checked=!el.checked;
      el.dispatchEvent(new Event('change',{bubbles:true}));
    };
    switch(act){
      case 'move':    toggle('editMode'); break;
      case 'add':     click('addBtnBtn'); break;
      case 'ctrl':    {
        const sel=document.getElementById('ctrlMode');
        if(sel){
          // Ciclo: joy → arrows → arrows8 → joy
          const cycle=['joy','arrows','arrows8'];
          const idx=cycle.indexOf(sel.value);
          sel.value = cycle[(idx+1) % cycle.length];
          sel.dispatchEvent(new Event('change',{bubbles:true}));
        }
        break;
      }
      case 'vol':     click('volumeBtn'); break;
      case 'reload':  click('reloadBtn'); break;
      case 'stop':    click('stopBtn'); break;
      case 'pause':   click('pauseBtn'); break;
      case 'stretch': toggle('stretchToggle'); break;
      case 'cal':     click('settingsBtn'); break;
      case 'quality': click('qualityBtn'); break;
      case 'config':  click('configBtn'); break;
      case 'ruffle':  toggle('blockRuffleMenu'); break;
      case 'exitfs':  {
        try{ document.exitFullscreen?.(); }catch{}
        try{ screen.orientation?.unlock?.(); }catch{}
        break;
      }
    }
    syncFsBtn();
    // Cerrar el menú salvo para acciones tipo toggle rápido (mantenemos UX simple: cerrar siempre)
    closeMenu();
  });

  if(editChkEl) editChkEl.addEventListener('change', syncFsBtn);
  const stretchChk=document.getElementById('stretchToggle');
  if(stretchChk) stretchChk.addEventListener('change', syncFsBtn);
  const ctrlSel=document.getElementById('ctrlMode');
  if(ctrlSel) ctrlSel.addEventListener('change', syncFsBtn);
  syncFsBtn();
})();

/* ---------- 🎚️ Calidad gráfica del juego ----------
   0%   = pixeleado (image-rendering: pixelated, Ruffle quality 'low')
   100% = mejor calidad (smooth, Ruffle quality 'best')
   Se aplica al #player vía CSS (image-rendering + filtro) y a Ruffle
   mediante player.config.quality cuando está disponible. */
function _qualityRuffleLevel(q){
  if(q<=20) return 'low';
  if(q<=50) return 'medium';
  if(q<=80) return 'high';
  return 'best';
}
function _qualityLabelText(q){
  if(q<=20) return '(Pixeleado)';
  if(q<=50) return '(Baja)';
  if(q<=80) return '(Alta)';
  return '(Mejor)';
}
function applyQuality(){
  const q = (cfg && typeof cfg.quality==='number') ? cfg.quality : 100;
  const root = document.documentElement;
  // --- Render mode: pixelated por debajo del 60% para que se note ---
  root.style.setProperty('--game-img-rendering', q < 60 ? 'pixelated' : 'auto');

  // --- Filtro visual: combinamos blur + contraste + saturación ---
  // 100% -> sin filtro (nítido)
  //  70% -> blur 0.6px, contraste casi normal
  //  50% -> blur 1.2px (notorio), saturación 0.95
  //  20% -> blur 2.4px, saturación 0.75, contraste 1.1 (look retro)
  //   0% -> blur 3.5px + pixelado fuerte
  let filter = 'none';
  if(q < 100){
    const t = (100 - q) / 100;            // 0 -> 1
    const blur = (t * 3.5).toFixed(2);    // 0 -> 3.5px
    const sat  = (1 - t * 0.30).toFixed(2); // 1 -> 0.7
    const con  = (1 + t * 0.15).toFixed(2); // 1 -> 1.15
    filter = `blur(${blur}px) saturate(${sat}) contrast(${con})`;
  }
  root.style.setProperty('--game-quality-filter', filter);

  // --- Aplicar también de forma directa a los canvas/video del player
  //     porque algunos motores (Ruffle/HTML5) crean canvas dinámicos
  //     que pueden no heredar bien las CSS vars ---
  try{
    const stage = document.getElementById('player') || document.getElementById('stage');
    if(stage){
      const nodes = stage.querySelectorAll('canvas, video, img, iframe, embed, object');
      nodes.forEach(n=>{
        n.style.imageRendering = q < 60 ? 'pixelated' : 'auto';
        n.style.filter = filter;
      });
    }
  }catch{}
  // Aplicar a Ruffle si existe el player
  try{
    if(typeof player !== 'undefined' && player){
      const lvl = _qualityRuffleLevel(q);
      // Ruffle acepta cambiar quality dinámicamente
      if(typeof player.config === 'object' && player.config){
        player.config.quality = lvl;
      }
      // API alterna: setConfig
      if(typeof player.setConfig === 'function'){
        try{ player.setConfig({ quality: lvl }); }catch{}
      }
    }
    // Guardar también en config global para futuras instancias
    if(window.RufflePlayer){
      window.RufflePlayer.config = Object.assign({}, window.RufflePlayer.config||{}, {
        quality: _qualityRuffleLevel(q)
      });
    }
  }catch{}
  // Sincronizar UI
  const r=document.getElementById('qualityRange');
  const v=document.getElementById('qualityVal');
  const l=document.getElementById('qualityLabel');
  if(r && r.value!=String(q)) r.value=q;
  if(v) v.textContent=q;
  if(l) l.textContent=_qualityLabelText(q);
}
(function setupQuality(){
  const btn=document.getElementById('qualityBtn');
  const modal=document.getElementById('qualityModal');
  const range=document.getElementById('qualityRange');
  const closeB=document.getElementById('qualityClose');
  const resetB=document.getElementById('qualityReset');
  if(!btn||!modal||!range) return;
  btn.addEventListener('click', ()=>{
    range.value = (cfg && typeof cfg.quality==='number') ? cfg.quality : 100;
    applyQuality();
    modal.classList.add('on');
  });
  if(closeB) closeB.addEventListener('click', ()=>modal.classList.remove('on'));
  range.addEventListener('input', ()=>{
    const q=parseInt(range.value,10)||0;
    if(!cfg) return;
    cfg.quality=q;
    try{ save(); }catch{}
    applyQuality();
  });
  if(resetB) resetB.addEventListener('click', ()=>{
    if(!cfg) return;
    cfg.quality=100;
    try{ save(); }catch{}
    applyQuality();
  });
  // Cerrar al click fuera de .box
  modal.addEventListener('click', (e)=>{
    if(e.target===modal) modal.classList.remove('on');
  });
  // Aplicar al cargar
  applyQuality();
  // Observar nuevos canvas/video creados por Ruffle u otros motores
  // para reaplicar el filtro de calidad sobre ellos.
  try{
    const stage = document.getElementById('player') || document.getElementById('stage');
    if(stage && 'MutationObserver' in window){
      const mo = new MutationObserver(()=>{ applyQuality(); });
      mo.observe(stage, { childList:true, subtree:true });
    }
  }catch{}
})();
// Nota: applyQuality() se invoca desde mountPlayer() tras cargar el SWF.

/* ---------- Saneamiento PC: garantizar que NINGÚN overlay/modal fantasma
   bloquee los clicks de los botones de la página al cargar. ---------- */
(function sanitizeOverlays(){
  // Cerrar cualquier modal/popover que pudiera haber quedado abierto
  document.querySelectorAll('.modal.on, #sizePop.on').forEach(n=>n.classList.remove('on'));
  // Si por algún flujo previo el modal/popover quedó dentro del #stage, devolverlo al body
  const stage=document.getElementById('stage');
  ['mapModal','settingsModal','volumeModal','configModal','helpModal','sizePop','qualityModal'].forEach(id=>{
    const n=document.getElementById(id);
    if(n && stage && n.parentElement===stage) document.body.appendChild(n);
  });
  // Si la capa táctil quedó dentro del stage fuera de fullscreen, devolverla
  const tl=document.getElementById('touchLayer');
  if(tl && stage && tl.parentElement===stage && !document.fullscreenElement){
    document.body.appendChild(tl);
  }
  // Quitar la clase fs-active si quedó pegada sin estar en fullscreen
  if(!document.fullscreenElement){
    document.body.classList.remove('fs-active','fs-rotated');
  }
})();

/* ===================================================================
   ===== EXTENSIONES v21: Volumen, Personalizar, FPS, Fix Móvil ======
   =================================================================== */

/* ---------- Persistencia extra ---------- */
function saveExtra(){
  try{
    localStorage.setItem('flashtouch_extra_v1', JSON.stringify({
      vol: window._volPct ?? 100,
      muted: !!window._muted,
      fpsOn: !!window._fpsOn,
      fpsPos: window._fpsPos || 'tl',
      colors: window._customColors || null
    }));
  }catch{}
}
function loadExtra(){
  try{
    const r=localStorage.getItem('flashtouch_extra_v1');
    if(!r) return {};
    return JSON.parse(r)||{};
  }catch{return {}}
}
const _extra = loadExtra();
window._volPct = (typeof _extra.vol==='number')? _extra.vol : 100;
window._muted = !!_extra.muted;
window._fpsOn = !!_extra.fpsOn;
window._fpsPos = (['tl','tr','bl','br'].includes(_extra.fpsPos)) ? _extra.fpsPos : 'tl';
window._customColors = _extra.colors || null;

/* ---------- VOLUMEN ---------- */
const volumeModal=document.getElementById('volumeModal');
const volRange=document.getElementById('volRange');
const volVal=document.getElementById('volVal');
const volMute=document.getElementById('volMute');
const volBtn=document.getElementById('volumeBtn');
function applyVolume(){
  const v = window._muted ? 0 : (window._volPct/100);
  try{
    if(player){
      if(typeof player.volume!=='undefined'){ try{player.volume = v;}catch{} }
      if(typeof player.setVolume==='function'){ try{player.setVolume(v);}catch{} }
      if(player.shadowRoot){
        player.shadowRoot.querySelectorAll('audio,video').forEach(a=>{ a.volume=v; a.muted=window._muted; });
      }
    }
    document.querySelectorAll('audio,video').forEach(a=>{ a.volume=v; a.muted=window._muted; });
  }catch{}
  volBtn.textContent = (window._muted || window._volPct===0) ? '🔇 Volumen' : '🔊 Volumen';
}
volBtn.onclick=()=>{
  volRange.value = window._volPct;
  volVal.textContent = window._volPct;
  volMute.textContent = window._muted ? '🔊 Activar audio' : '🔇 Silenciar';
  volumeModal.classList.add('on');
};
volRange.oninput=()=>{
  window._volPct = parseInt(volRange.value);
  volVal.textContent = window._volPct;
  if(window._volPct>0) window._muted=false;
  applyVolume(); saveExtra();
  volMute.textContent = window._muted ? '🔊 Activar audio' : '🔇 Silenciar';
};
volMute.onclick=()=>{
  window._muted = !window._muted;
  if(window._muted){
    // Al silenciar, mostrar y guardar el volumen al 0%
    window._volPct = 0;
  }else{
    // Al reactivar, si estaba en 0 volver al 100% para que se escuche
    if(window._volPct===0) window._volPct = 100;
  }
  volRange.value = window._volPct;
  volVal.textContent = window._volPct;
  applyVolume(); saveExtra();
  volMute.textContent = window._muted ? '🔊 Activar audio' : '🔇 Silenciar';
};
document.getElementById('volClose').onclick=()=>volumeModal.classList.remove('on');

/* Re-aplicar volumen + FPS cuando cambia el reproductor */
const _origMount = mountPlayer;
mountPlayer = function(src){
  _origMount(src);
  setTimeout(applyVolume, 600);
  setTimeout(applyVolume, 1500);
  if(window._fpsOn) startFps();
};

/* ---------- PERSONALIZAR (colores) ---------- */
const customizeModal=document.getElementById('customizeModal');
const colorBtnBg=document.getElementById('colorBtnBg');
const colorBtnText=document.getElementById('colorBtnText');
const colorBtnPress=document.getElementById('colorBtnPress');
const colorBtnBorder=document.getElementById('colorBtnBorder');
const DEFAULT_COLORS={bg:'#1f2330',text:'#e8ecf3',press:'#fb923c',border:'#2a2f3d'};
function applyCustomColors(){
  const c = window._customColors;
  const root = document.body;
  if(!c){
    root.classList.remove('custom-btn-colors');
    root.style.removeProperty('--cust-btn-bg');
    root.style.removeProperty('--cust-btn-text');
    root.style.removeProperty('--cust-btn-press');
    root.style.removeProperty('--cust-btn-border');
    return;
  }
  root.classList.add('custom-btn-colors');
  root.style.setProperty('--cust-btn-bg', c.bg);
  root.style.setProperty('--cust-btn-text', c.text);
  root.style.setProperty('--cust-btn-press', c.press);
  root.style.setProperty('--cust-btn-border', c.border);
}
document.getElementById('customizeBtn').onclick=()=>{
  const c = window._customColors || DEFAULT_COLORS;
  colorBtnBg.value=c.bg; colorBtnText.value=c.text;
  colorBtnPress.value=c.press; colorBtnBorder.value=c.border;
  customizeModal.classList.add('on');
};
function updateColorsFromInputs(){
  window._customColors = {
    bg: colorBtnBg.value, text: colorBtnText.value,
    press: colorBtnPress.value, border: colorBtnBorder.value
  };
  applyCustomColors(); saveExtra();
}
[colorBtnBg,colorBtnText,colorBtnPress,colorBtnBorder].forEach(i=>i.oninput=updateColorsFromInputs);
document.getElementById('customizeClose').onclick=()=>customizeModal.classList.remove('on');
document.getElementById('customizeReset').onclick=()=>{
  window._customColors=null; applyCustomColors(); saveExtra();
  colorBtnBg.value=DEFAULT_COLORS.bg; colorBtnText.value=DEFAULT_COLORS.text;
  colorBtnPress.value=DEFAULT_COLORS.press; colorBtnBorder.value=DEFAULT_COLORS.border;
};
applyCustomColors();

/* ---------- FPS counter (controlado desde Configuración) ---------- */
const fpsCounter=document.getElementById('fpsCounter');
let _fpsRaf=null, _fpsLast=0, _fpsFrames=0;
window._fpsPos = window._fpsPos || 'tl';
function fpsLoop(t){
  if(!window._fpsOn){ _fpsRaf=null; return; }
  _fpsFrames++;
  if(t - _fpsLast >= 1000){
    const fps = Math.round((_fpsFrames*1000)/(t-_fpsLast));
    fpsCounter.textContent = 'FPS: ' + fps;
    _fpsLast = t; _fpsFrames = 0;
  }
  _fpsRaf = requestAnimationFrame(fpsLoop);
}
function applyFpsPosition(){
  const pos = window._fpsPos || 'tl';
  fpsCounter.dataset.pos = pos;
  fpsCounter.style.top = ''; fpsCounter.style.bottom = '';
  fpsCounter.style.left = ''; fpsCounter.style.right = '';
  if(pos==='tl'){ fpsCounter.style.top='6px'; fpsCounter.style.left='6px'; }
  else if(pos==='tr'){ fpsCounter.style.top='6px'; fpsCounter.style.right='6px'; }
  else if(pos==='bl'){ fpsCounter.style.bottom='6px'; fpsCounter.style.left='6px'; }
  else if(pos==='br'){ fpsCounter.style.bottom='6px'; fpsCounter.style.right='6px'; }
}
function startFps(){
  applyFpsPosition();
  fpsCounter.style.display='block';
  _fpsLast = performance.now(); _fpsFrames = 0;
  if(!_fpsRaf) _fpsRaf = requestAnimationFrame(fpsLoop);
}
function stopFps(){
  fpsCounter.style.display='none';
  if(_fpsRaf){ cancelAnimationFrame(_fpsRaf); _fpsRaf=null; }
}
function applyFps(){
  if(window._fpsOn) startFps(); else stopFps();
}
applyFps();

/* ---------- FIX móvil + fullscreen: abrir popover de tamaño con TAP ----------
   En móvil, después de touchstart con preventDefault sobre el botón, el evento
   'click' a veces no se dispara, por eso abrimos el popover en touchend cuando
   no hubo movimiento. Funciona en pantalla normal Y en pantalla completa. */
function attachTouchTapEdit(el, openFn){
  let tapStartX=0, tapStartY=0, tapMoved=false, tapValid=false;
  el.addEventListener('touchstart', e=>{
    if(!editChk.checked) return;
    if(e.target && e.target.classList && e.target.classList.contains('delBadge')) return;
    const t=e.touches[0];
    tapStartX=t.clientX; tapStartY=t.clientY;
    tapMoved=false; tapValid=true;
  },{passive:true});
  el.addEventListener('touchmove', e=>{
    if(!tapValid) return;
    const t=e.touches[0];
    if(Math.abs(t.clientX-tapStartX)>6 || Math.abs(t.clientY-tapStartY)>6){
      tapMoved=true;
    }
  },{passive:true});
  el.addEventListener('touchend', e=>{
    if(!tapValid) return;
    tapValid=false;
    if(tapMoved) return;
    if(!editChk.checked) return;
    if(e.target && e.target.classList && e.target.classList.contains('delBadge')) return;
    setTimeout(()=>openFn(), 30);
  });
}
attachTouchTapEdit(joy, ()=>{
  openSizePop(joy,'joy',{kind:'arrow',dir:'up',el:null,fromJoy:true});
});
document.querySelectorAll('#arrows .ab').forEach(b=>{
  attachTouchTapEdit(b, ()=>{
    openSizePop(b,b.dataset.id,{kind:'arrow',dir:b.dataset.dir,el:b});
  });
});
const _origRenderPad = renderPad;
renderPad = function(){
  _origRenderPad();
  document.querySelectorAll('#pad .pbtn').forEach(b=>{
    attachTouchTapEdit(b, ()=>{
      if(b.dataset.kind==='pad'){
        openSizePop(b,b.dataset.id,{kind:'pad',i:+b.dataset.i,el:b});
      }else{
        openSizePop(b,b.dataset.id,{kind:'extra',extraId:b.dataset.extraId,el:b});
      }
    });
  });
};
renderPad();
applyConfig();

/* Aplicar volumen al cargar (cuando el reproductor exista) */
setTimeout(applyVolume, 500);

/* ===================================================================
   ===== EXTENSIONES v26: Configuración + Ayuda + Bloquear Ruffle ====
   =================================================================== */

/* ---------- Persistencia configuración avanzada ---------- */
function loadCfg2(){
  try{
    const r=localStorage.getItem('flashtouch_cfg2_v1');
    if(!r) return {};
    return JSON.parse(r)||{};
  }catch{return {}}
}
function saveCfg2(){
  try{
    localStorage.setItem('flashtouch_cfg2_v1', JSON.stringify({
      blockRuffleMenu: !!window._blockRuffleMenu
    }));
  }catch{}
}
const _cfg2 = loadCfg2();
// Por defecto desactivada
window._blockRuffleMenu = !!_cfg2.blockRuffleMenu;

/* ---------- Bloquear menú contextual de Ruffle ---------- */
const stageElForRuffle = document.getElementById('stage');
const playerHostEl = document.getElementById('player');

function _isInsideRufflePlayer(target, e){
  try{
    if(!target) return false;
    if(stageElForRuffle && stageElForRuffle.contains(target)) return true;
    if(playerHostEl && playerHostEl.contains(target)) return true;
    if(player && (target===player || (player.contains && player.contains(target)))) return true;
    if(e && e.composedPath){
      const path = e.composedPath();
      for(const n of path){
        if(n===stageElForRuffle || n===playerHostEl || n===player) return true;
      }
    }
  }catch{}
  return false;
}

function _blockCtx(e){
  if(!window._blockRuffleMenu) return;
  if(!_isInsideRufflePlayer(e.target, e)) return;
  e.preventDefault();
  e.stopPropagation();
  if(typeof e.stopImmediatePropagation==='function') e.stopImmediatePropagation();
  return false;
}

function _blockMouseRight(e){
  if(!window._blockRuffleMenu) return;
  if(e.button !== 2) return;
  if(!_isInsideRufflePlayer(e.target, e)) return;
  e.preventDefault();
  e.stopPropagation();
  if(typeof e.stopImmediatePropagation==='function') e.stopImmediatePropagation();
}

let _holdTimer=null;
function _blockHoldStart(e){
  if(!window._blockRuffleMenu) return;
  if(_holdTimer){ clearTimeout(_holdTimer); }
  _holdTimer=setTimeout(()=>{ _holdTimer=null; }, 800);
}
function _blockHoldEnd(){
  if(_holdTimer){ clearTimeout(_holdTimer); _holdTimer=null; }
}

// Listeners GLOBALES en captura: ganan a los handlers internos de Ruffle
window.addEventListener('contextmenu', _blockCtx, true);
document.addEventListener('contextmenu', _blockCtx, true);
window.addEventListener('pointerdown', _blockMouseRight, true);
window.addEventListener('mousedown', _blockMouseRight, true);
window.addEventListener('auxclick', _blockMouseRight, true);

stageElForRuffle.addEventListener('contextmenu', _blockCtx, true);
stageElForRuffle.addEventListener('touchstart', _blockHoldStart, {passive:true});
stageElForRuffle.addEventListener('touchend', _blockHoldEnd, {passive:true});
stageElForRuffle.addEventListener('touchcancel', _blockHoldEnd, {passive:true});

function _hookRuffleShadow(){
  try{
    if(player && player.shadowRoot){
      player.shadowRoot.addEventListener('contextmenu', _blockCtx, true);
      player.shadowRoot.addEventListener('pointerdown', _blockMouseRight, true);
      player.shadowRoot.addEventListener('mousedown', _blockMouseRight, true);
      player.shadowRoot.addEventListener('auxclick', _blockMouseRight, true);
      if(!player.shadowRoot.querySelector('style[data-flashtouch-hide-ctx]')){
        const st=document.createElement('style');
        st.setAttribute('data-flashtouch-hide-ctx','1');
        st.textContent = `
          :host(.ft-block-ctx) #context-menu,
          :host(.ft-block-ctx) .context-menu,
          :host(.ft-block-ctx) [class*="context"][class*="menu"]{
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `;
        player.shadowRoot.appendChild(st);
      }
    }
    _applyRuffleBlockClass();
  }catch{}
}
function _applyRuffleBlockClass(){
  try{
    if(player && player.classList){
      player.classList.toggle('ft-block-ctx', !!window._blockRuffleMenu);
    }
  }catch{}
}
const _origMount2 = mountPlayer;
mountPlayer = function(src){
  _origMount2(src);
  setTimeout(_hookRuffleShadow, 400);
  setTimeout(_hookRuffleShadow, 1500);
  setTimeout(_hookRuffleShadow, 3000);
};

/* ---------- Modal Configuración ---------- */
const configModal=document.getElementById('configModal');
const blockRuffleChk=document.getElementById('blockRuffleMenu');
const cfgFpsToggle=document.getElementById('cfgFpsToggle');
const cfgFpsPosWrap=document.getElementById('cfgFpsPosWrap');
const cfgFpsPos=document.getElementById('cfgFpsPos');

blockRuffleChk.checked = !!window._blockRuffleMenu;
cfgFpsToggle.checked = !!window._fpsOn;
cfgFpsPos.value = window._fpsPos || 'tl';
cfgFpsPosWrap.style.display = window._fpsOn ? 'block' : 'none';

document.getElementById('configBtn').onclick=()=>{
  blockRuffleChk.checked = !!window._blockRuffleMenu;
  cfgFpsToggle.checked = !!window._fpsOn;
  cfgFpsPos.value = window._fpsPos || 'tl';
  cfgFpsPosWrap.style.display = window._fpsOn ? 'block' : 'none';
  configModal.classList.add('on');
};
document.getElementById('configClose').onclick=()=>configModal.classList.remove('on');
document.getElementById('configCloseX').onclick=()=>configModal.classList.remove('on');
blockRuffleChk.onchange=()=>{
  window._blockRuffleMenu = blockRuffleChk.checked;
  saveCfg2();
  _applyRuffleBlockClass();
};
cfgFpsToggle.onchange=()=>{
  window._fpsOn = cfgFpsToggle.checked;
  cfgFpsPosWrap.style.display = window._fpsOn ? 'block' : 'none';
  saveExtra();
  applyFps();
};
cfgFpsPos.onchange=()=>{
  window._fpsPos = cfgFpsPos.value;
  saveExtra();
  applyFpsPosition();
};

_applyRuffleBlockClass();

/* ---------- Modal Ayuda ---------- */
const helpModal=document.getElementById('helpModal');
document.getElementById('helpBtn').onclick=()=>helpModal.classList.add('on');
document.getElementById('helpClose').onclick=()=>helpModal.classList.remove('on');
document.getElementById('helpCloseX').onclick=()=>helpModal.classList.remove('on');

/* ---------- Mover modales config/help al stage en fullscreen ---------- */
document.addEventListener('fullscreenchange',()=>{
  const fs=!!document.fullscreenElement;
  const stage=document.getElementById('stage');
  ['configModal','helpModal'].forEach(id=>{
    const n=document.getElementById(id);
    if(!n||!stage) return;
    if(fs){ stage.appendChild(n); }
    else {
      if(n.parentElement!==document.body) document.body.appendChild(n);
      n.classList.remove('on');
    }
  });
});

/* ---------- Sincronizar drag de esquinas con sliders/Estirar pantalla ---------- */
// Reforzar la sincronización al soltar la esquina disparando los eventos input
// para que cualquier handler dependiente (incluido el guardado) se ejecute.
document.querySelectorAll('.resize-handle').forEach(h=>{
  h.addEventListener('mouseup',()=>{
    try{
      stretchW.dispatchEvent(new Event('input',{bubbles:true}));
      stretchH.dispatchEvent(new Event('input',{bubbles:true}));
    }catch{}
  });
});