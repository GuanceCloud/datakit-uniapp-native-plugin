/**
 * Example build-mode switch.
 *
 * Normal UniApp builds use the UTS plugin and initialize the SDK in JS.
 * Before using the HBuilderX menu to make a UniMP WGT, comment the UniApp
 * export and uncomment the WGT export. Keep exactly one export active.
 */

// Normal UniApp build
export * from './gc-build-entry.uniapp.js'

// UniMP WGT build
// export * from './gc-build-entry.wgt.js'
