/* tslint:disable */
/* eslint-disable */
/**
*/
export function wasm_main(): void;
/**
* @returns {Array<any>}
*/
export function keyboard_status(): Array<any>;
/**
* @param {Array<any>} keyboard_state
*/
export function update_remote_keyboard_state(keyboard_state: Array<any>): void;
/**
*/
export class WebNes {
  free(): void;
/**
* @param {Uint8Array} data
* @param {any} ele
* @param {number} audio_sample_rate
* @returns {WebNes}
*/
  static new(data: Uint8Array, ele: any, audio_sample_rate: number): WebNes;
/**
*/
  do_frame(): void;
/**
* @param {number} buf_size
* @param {Float32Array} out
*/
  audio_callback(buf_size: number, out: Float32Array): void;
/**
*/
  audio_sample_rate: number;
}
