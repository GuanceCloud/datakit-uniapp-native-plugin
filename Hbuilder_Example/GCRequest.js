var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
// 获取平台信息
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
	/// 通过 filterPlatform 参数进行平台过滤，当开启 `enableNativeUserResource` 时，
	//  由于 uniapp 的网络请求在 iOS 端是使用系统 API 实现的，iOS 所有 resource 数据能够一并采集，
	/// 此时请屏蔽 iOS 端 uniapp 中手动采集，以防止数据重复采集。
	/// 例:["ios"], iOS 端设置不进行 trace 追踪与 RUM 采集。
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
		  // trace 关联 RUM
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
