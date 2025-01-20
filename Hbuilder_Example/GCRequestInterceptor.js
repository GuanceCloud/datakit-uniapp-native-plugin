import Utils from './utils.js';
export function reqInterceptor() {
   var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
   uni.addInterceptor('request', {
     invoke(args) {
   	    var header = tracer.getTraceHeader({
   		'url': args.url,
   	    })
        args.header = Object.assign({},args.header, header)
     }
   })
}