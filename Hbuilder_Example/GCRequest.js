var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
// Get platform information
const platform = uni.getSystemInfoSync().platform;

export default {
    getUUID() {
    	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = Math.random() * 16 | 0,
    			v = c == 'x' ? r : (r & 0x3 | 0x8);
    		return v.toString(16);
    	});
    },
    isEmpty(value) {
	    return value === null || value === undefined;
	},
	/// Filter platforms through the filterPlatform parameter. When `enableNativeUserResource` is enabled,
	//  Since uniapp network requests on iOS are implemented using system APIs, all resource data on iOS can be collected together,
	/// At this time, please disable manual collection in uniapp on iOS to prevent duplicate data collection.
	/// Example: ["ios"], iOS side is set not to perform trace tracking and RUM collection.
    request(options){ 
		let key = this.getUUID();
		var filter;
		if(this.isEmpty(options.filterPlatform)){
			filter = false
		}else{
	        filter = options.filterPlatform.includes(platform);
		}
		var traceHeader = {}
		if(filter == false){
		  // trace association RUM
		  var traceHeader = tracer.getTraceHeader({
		  	'key': key,
		  	'url': options.url,
		  })
		}
		traceHeader = Object.assign({},traceHeader, options.header)
		rum.startResource({
			'key':key,
		});
		var responseHeader;
		var responseBody;
		var resourceStatus;
		return uni.request({
			...options,
			header: traceHeader,
			success: (res) => {
				if(!filter){
				  responseHeader = res.header;
				  responseBody = res.data.toString();
				  resourceStatus = res.statusCode;
				}
				if(!this.isEmpty(options.success)){
					options.success(res);
				}
			},
			fail:(err) => {
				if(!filter){
				  responseBody = err.errMsg;
				}
				if(!this.isEmpty(options.fail)){
					options.fail(err);
				}
			},
			complete() {
				if(!filter){
				  rum.stopResource({
				  	'key':key,
				  })
				  rum.addResource({
				  	'key': key,
				  	'content': {
				  		'url': options.url,
				  		'httpMethod': options.method,
				  		'requestHeader': traceHeader,
				  		'responseHeader': responseHeader,
				  		'responseBody': responseBody,
				  		'resourceStatus': resourceStatus,
				  	}
				  })
				}
				if (options.complete !== null || options.complete !== undefined){
					options.complete();
				}
			}
		});
	}
} 
