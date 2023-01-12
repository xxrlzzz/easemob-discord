import * as wasm from "./index_bg.wasm";

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

function getObject(idx) {
  return heap[idx];
}

function dropObject(idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

const lTextDecoder =
  typeof TextDecoder === "undefined"
    ? (0, module.require)("util").TextDecoder
    : TextDecoder;

let cachedTextDecoder = new lTextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
  if (cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder =
  typeof TextEncoder === "undefined"
    ? (0, module.require)("util").TextEncoder
    : TextEncoder;

let cachedTextEncoder = new lTextEncoder("utf-8");

const encodeString =
  typeof cachedTextEncoder.encodeInto === "function"
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length,
        };
      };

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3));
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
  if (cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
  if (cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64Memory0;
}

function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == "Object") {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor };
  const real = (...args) => {
    // First up with a closure we increment the internal reference
    // count. This ensures that the Rust closure environment won't
    // be deallocated while we're invoking it.
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      if (--state.cnt === 0) {
        wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
      } else {
        state.a = a;
      }
    }
  };
  real.original = state;

  return real;
}
function __wbg_adapter_28(arg0, arg1, arg2) {
  wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h2093e33a60176c8d(
    arg0,
    arg1,
    addHeapObject(arg2)
  );
}

/**
 */
export function wasm_main() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.wasm_main(retptr);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    if (r1) {
      throw takeObject(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

let cachedFloat32Memory0 = new Float32Array();

function getFloat32Memory0() {
  if (cachedFloat32Memory0.byteLength === 0) {
    cachedFloat32Memory0 = new Float32Array(wasm.memory.buffer);
  }
  return cachedFloat32Memory0;
}

function passArrayF32ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 4);
  getFloat32Memory0().set(arg, ptr / 4);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
/**
 * @returns {Array<any>}
 */
export function keyboard_status() {
  const ret = wasm.keyboard_status();
  return takeObject(ret);
}

/**
 * @param {Array<any>} keyboard_state
 */
export function update_remote_keyboard_state(keyboard_state) {
  wasm.update_remote_keyboard_state(addHeapObject(keyboard_state));
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
/**
 */
export class WebNes {
  static __wrap(ptr) {
    const obj = Object.create(WebNes.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_webnes_free(ptr);
  }
  /**
   * @returns {number}
   */
  get audio_sample_rate() {
    const ret = wasm.__wbg_get_webnes_audio_sample_rate(this.ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set audio_sample_rate(arg0) {
    wasm.__wbg_set_webnes_audio_sample_rate(this.ptr, arg0);
  }
  /**
   * @param {Uint8Array} data
   * @param {any} ele
   * @param {number} audio_sample_rate
   * @returns {WebNes}
   */
  static new(data, ele, audio_sample_rate) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.webnes_new(
        retptr,
        addHeapObject(data),
        addHeapObject(ele),
        audio_sample_rate
      );
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return WebNes.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   */
  do_frame() {
    wasm.webnes_do_frame(this.ptr);
  }
  /**
   * @param {number} buf_size
   * @param {Float32Array} out
   */
  audio_callback(buf_size, out) {
    try {
      var ptr0 = passArrayF32ToWasm0(out, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.webnes_audio_callback(this.ptr, buf_size, ptr0, len0);
    } finally {
      out.set(getFloat32Memory0().subarray(ptr0 / 4, ptr0 / 4 + len0));
      wasm.__wbindgen_free(ptr0, len0 * 4);
    }
  }
}

export function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return addHeapObject(ret);
}

export function __wbindgen_object_drop_ref(arg0) {
  takeObject(arg0);
}

export function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return addHeapObject(ret);
}

export function __wbindgen_is_string(arg0) {
  const ret = typeof getObject(arg0) === "string";
  return ret;
}

export function __wbindgen_string_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr0 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbindgen_cb_drop(arg0) {
  const obj = takeObject(arg0).original;
  if (obj.cnt-- == 1) {
    obj.a = 0;
    return true;
  }
  const ret = false;
  return ret;
}

export function __wbindgen_boolean_get(arg0) {
  const v = getObject(arg0);
  const ret = typeof v === "boolean" ? (v ? 1 : 0) : 2;
  return ret;
}

export function __wbindgen_object_clone_ref(arg0) {
  const ret = getObject(arg0);
  return addHeapObject(ret);
}

export function __wbindgen_number_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "number" ? obj : undefined;
  getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
}

export function __wbg_instanceof_WebGl2RenderingContext_fcfa91cd777063f3(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof WebGL2RenderingContext;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}

export function __wbg_bindVertexArray_9d12800e272184b0(arg0, arg1) {
  getObject(arg0).bindVertexArray(getObject(arg1));
}

export function __wbg_bufferData_8d206d7adf6751c0(arg0, arg1, arg2, arg3) {
  getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
}

export function __wbg_createVertexArray_8467a75e68fec199(arg0) {
  const ret = getObject(arg0).createVertexArray();
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_texImage2D_70de38e313a44f8a() {
  return handleError(function (
    arg0,
    arg1,
    arg2,
    arg3,
    arg4,
    arg5,
    arg6,
    arg7,
    arg8,
    arg9,
    arg10
  ) {
    getObject(arg0).texImage2D(
      arg1 >>> 0,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
      arg7 >>> 0,
      arg8 >>> 0,
      getObject(arg9),
      arg10 >>> 0
    );
  },
  arguments);
}

export function __wbg_activeTexture_6a9afd67cc0ade73(arg0, arg1) {
  getObject(arg0).activeTexture(arg1 >>> 0);
}

export function __wbg_attachShader_90ad543fb1bccb18(arg0, arg1, arg2) {
  getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
}

export function __wbg_bindBuffer_66e359418f5c82d7(arg0, arg1, arg2) {
  getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
}

export function __wbg_bindTexture_ae9620ea4a6ffb97(arg0, arg1, arg2) {
  getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
}

export function __wbg_clear_05614d3b84e96aae(arg0, arg1) {
  getObject(arg0).clear(arg1 >>> 0);
}

export function __wbg_compileShader_822f38928f6f2a08(arg0, arg1) {
  getObject(arg0).compileShader(getObject(arg1));
}

export function __wbg_createBuffer_a6cffb7f7d5b92a3(arg0) {
  const ret = getObject(arg0).createBuffer();
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_createProgram_dc6b23d3caa1d86e(arg0) {
  const ret = getObject(arg0).createProgram();
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_createShader_46a66dce5a9e22d0(arg0, arg1) {
  const ret = getObject(arg0).createShader(arg1 >>> 0);
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_createTexture_269f67d411bdc4dc(arg0) {
  const ret = getObject(arg0).createTexture();
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_drawElements_241caa588795bcb1(
  arg0,
  arg1,
  arg2,
  arg3,
  arg4
) {
  getObject(arg0).drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
}

export function __wbg_enableVertexAttribArray_a1ffc091f3999354(arg0, arg1) {
  getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
}

export function __wbg_getAttribLocation_b6cb917615347567(
  arg0,
  arg1,
  arg2,
  arg3
) {
  const ret = getObject(arg0).getAttribLocation(
    getObject(arg1),
    getStringFromWasm0(arg2, arg3)
  );
  return ret;
}

export function __wbg_getError_8de2be43ffb2c4e0(arg0) {
  const ret = getObject(arg0).getError();
  return ret;
}

export function __wbg_getProgramInfoLog_1e37a3d1d090ec1c(arg0, arg1, arg2) {
  const ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
  var ptr0 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbg_getProgramParameter_acf4ae158143e2b2(arg0, arg1, arg2) {
  const ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_getShaderInfoLog_451545b963646762(arg0, arg1, arg2) {
  const ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
  var ptr0 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbg_getShaderParameter_6cd8c36fded266ea(arg0, arg1, arg2) {
  const ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_getUniformLocation_0da0c93f626244a2(
  arg0,
  arg1,
  arg2,
  arg3
) {
  const ret = getObject(arg0).getUniformLocation(
    getObject(arg1),
    getStringFromWasm0(arg2, arg3)
  );
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_linkProgram_c33885d9ea798810(arg0, arg1) {
  getObject(arg0).linkProgram(getObject(arg1));
}

export function __wbg_shaderSource_5111981e7afb61fb(arg0, arg1, arg2, arg3) {
  getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
}

export function __wbg_texParameteri_21fd6b6b394882c9(arg0, arg1, arg2, arg3) {
  getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
}

export function __wbg_uniform1i_49986febd844f2c4(arg0, arg1, arg2) {
  getObject(arg0).uniform1i(getObject(arg1), arg2);
}

export function __wbg_useProgram_35a58ac1e0d9577b(arg0, arg1) {
  getObject(arg0).useProgram(getObject(arg1));
}

export function __wbg_vertexAttribPointer_3b06d737566f0745(
  arg0,
  arg1,
  arg2,
  arg3,
  arg4,
  arg5,
  arg6
) {
  getObject(arg0).vertexAttribPointer(
    arg1 >>> 0,
    arg2,
    arg3 >>> 0,
    arg4 !== 0,
    arg5,
    arg6
  );
}

export function __wbg_instanceof_Window_acc97ff9f5d2c7b4(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Window;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}

export function __wbg_document_3ead31dbcad65886(arg0) {
  const ret = getObject(arg0).document;
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_setonblur_c37dcc1a4d1b582e(arg0, arg1) {
  getObject(arg0).onblur = getObject(arg1);
}

export function __wbg_setonfocus_a0401cd803a0ff12(arg0, arg1) {
  getObject(arg0).onfocus = getObject(arg1);
}

export function __wbg_instanceof_HtmlCanvasElement_97761617af6ea089(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof HTMLCanvasElement;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}

export function __wbg_getContext_4d5e97892c1b206a() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
  }, arguments);
}

export function __wbg_addEventListener_cbe4c6f619b032f3() {
  return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addEventListener(
      getStringFromWasm0(arg1, arg2),
      getObject(arg3)
    );
  }, arguments);
}

export function __wbg_getElementById_3a708b83e4f034d7(arg0, arg1, arg2) {
  const ret = getObject(arg0).getElementById(getStringFromWasm0(arg1, arg2));
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_debug_64711eb2fc6980ef(arg0, arg1, arg2, arg3) {
  console.debug(
    getObject(arg0),
    getObject(arg1),
    getObject(arg2),
    getObject(arg3)
  );
}

export function __wbg_error_ef9a0be47931175f(arg0) {
  console.error(getObject(arg0));
}

export function __wbg_error_00c5d571f754f629(arg0, arg1, arg2, arg3) {
  console.error(
    getObject(arg0),
    getObject(arg1),
    getObject(arg2),
    getObject(arg3)
  );
}

export function __wbg_info_d60a960a4e955dc2(arg0, arg1, arg2, arg3) {
  console.info(
    getObject(arg0),
    getObject(arg1),
    getObject(arg2),
    getObject(arg3)
  );
}

export function __wbg_log_de258f66ad9eb784(arg0, arg1, arg2, arg3) {
  console.log(
    getObject(arg0),
    getObject(arg1),
    getObject(arg2),
    getObject(arg3)
  );
}

export function __wbg_warn_be542501a57387a5(arg0, arg1, arg2, arg3) {
  console.warn(
    getObject(arg0),
    getObject(arg1),
    getObject(arg2),
    getObject(arg3)
  );
}

export function __wbg_keyCode_72faed4278f77f2c(arg0) {
  const ret = getObject(arg0).keyCode;
  return ret;
}

export function __wbg_get_57245cc7d7c7619d(arg0, arg1) {
  const ret = getObject(arg0)[arg1 >>> 0];
  return addHeapObject(ret);
}

export function __wbg_length_6e3bbe7c8bd4dbd8(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}

export function __wbg_new_1d9a920c6bfc44a8() {
  const ret = new Array();
  return addHeapObject(ret);
}

export function __wbg_newnoargs_b5b063fc6c2f0376(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}

export function __wbg_call_97ae9d8645dc388b() {
  return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_self_6d479506f72c6a71() {
  return handleError(function () {
    // const ret = self.self;
    // return addHeapObject(ret);
  }, arguments);
}

export function __wbg_window_f2557cc78490aceb() {
  return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_globalThis_7f206bda628d5286() {
  return handleError(function () {
    // const ret = globalThis.globalThis;
    // return addHeapObject(ret);
  }, arguments);
}

export function __wbg_global_ba75c50d1cf384f4() {
  return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbindgen_is_undefined(arg0) {
  const ret = getObject(arg0) === undefined;
  return ret;
}

export function __wbg_push_740e4b286702d964(arg0, arg1) {
  const ret = getObject(arg0).push(getObject(arg1));
  return ret;
}

export function __wbg_buffer_3f3d764d4747d564(arg0) {
  const ret = getObject(arg0).buffer;
  return addHeapObject(ret);
}

export function __wbg_newwithbyteoffsetandlength_7be13f49af2b2012(
  arg0,
  arg1,
  arg2
) {
  const ret = new Int32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_newwithbyteoffsetandlength_d9aa266703cb98be(
  arg0,
  arg1,
  arg2
) {
  const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_new_8c3f0052272a457a(arg0) {
  const ret = new Uint8Array(getObject(arg0));
  return addHeapObject(ret);
}

export function __wbg_set_83db9690f9353e79(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0);
}

export function __wbg_length_9e1ae1900cb0fbd5(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}

export function __wbg_newwithbyteoffsetandlength_be22e5fcf4f69ab4(
  arg0,
  arg1,
  arg2
) {
  const ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(getObject(arg1));
  const ptr0 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}

export function __wbindgen_memory() {
  const ret = wasm.memory;
  return addHeapObject(ret);
}

export function __wbindgen_closure_wrapper231(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 66, __wbg_adapter_28);
  return addHeapObject(ret);
}

export function __wbindgen_closure_wrapper233(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 66, __wbg_adapter_28);
  return addHeapObject(ret);
}
