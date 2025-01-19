var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
export const SERVER_URL = 'http://127.0.0.1:9529'
export const ANDROID_APP_ID = 'android_app_id'
export const IOS_APP_ID = 'ios_app_id'
export const TRACK_ID = 'track_id'

export default {

	getUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	request(requestUrl, header = {}) {
		uni.request({
			url: requestUrl,
			header: header,
			success() {
				console.log('success');
			},
			complete() {
				console.log('complete');
			}
		});
	},
	rumRequest(requestUrl,method,header = {}){
		    let key = this.getUUID();
			var traceHeader = tracer.getTraceHeader({
				'key': key,
				'url': requestUrl,
			})
			traceHeader = Object.assign({},traceHeader, header)
			rum.startResource({
				'key':key,
				'property':{
					'startResource_property':'uni_test'
				}
			});
			var responseHeader;
			var responseBody;
			var resourceStatus;
			uni.request({
				url: requestUrl,
				method: method,
				header: traceHeader,
				success: (res) => {
					console.log('调用getTraceHeader:' + JSON.stringify(header))
					responseHeader = res.header;
					responseBody = res.data;
					resourceStatus = res.statusCode;
				},
				fail: (err) =>{
					responseBody = err.errMsg;
				},
				complete() {
					rum.stopResource({
						'key':key,
						'property':{
							'stopResource_property':'uni_test'
						}
					})
					rum.addResource({
						'key': key,
						'content': {
							'url': requestUrl,
							'httpMethod': method,
							'requestHeader': header,
							'responseHeader': responseHeader,
							'responseBody': responseBody,
							'resourceStatus': resourceStatus,
						}
					})
				}
			});
	}
}
